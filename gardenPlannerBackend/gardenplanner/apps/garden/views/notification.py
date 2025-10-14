"""Notification Views"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Notification
from ..serializers import NotificationSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A ViewSet for viewing and managing notifications.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return notifications for the current user
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Returns the count of unread notifications for the user."""
        count = self.get_queryset().filter(read=False).count()
        return Response({'unread_count': count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marks a single notification as read."""
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marks all of the user's notifications as read."""
        self.get_queryset().update(read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)
    