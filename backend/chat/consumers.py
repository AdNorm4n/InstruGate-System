import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatMessage

logger = logging.getLogger(__name__)
User = get_user_model()

client_engineer_map = {}  # {client_username: engineer_username}

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['room_name']
        self.user = self.scope['user']
        
        if not self.user.is_authenticated or self.user.username != self.username:
            logger.error(f"Connection rejected for {self.username}")
            await self.close(code=4001)
            return

        self.personal_group = f'chat_{self.username}'
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        try:
            if getattr(self.user, 'role', None) == 'proposal_engineer':
                await self.channel_layer.group_add('engineers', self.channel_name)
                await self._send_offline_messages()
            else:
                await self._mark_messages_read(self.username)
        except Exception as e:
            logger.error(f"Error during connect for {self.username}: {str(e)}")
            await self.close(code=4002)
            return

        await self.accept()
        logger.info(f"Connected: {self.username}")

    async def disconnect(self, close_code):
        if hasattr(self, 'personal_group') and hasattr(self, 'channel_name'):
            await self.channel_layer.group_discard(self.personal_group, self.channel_name)

        try:
            if getattr(self.user, 'role', None) == 'proposal_engineer':
                await self.channel_layer.group_discard('engineers', self.channel_name)
                if self.username in client_engineer_map.values():
                    for client, engineer in list(client_engineer_map.items()):
                        if engineer == self.username:
                            del client_engineer_map[client]
                            await self.channel_layer.group_send(
                                f'chat_{client}',
                                {
                                    'type': 'chat.message',
                                    'message': 'Agent disconnected. Send a message to reconnect.',
                                    'sender': 'system',
                                    'sender_type': 'system',
                                    'client': client,
                                    'is_read': True,
                                    'timestamp': None,
                                    'message_id': None,
                                }
                            )
                            await self.channel_layer.group_send(
                                'engineers',
                                {
                                    'type': 'chat.message',
                                    'message': f'{client} is available.',
                                    'sender': 'system',
                                    'sender_type': 'system',
                                    'client': client,
                                    'is_read': True,
                                    'timestamp': None,
                                    'message_id': None,
                                }
                            )
            else:
                if self.username in client_engineer_map:
                    engineer = client_engineer_map[self.username]
                    del client_engineer_map[self.username]
                    await self.channel_layer.group_send(
                        f'chat_{self.username}',
                        {
                            'type': 'chat.message',
                            'message': 'Client disconnected.',
                            'sender': 'system',
                            'sender_type': 'system',
                            'client': self.username,
                            'is_read': True,
                            'timestamp': None,
                            'message_id': None,
                        }
                    )
                    await self.channel_layer.group_send(
                        f'chat_{engineer}',
                        {
                            'type': 'chat.message',
                            'message': f'{self.username} disconnected.',
                            'sender': 'system',
                            'sender_type': 'system',
                            'client': self.username,
                            'is_read': True,
                            'timestamp': None,
                            'message_id': None,
                        }
                    )
                    await self.channel_layer.group_send(
                        'engineers',
                        {
                            'type': 'chat.message',
                            'message': f'{self.username} is available.',
                            'sender': 'system',
                            'sender_type': 'system',
                            'client': self.username,
                            'is_read': True,
                            'timestamp': None,
                            'message_id': None,
                        }
                    )
        except Exception as e:
            logger.error(f"Error during disconnect for {self.username}: {str(e)}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON'}))
            return

        message_type = data.get('message_type', 'message')
        message = data.get('message', '').strip()
        file_name = data.get('file_name')
        sender_type = data.get('sender_type')
        receiver = data.get('receiver', '').strip()
        room_name = data.get('room_name', '')
        sender = self.user

        if message_type == 'mark_read' and room_name:
            if (sender_type == 'agent' and getattr(self.user, 'role', None) == 'proposal_engineer') or \
               (sender_type == 'client' and room_name == sender.username):
                try:
                    await self._mark_messages_read(room_name)
                except Exception as e:
                    logger.error(f"Error marking messages read for {room_name}: {str(e)}")
                    await self.send(text_data=json.dumps({'error': 'Failed to mark messages as read'}))
            return

        if not (sender.is_authenticated and sender_type in ('client', 'agent')):
            await self.send(text_data=json.dumps({'error': 'Invalid sender or authentication'}))
            return

        try:
            if sender_type == 'client':
                await self._mark_messages_read(sender.username)
                msg = None
                if file_name:
                    if not file_name.lower().endswith('.pdf'):
                        await self.send(text_data=json.dumps({'error': 'Only PDF files are allowed'}))
                        return
                    msg = await self._save_file_message(
                        sender.username, sender, 'client', message, file_name, assistance=None
                    )
                elif message:
                    msg = await self._save_message(sender.username, sender, 'client', message, assistance=None)
                if msg:
                    file_url = msg.file.url if msg.file else None
                    file_name = msg.file_name if msg.file else None
                    await self.channel_layer.group_send(
                        f'chat_{sender.username}',
                        {
                            'type': 'chat.message',
                            'message': message,
                            'sender': sender.username,
                            'sender_type': 'client',
                            'client': sender.username,
                            'is_read': False,
                            'timestamp': msg.timestamp.isoformat(),
                            'message_id': str(msg.id),
                            'file_url': file_url,
                            'file_name': file_name,
                        }
                    )
                    if sender.username in client_engineer_map:
                        engineer = client_engineer_map[sender.username]
                        await self.channel_layer.group_send(
                            f'chat_{engineer}',
                            {
                                'type': 'chat.message',
                                'message': message,
                                'sender': sender.username,
                                'sender_type': 'client',
                                'client': sender.username,
                                'is_read': False,
                                'timestamp': msg.timestamp.isoformat(),
                                'message_id': str(msg.id),
                                'file_url': file_url,
                                'file_name': file_name,
                            }
                        )
                    else:
                        await self.channel_layer.group_send(
                            'engineers',
                            {
                                'type': 'chat.message',
                                'message': message,
                                'sender': sender.username,
                                'sender_type': 'client',
                                'client': sender.username,
                                'is_read': False,
                                'timestamp': msg.timestamp.isoformat(),
                                'message_id': str(msg.id),
                                'file_url': file_url,
                                'file_name': file_name,
                            }
                        )

            if sender_type == 'agent' and receiver:
                if not receiver:
                    await self.send(text_data=json.dumps({'error': 'Receiver required for agent message'}))
                    return
                if receiver in client_engineer_map and client_engineer_map[receiver] != sender.username:
                    await self.send(text_data=json.dumps({
                        'type': 'chat.message',
                        'message': f'{receiver} is with another engineer.',
                        'sender': 'system',
                        'sender_type': 'system',
                        'client': receiver,
                        'is_read': True,
                        'timestamp': None,
                        'message_id': None,
                    }))
                    return

                if receiver not in client_engineer_map:
                    client_engineer_map[receiver] = sender.username
                    await self._update_conversation_assistance(receiver, sender)
                    await self.channel_layer.group_send(
                        f'chat_{receiver}',
                        {
                            'type': 'chat.message',
                            'message': f'{sender.username} is assisting you.',
                            'sender': 'system',
                            'sender_type': 'system',
                            'client': receiver,
                            'is_read': True,
                            'timestamp': None,
                            'message_id': None,
                        }
                    )
                    await self.channel_layer.group_send(
                        'engineers',
                        {
                            'type': 'chat.message',
                            'message': f'{receiver} is with {sender.username}.',
                            'sender': 'system',
                            'sender_type': 'system',
                            'client': receiver,
                            'is_read': True,
                            'timestamp': None,
                            'message_id': None,
                        }
                    )
                    await self.channel_layer.group_add(
                        f'chat_{receiver}', self.channel_name
                    )

                msg = None
                if file_name:
                    if not file_name.lower().endswith('.pdf'):
                        await self.send(text_data=json.dumps({'error': 'Only PDF files allowed'}))
                        return
                    msg = await self._save_file_message(
                        receiver, sender, 'agent', message, file_name, sender
                    )
                elif message:
                    msg = await self._save_message(receiver, sender, 'agent', message, sender)
                if msg:
                    file_url = msg.file.url if msg.file else None
                    file_name = msg.file_name if msg.file else None
                    await self._update_conversation_assistance(receiver, sender)
                    await self.channel_layer.group_send(
                        f'chat_{receiver}',
                        {
                            'type': 'chat.message',
                            'message': message,
                            'sender': sender.username,
                            'sender_type': 'agent',
                            'client': receiver,
                            'is_read': False,
                            'timestamp': msg.timestamp.isoformat(),
                            'message_id': str(msg.id),
                            'file_url': file_url,
                            'file_name': file_name,
                        }
                    )
                    await self.channel_layer.group_send(
                        f'chat_{sender.username}',
                        {
                            'type': 'chat.message',
                            'message': message,
                            'sender': sender.username,
                            'sender_type': 'agent',
                            'client': receiver,
                            'is_read': False,
                            'timestamp': msg.timestamp.isoformat(),
                            'message_id': str(msg.id),
                            'file_url': file_url,
                            'file_name': file_name,
                        }
                    )
        except Exception as e:
            logger.error(f"Error processing message from {sender.username}: {str(e)}")
            await self.send(text_data=json.dumps({'error': 'Message processing failed'}))

    async def chat_message(self, event):
        try:
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'sender': event['sender'],
                'sender_type': event['sender_type'],
                'client': event['client'],
                'is_read': event.get('is_read', False),
                'timestamp': event.get('timestamp'),
                'message_id': event.get('message_id'),
                'file_url': event.get('file_url'),
                'file_name': event.get('file_name'),
            }))
        except Exception as e:
            logger.error(f"Error sending chat message to {self.username}: {str(e)}")

    async def read_confirmation(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'read_confirmation',
                'message_ids': event['message_ids'],
                'client': event['client'],
            }))
        except Exception as e:
            logger.error(f"Error sending read confirmation to {self.username}: {str(e)}")

    @database_sync_to_async
    def _save_message(self, room_name, user, sender_type, content, assistance=None):
        return ChatMessage.objects.create(
            room_name=room_name,
            sender=user,
            sender_type=sender_type,
            content=content,
            is_read=False,
            assistance=assistance
        )

    @database_sync_to_async
    def _save_file_message(self, room_name, user, sender_type, content, file_name, assistance=None):
        # Find the most recent ChatMessage with matching file_name and sender
        try:
            msg = ChatMessage.objects.filter(
                room_name=room_name,
                sender=user,
                sender_type=sender_type,
                file_name=file_name
            ).latest('timestamp')
            logger.debug(f"Found existing file message: room={room_name}, file_name={file_name}, file_url={msg.file.url if msg.file else None}")
            return msg
        except ChatMessage.DoesNotExist:
            # Fallback: Create new message (should be rare)
            msg = ChatMessage.objects.create(
                room_name=room_name,
                sender=user,
                sender_type=sender_type,
                content=content,
                file_name=file_name,
                is_read=False,
                assistance=assistance
            )
            logger.warning(f"No existing file message found, created new: room={room_name}, file_name={file_name}")
            return msg

    @database_sync_to_async
    def _get_offline_messages(self):
        try:
            messages = list(ChatMessage.objects.filter(
                sender_type='client',
                room_name__in=[msg.sender.username for msg in ChatMessage.objects.filter(sender_type='client')]
            ).exclude(
                room_name__in=client_engineer_map.keys()
            ).values('id', 'room_name', 'sender__username', 'sender_type', 'content', 'is_read', 'timestamp', 'file', 'file_name'))
            for msg in messages:
                msg['file_url'] = msg['file'].url if msg['file'] else None
            return messages
        except Exception as e:
            logger.error(f"Error fetching offline messages: {str(e)}")
            return []

    @database_sync_to_async
    def _update_conversation_assistance(self, room_name, engineer):
        try:
            ChatMessage.objects.filter(room_name=room_name).update(assistance=engineer)
        except Exception as e:
            logger.error(f"Error updating assistance for {room_name}: {str(e)}")

    @database_sync_to_async
    def _mark_messages_read_sync(self, room_name):
        try:
            logger.debug(f"Marking read for {room_name}")
            reader_type = 'client' if room_name == self.username else 'agent'
            messages_to_update = ChatMessage.objects.filter(
                room_name=room_name,
                is_read=False,
                sender_type='agent' if reader_type == 'client' else 'client'
            )
            message_ids = list(messages_to_update.values_list('id', flat=True))
            messages_to_update.update(is_read=True)

            if message_ids:
                updated_messages = list(ChatMessage.objects.filter(id__in=message_ids).values(
                    'id', 'room_name', 'sender__username', 'sender_type', 'content', 'is_read', 'timestamp', 'file', 'file_name'
                ))
                return message_ids, room_name, updated_messages
            return [], room_name, []
        except Exception as e:
            logger.error(f"Error marking messages read for {room_name}: {str(e)}")
            return [], room_name, []

    async def _mark_messages_read(self, room_name):
        message_ids, room_name, updated_messages = await self._mark_messages_read_sync(room_name)
        if message_ids:
            await self._send_read_notifications(message_ids, room_name, updated_messages)

    async def _send_read_notifications(self, message_ids, room_name, updated_messages):
        try:
            senders = {msg['sender__username'] for msg in updated_messages}
            for sender in senders:
                sender_message_ids = [str(msg['id']) for msg in updated_messages if msg['sender__username'] == sender]
                await self.channel_layer.group_send(
                    f'chat_{sender}',
                    {
                        'type': 'read_confirmation',
                        'message_ids': sender_message_ids,
                        'client': room_name,
                    }
                )
            for msg in updated_messages:
                file_url = msg['file'].url if msg['file'] else None
                file_name = msg['file_name'] if msg['file'] else None
                await self.channel_layer.group_send(
                    f'chat_{msg["room_name"]}',
                    {
                        'type': 'chat.message',
                        'message': msg['content'],
                        'sender': msg['sender__username'],
                        'sender_type': msg['sender_type'],
                        'client': msg['room_name'],
                        'is_read': True,
                        'timestamp': msg['timestamp'].isoformat(),
                        'message_id': str(msg['id']),
                        'file_url': file_url,
                        'file_name': file_name,
                    }
                )
        except Exception as e:
            logger.error(f"Error sending read notifications for {room_name}: {str(e)}")

    async def _send_offline_messages(self):
        try:
            messages = await self._get_offline_messages()
            for msg in messages:
                await self.channel_layer.group_send(
                    self.personal_group,
                    {
                        'type': 'chat.message',
                        'message': msg['content'],
                        'sender': msg['sender__username'],
                        'sender_type': msg['sender_type'],
                        'client': msg['room_name'],
                        'is_read': msg['is_read'],
                        'timestamp': msg['timestamp'].isoformat() if msg['timestamp'] else None,
                        'message_id': str(msg['id']),
                        'file_url': msg['file_url'],
                        'file_name': msg['file_name'],
                    }
                )
                if msg['room_name'] not in client_engineer_map:
                    await self.channel_layer.group_send(
                        'engineers',
                        {
                            'type': 'chat.message',
                            'message': msg['content'],
                            'sender': msg['sender__username'],
                            'sender_type': msg['sender_type'],
                            'client': msg['room_name'],
                            'is_read': msg['is_read'],
                            'timestamp': msg['timestamp'].isoformat() if msg['timestamp'] else None,
                            'message_id': str(msg['id']),
                            'file_url': msg['file_url'],
                            'file_name': msg['file_name'],
                        }
                    )
        except Exception as e:
            logger.error(f"Error sending offline messages to {self.username}: {str(e)}")