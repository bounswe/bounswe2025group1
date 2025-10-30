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
        
        # Create a chat for this garden in Firebase
        try:
            from chat.firebase_config import get_firestore_client
            from google.cloud.firestore import SERVER_TIMESTAMP
            
            db = get_firestore_client()
            if db:
                # Create Firebase UID for the creator
                firebase_uid = f"django_{self.request.user.id}"
                
                # Create chat document
                chat_ref = db.collection('chats').document(f'garden_{garden.id}')
                chat_data = {
                    'type': 'group',
                    'gardenId': str(garden.id),
                    'groupName': garden.name,
                    'members': [firebase_uid],  # Creator is the first member
                    'createdAt': SERVER_TIMESTAMP,
                    'updatedAt': SERVER_TIMESTAMP,
                    'lastMessage': {
                        'text': 'Garden chat created',
                        'createdAt': SERVER_TIMESTAMP,
                        'senderId': 'system'
                    }
                }
                chat_ref.set(chat_data)
                print(f"Garden chat created for garden: {garden.name} (ID: {garden.id})")
        except Exception as e:
            # Don't fail garden creation if chat creation fails
            print(f"Warning: Could not create garden chat: {e}")

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
    
    def perform_update(self, serializer):
        """Update membership and sync chat members if status changes to ACCEPTED"""
        old_status = serializer.instance.status
        membership = serializer.save()
        
        # If membership was just accepted, sync chat members
        if old_status != 'ACCEPTED' and membership.status == 'ACCEPTED':
            self._sync_garden_chat_members(membership.garden.id)
    
    def perform_destroy(self, instance):
        """Remove membership and sync chat members"""
        garden_id = instance.garden.id
        instance.delete()
        self._sync_garden_chat_members(garden_id)
    
    def _sync_garden_chat_members(self, garden_id):
        """Sync garden chat members with accepted memberships"""
        try:
            from chat.firebase_config import get_firestore_client
            from google.cloud.firestore import SERVER_TIMESTAMP
            
            db = get_firestore_client()
            if not db:
                return
            
            # Get all accepted members
            accepted_memberships = GardenMembership.objects.filter(
                garden_id=garden_id,
                status='ACCEPTED'
            ).select_related('user')
            
            member_uids = [f"django_{m.user.id}" for m in accepted_memberships]
            
            # Update chat document
            chat_ref = db.collection('chats').document(f'garden_{garden_id}')
            chat_doc = chat_ref.get()
            
            if chat_doc.exists:
                chat_ref.update({
                    'members': member_uids,
                    'updatedAt': SERVER_TIMESTAMP
                })
                print(f"Synced chat members for garden {garden_id}: {len(member_uids)} members")
        except Exception as e:
            print(f"Warning: Could not sync garden chat members: {e}")
        
    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        membership = self.get_object()
        membership.status = 'ACCEPTED'
        membership.save()
        
        # Sync chat members after accepting
        self._sync_garden_chat_members(membership.garden.id)
        
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

