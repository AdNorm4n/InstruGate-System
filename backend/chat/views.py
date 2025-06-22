from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ChatMessage
from django.utils import timezone
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request):
    try:
        if 'file' not in request.FILES:
            logger.error("No file provided")
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        file_name = file.name
        file_size = file.size

        if not file_name.lower().endswith('.pdf'):
            logger.error(f"Invalid file type: {file_name}")
            return Response({'error': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)

        if file_size > 10 * 1024 * 1024:  # 10MB limit
            logger.error(f"File size too large: {file_size} bytes")
            return Response({'error': 'File size exceeds 10MB'}, status=status.HTTP_400_BAD_REQUEST)

        sender_type = 'agent' if getattr(request.user, 'role', None) == 'proposal_engineer' else 'client'
        room_name = request.user.username if sender_type == 'client' else request.POST.get('room_name', '')

        if not room_name:
            logger.error("No room_name provided for agent upload")
            return Response({'error': 'Room name required for agent uploads'}, status=status.HTTP_400_BAD_REQUEST)

        msg = ChatMessage.objects.create(
            room_name=room_name,
            sender=request.user,
            sender_type=sender_type,
            content='',  # Empty content for file-only messages
            file_name=file_name,
            is_read=False,
            assistance=None if sender_type == 'client' else request.user
        )
        # Use clean file path without redundant segments
        file_path = f"chat_files/{timezone.now().strftime('%Y/%m/%d')}/{file_name}"
        msg.file.save(file_path, ContentFile(file.read()))
        msg.save()

        # Log the saved file URL and path
        logger.info(f"File uploaded successfully: {file_name} by {request.user.username} to {room_name}")
        logger.debug(f"Saved file URL: {msg.file.url}, Path: {msg.file.name}")

        return Response({
            'file_url': msg.file.url,  # Return raw Cloudinary URL
            'file_name': file_name,
            'room_name': room_name,
            'sender_type': sender_type,
            'sender': request.user.username,
            'message_id': str(msg.id)  # Include message_id for WebSocket lookup
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error uploading file for {request.user.username}: {str(e)}")
        return Response({'error': 'File upload failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)