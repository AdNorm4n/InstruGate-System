from django.contrib import admin
from django.utils.html import format_html
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room_name', 'sender', 'sender_type', 'assistance', 'assistance_type','timestamp', 'is_read')
    list_filter = ('room_name', 'sender_type', 'is_read')
    search_fields = ('content', 'sender__username', 'assistance__username', 'file_name')
    ordering = ('-timestamp',)

    def file_info(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.file.url, obj.file_name or 'Download')
        return 'No file'
    file_info.short_description = 'File'

    def assistance_type(self, obj):
        if obj.assistance:
            has_agent_message = ChatMessage.objects.filter(sender=obj.assistance, sender_type='agent').exists()
            return 'Agent' if has_agent_message else 'N/A'
        return 'N/A'
    assistance_type.short_description = 'Assistance Type'