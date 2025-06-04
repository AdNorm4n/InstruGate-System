from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    ROOM_NAME_MAX_LENGTH = 150  # Enough to hold a username

    # We use `room_name` to indicate "which user this message is for."
    # In practice, every message is stored under the recipient's username.
    room_name = models.CharField(max_length=ROOM_NAME_MAX_LENGTH, db_index=True)

    # The actual Django User who sent this message
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )

    # Whether this sender is a "client" or an "agent"
    SENDER_CHOICES = (
        ('client', 'Client'),
        ('agent', 'Agent'),
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)

    # The text body
    content = models.TextField()

    # When it was sent
    timestamp = models.DateTimeField(auto_now_add=True)

    # Has the recipient actually read it? (Optional; default False)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['room_name', 'timestamp']),
        ]

    def __str__(self):
        snippet = self.content[:20] + ("…" if len(self.content) > 20 else "")
        return f'{self.sender.username} ({self.sender_type}): "{snippet}"'
