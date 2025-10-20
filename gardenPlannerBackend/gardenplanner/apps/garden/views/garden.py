"""Views for Garden and GardenMembership models."""

from rest_framework.response import Response
from rest_framework import viewsets, permissions, filters
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Q
from ..serializers import (
    GardenSerializer, GardenMembershipSerializer, UserGardenSerializer
)
from ..models import Garden, GardenMembership
from ..permissions import (
    IsSystemAdministrator, IsMember, IsGardenManager
)


class GardenViewSet(viewsets.ModelViewSet):
    queryset = Garden.objects.prefetch_related('images')
    serializer_class = GardenSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Garden.objects.prefetch_related('images')

        # Unauthenticated users can only see public gardens
        if not user.is_authenticated:
            return queryset.filter(is_public=True)

        # Authenticated users can see public gardens and gardens they are members of
        member_garden_ids = GardenMembership.objects.filter(
            user=user,
            status='ACCEPTED'  # make sure only accepted memberships
        ).values_list('garden_id', flat=True)

        # Return public gardens OR gardens user is a member of
        return queryset.filter(
            Q(is_public=True) | Q(id__in=list(member_garden_ids))
        )
    
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create']:
            permission_classes = [IsMember]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsGardenManager | IsSystemAdministrator]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        garden = serializer.save()
        # When a user creates a garden, they automatically become a manager
        GardenMembership.objects.create(
            user=self.request.user,
            garden=garden,
            role='MANAGER',
            status='ACCEPTED'
        )

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        """Get list of members for this garden (URL: /gardens/<id>/members)"""
        garden = self.get_object()
        memberships = GardenMembership.objects.filter(garden=garden)
        serializer = GardenMembershipSerializer(memberships, many=True, context={'request': request})
        return Response(serializer.data)


class GardenMembershipViewSet(viewsets.ModelViewSet):
    queryset = GardenMembership.objects.all()
    serializer_class = GardenMembershipSerializer


    def get_permissions(self):
        if self.action in ['create', 'my_gardens']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsGardenManager | IsSystemAdministrator]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        garden = serializer.validated_data['garden']

        if GardenMembership.objects.filter(user=user, garden=garden).exists():
            raise serializers.ValidationError("You already have a membership or request pending for this garden.")

        serializer.save(user=user)
        
    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        membership = self.get_object()
        membership.status = 'ACCEPTED'
        membership.save()
        return Response({'status': 'Membership accepted'})
        
    @action(detail=False, methods=['get'], url_path='my-gardens')
    def my_gardens(self, request):
        """Get list of gardens that the current user is a member of"""
        # Get all accepted memberships of the current user
        memberships = GardenMembership.objects.filter(
            user=request.user,
            status='ACCEPTED'
        ).select_related('garden')
        
        # Extract the gardens from the memberships
        gardens = [membership.garden for membership in memberships]
        
        # Serialize the gardens with user role information
        serializer = UserGardenSerializer(gardens, many=True, context={'request': request})
        return Response(serializer.data)

