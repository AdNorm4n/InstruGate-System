# chat/admin.py
from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room_name', 'sender', 'sender_type', 'timestamp', 'is_read')
    list_filter = ('room_name', 'sender_type', 'is_read')
    search_fields = ('content', 'sender__username')
    ordering = ('-timestamp',)
