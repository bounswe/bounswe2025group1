from rest_framework import generics, permissions
from ..models import Badge, UserBadge
from ..serializers import BadgeSerializer, UserBadgeSerializer
from django.contrib.auth.models import User


class BadgeListView(generics.ListAPIView):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.AllowAny] 


class UserBadgeListView(generics.ListAPIView):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return UserBadge.objects.filter(user__id=user_id)
