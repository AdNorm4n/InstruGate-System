from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    ROOM_NAME_MAX_LENGTH = 150

    room_name = models.CharField(max_length=ROOM_NAME_MAX_LENGTH, db_index=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    assistance = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assisted_messages'
    )
    SENDER_CHOICES = (
        ('client', 'Client'),
        ('agent', 'Agent'),
        ('system', 'System'),
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField(blank=True)  # Allow blank for file-only messages
    file = models.FileField(upload_to='chat_files/%Y/%m/%d/', null=True, blank=True)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['room_name', 'timestamp']),
        ]

    def __str__(self):
        if self.file_name:
            return f'{self.sender.username} ({self.sender_type}): File "{self.file_name}"'
        snippet = self.content[:20] + ("…" if len(self.content) > 20 else "")
        return f'{self.sender.username} ({self.sender_type}): "{snippet}"'