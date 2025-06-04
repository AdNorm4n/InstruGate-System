import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage

User = get_user_model()

# In-memory store for client-engineer assignments
client_engineer_map = {}  # {client_username: engineer_username}

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['room_name']
        self.user = self.scope['user']

        if not self.user.is_authenticated or self.user.username != self.username:
            await self.close(code=4001)
            return

        self.personal_group = f'chat_{self.username}'
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        if getattr(self.user, 'role', None) == 'proposal_engineer':
            await self.channel_layer.group_add('proposal_engineers', self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.personal_group, self.channel_name)
        if getattr(self.user, 'role', None) == 'proposal_engineer':
            await self.channel_layer.group_discard('proposal_engineers', self.channel_name)
        # Clean up assignments if engineer disconnects
        if self.username in client_engineer_map.values():
            for client, engineer in list(client_engineer_map.items()):
                if engineer == self.username:
                    del client_engineer_map[client]
                    await self.channel_layer.group_send(
                        f'chat_{client}',
                        {
                            'type': 'chat.message',
                            'message': 'Your support agent has disconnected. Send a new message to connect with another agent.',
                            'sender': 'system',
                            'sender_type': 'system'
                        }
                    )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
            return

        message_text = data.get('message', '').strip()
        sender_type = data.get('sender_type')
        # Safely handle receiver (may be null or missing)
        receiver_username = (data.get('receiver') or '').strip()
        sender_user = self.user

        if not (message_text and sender_user.is_authenticated and sender_type in ('client', 'agent')):
            return

        # Case 1: Client sends help request (no receiver)
        if sender_type == 'client' and not receiver_username:
            if sender_user.username in client_engineer_map:
                # Client already assigned, send to their engineer
                engineer = client_engineer_map[sender_user.username]
                await self._save_message(
                    room_name=engineer,
                    user=sender_user,
                    sender_type='client',
                    content=message_text
                )
                await self.channel_layer.group_send(
                    f'chat_{engineer}',
                    {
                        'type': 'chat.message',
                        'message': message_text,
                        'sender': sender_user.username,
                        'sender_type': 'client'
                    }
                )
                return

            # New help request, broadcast to proposal engineers
            await self._save_message(
                room_name=sender_user.username,
                user=sender_user,
                sender_type='client',
                content=message_text
            )
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

        # Case 2: Client messages assigned engineer
        if sender_type == 'client' and receiver_username:
            if client_engineer_map.get(sender_user.username) == receiver_username:
                await self._save_message(
                    room_name=receiver_username,
                    user=sender_user,
                    sender_type='client',
                    content=message_text
                )
                await self.channel_layer.group_send(
                    f'chat_{receiver_username}',
                    {
                        'type': 'chat.message',
                        'message': message_text,
                        'sender': sender_user.username,
                        'sender_type': 'client'
                    }
                )
            return

        # Case 3: Engineer responds to client
        if sender_type == 'agent' and receiver_username:
            if receiver_username not in client_engineer_map:
                # First response, assign engineer
                client_engineer_map[receiver_username] = sender_user.username
                await self.channel_layer.group_send(
                    f'chat_{receiver_username}',
                    {
                        'type': 'chat.message',
                        'message': f'{sender_user.username} is assisting you.',
                        'sender': 'system',
                        'sender_type': 'system'
                    }
                )

            if client_engineer_map[receiver_username] == sender_user.username:
                await self._save_message(
                    room_name=receiver_username,
                    user=sender_user,
                    sender_type='agent',
                    content=message_text
                )
                await self.channel_layer.group_send(
                    f'chat_{receiver_username}',
                    {
                        'type': 'chat.message',
                        'message': message_text,
                        'sender': sender_user.username,
                        'sender_type': 'agent'
                    }
                )
            return

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
            'sender_type': event['sender_type'],
        }))

    @database_sync_to_async
    def _save_message(self, room_name, user, sender_type, content):
        return ChatMessage.objects.create(
            room_name=room_name,
            sender=user,
            sender_type=sender_type,
            content=content
        )