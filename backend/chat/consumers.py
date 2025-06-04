# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from django.contrib.auth import get_user_model
from .models import ChatMessage

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        - Every user connects to /ws/chat/<their_username>/.
        - We join group "chat_<their_username>" so that direct messages to them arrive.
        - If role == 'proposal_engineer', also join "proposal_engineers" to receive any new
          client requests.
        """
        self.username = self.scope['url_route']['kwargs']['room_name']
        self.user = self.scope['user']

        # Only allow if authenticated and username matches scope
        if not self.user.is_authenticated or self.user.username != self.username:
            # Reject the connection if something’s off
            await self.close(code=4001)
            return

        # Personal group for direct messages
        self.personal_group = f'chat_{self.username}'
        await self.channel_layer.group_add(
            self.personal_group,
            self.channel_name
        )

        # If this user is a proposal engineer, also join the shared group
        if getattr(self.user, 'role', None) == 'proposal_engineer':
            await self.channel_layer.group_add(
                'proposal_engineers',
                self.channel_name
            )

        await self.accept()

    async def disconnect(self, close_code):
        # Clean up personal group
        await self.channel_layer.group_discard(
            f'chat_{self.username}',
            self.channel_name
        )

        # If engineer, leave the shared group
        if getattr(self.user, 'role', None) == 'proposal_engineer':
            await self.channel_layer.group_discard(
                'proposal_engineers',
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Expect JSON:
          {
            "message": "<text>",
            "sender_type": "client" or "agent",
            "receiver": "<optional>"
          }

        1) If sender_type == "client" and no receiver:
             - Broadcast to group "proposal_engineers"
             - Save with room_name = <client_username> (so admins can query later)
        2) If sender_type == "client" and receiver == "<engineer_username>":
             - Save with room_name = <engineer_username>
             - group_send to "chat_<engineer_username>"
        3) If sender_type == "agent" and receiver == "<client_username>":
             - Save with room_name = <client_username>
             - group_send to "chat_<client_username>"
        """
        data = json.loads(text_data)
        message_text = data.get('message', '').strip()
        sender_type = data.get('sender_type')
        receiver_username = data.get('receiver', '').strip()
        sender_user = self.user  # same as self.scope['user']

        # Basic validation
        if not (message_text and sender_user.is_authenticated and sender_type in ('client', 'agent')):
            return

        # Case 1: client wants help, broadcast to all proposal engineers
        if sender_type == 'client' and not receiver_username:
            # 1a. Persist message under the client’s own username
            await self._save_message(
                room_name=sender_user.username,
                user=sender_user,
                sender_type='client',
                content=message_text
            )

            # 1b. Broadcast to all engineers
            await self.channel_layer.group_send(
                'proposal_engineers',
                {
                    'type': 'chat.message',
                    'message': message_text,
                    'sender': sender_user.username,
                    'sender_type': 'client'
                }
            )
            return

        # For the remaining cases, a receiver must be provided
        if not receiver_username:
            return  # nothing more to do

        # Case 2: client selected a specific engineer (or is directly messaging one)
        if sender_type == 'client' and receiver_username:
            # Save under room_name = <engineer>
            await self._save_message(
                room_name=receiver_username,
                user=sender_user,
                sender_type='client',
                content=message_text
            )
            # Only send to that one engineer’s personal group
            target_group = f'chat_{receiver_username}'
            await self.channel_layer.group_send(
                target_group,
                {
                    'type': 'chat.message',
                    'message': message_text,
                    'sender': sender_user.username,
                    'sender_type': 'client'
                }
            )
            return

        # Case 3: agent replying to a client
        if sender_type == 'agent' and receiver_username:
            # Save under room_name = <client>
            await self._save_message(
                room_name=receiver_username,
                user=sender_user,
                sender_type='agent',
                content=message_text
            )
            # Send only to the client’s personal group
            target_group = f'chat_{receiver_username}'
            await self.channel_layer.group_send(
                target_group,
                {
                    'type': 'chat.message',
                    'message': message_text,
                    'sender': sender_user.username,
                    'sender_type': 'agent'
                }
            )
            return

        # Any other scenario: do nothing
        return

    async def chat_message(self, event):
        """
        Receives events of type='chat.message' from group_send(...) calls.
        Just forwards the JSON to the consumer’s WebSocket.
        """
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'sender_type': event['sender_type'],
        }))

    @database_sync_to_async
    def _save_message(self, room_name, user, sender_type, content):
        """
        Wrap the Django ORM in database_sync_to_async for async safety.
        """
        return ChatMessage.objects.create(
            room_name=room_name,
            sender=user,
            sender_type=sender_type,
            content=content
        )
