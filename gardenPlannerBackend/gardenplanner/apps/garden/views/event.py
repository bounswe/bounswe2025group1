"""Views for Garden Events and Attendance voting."""

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from ..models import GardenEvent, GardenMembership, EventAttendance, AttendanceStatus
from ..serializers import GardenEventSerializer, EventAttendanceSerializer
from ..permissions import IsGardenManager, IsGardenMember, IsGardenPublic, IsSystemAdministrator


class GardenEventViewSet(viewsets.ModelViewSet):
    queryset = GardenEvent.objects.all()
    serializer_class = GardenEventSerializer

    def get_queryset(self):
        user = self.request.user
        qs = GardenEvent.objects.select_related('garden', 'created_by')
        if not user.is_authenticated:
            # Only platform users (authenticated) may see events
            return qs.none()
        if getattr(user, 'profile', None) and user.profile.role == 'ADMIN':
            return qs
        # Authenticated: public events OR private events in gardens where user is accepted member
        member_garden_ids = GardenMembership.objects.filter(user=user, status='ACCEPTED').values_list('garden_id', flat=True)
        return qs.filter(
            Q(visibility='PUBLIC') | Q(garden_id__in=member_garden_ids)
        )

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        garden = serializer.validated_data.get('garden')
        # Must be accepted member to create
        if not GardenMembership.objects.filter(user=user, garden=garden, status='ACCEPTED').exists():
            raise PermissionDenied('You must be a member of this garden to create events.')
        serializer.save(created_by=user)

    def check_object_permissions(self, request, obj):
        # Allow retrieve handled in queryset filtering. For modifications:
        if request.method not in permissions.SAFE_METHODS:
            if hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN':
                return
            # Allow creator or garden manager
            if obj.created_by == request.user:
                return
            if GardenMembership.objects.filter(user=request.user, garden=obj.garden, role='MANAGER', status='ACCEPTED').exists():
                return
            raise PermissionDenied('You do not have permission to modify this event.')

    @action(detail=True, methods=['post'], url_path='vote', permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        """Create/update attendance vote for the current user."""
        # Get event without object permissions check for voting
        try:
            event = GardenEvent.objects.get(pk=pk)
        except GardenEvent.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        status_value = request.data.get('status')
        if status_value not in [AttendanceStatus.GOING, AttendanceStatus.NOT_GOING, AttendanceStatus.MAYBE]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check visibility: private event requires membership
        if event.visibility == 'PRIVATE':
            if not GardenMembership.objects.filter(user=user, garden=event.garden, status='ACCEPTED').exists():
                return Response({'error': 'You are not a member of this garden.'}, status=status.HTTP_403_FORBIDDEN)
        
        attendance, _ = EventAttendance.objects.update_or_create(
            event=event, user=user, defaults={'status': status_value}
        )
        return Response(EventAttendanceSerializer(attendance).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='attendances', permission_classes=[permissions.IsAuthenticated])
    def attendances(self, request, pk=None):
        """List all attendance votes for this event (restricted for PRIVATE events to members)."""
        # Get event without object permissions check for listing attendances
        try:
            event = GardenEvent.objects.get(pk=pk)
        except GardenEvent.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if event.visibility == 'PRIVATE':
            if not GardenMembership.objects.filter(user=request.user, garden=event.garden, status='ACCEPTED').exists():
                return Response({'error': 'You are not a member of this garden.'}, status=status.HTTP_403_FORBIDDEN)
        
        votes = event.attendances.select_related('user').all()
        return Response(EventAttendanceSerializer(votes, many=True).data)
