from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import logout
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, status, permissions, filters
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework import serializers
from .serializers import (
    RegisterSerializer, ProfileSerializer, UserSerializer, ProfileUpdateSerializer, 
    FollowSerializer, GardenSerializer, GardenMembershipSerializer, 
    CustomTaskTypeSerializer, TaskSerializer
)
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task
from django.contrib.auth.forms import PasswordResetForm
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from .permissions import (
    IsSystemAdministrator, IsModerator, IsMember, 
    IsGardenManager, IsGardenMember, IsGardenPublic,
    IsTaskAssignee
)


# Views will be implemented later
# For example:
# 
# class PlantViewSet(viewsets.ModelViewSet):
#     pass
# 
# class GardenViewSet(viewsets.ModelViewSet):
#     pass


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                          context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass
        
        logout(request)
        return Response({"success": "Successfully logged out."}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update current user's profile"""
        serializer = ProfileUpdateSerializer(request.user.profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProfileSerializer(request.user.profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get another user's profile"""
        user = get_object_or_404(User, id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)


class FollowView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Follow a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_follow = get_object_or_404(User, pk=serializer.validated_data['user_id'])
            request.user.profile.follow(user_to_follow.profile)
            return Response({"status": "success", "message": f"You are now following {user_to_follow.username}"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        """Unfollow a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_unfollow = get_object_or_404(User, pk=serializer.validated_data['user_id'])
            request.user.profile.unfollow(user_to_unfollow.profile)
            return Response({"status": "success", "message": f"You have unfollowed {user_to_unfollow.username}"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FollowersListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of users that follow the current user"""
        followers = request.user.profile.followers.all()
        serializer = ProfileSerializer(followers, many=True)
        return Response(serializer.data)


class FollowingListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of users that the current user is following"""
        following = request.user.profile.following.all()
        serializer = ProfileSerializer(following, many=True)
        return Response(serializer.data)


class PasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(email=email)
        if users.exists():
            for user in users:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{request.scheme}://{request.get_host()}/api/reset/{uid}/{token}/"

                # You can use a template instead of plain string
                message = f"Hi {user.username},\n\nClick the link below to reset your password:\n{reset_url}"
                
                # Send email
                send_mail(
                    'Password Reset Request',
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                
            return Response(
                {'message': 'Password reset link has been sent to your email address.'},
                status=status.HTTP_200_OK
            )
        else:
            # Not leaking information about whether the email exists
            return Response(
                {'message': 'If a user with this email exists, a password reset link will be sent.'},
                status=status.HTTP_200_OK
            )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if default_token_generator.check_token(user, token):
            new_password = request.data.get('new_password')
            if not new_password:
                return Response({'error': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)
                
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid reset link or it has expired.'}, status=status.HTTP_400_BAD_REQUEST)


class GardenViewSet(viewsets.ModelViewSet):
    queryset = Garden.objects.all()
    serializer_class = GardenSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
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


class GardenMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = GardenMembershipSerializer
    
    def get_queryset(self):
        """
        Filter memberships based on user role:
        - System admins can see all memberships
        - Garden managers can see memberships for their gardens
        - Users can see their own memberships
        """
        user = self.request.user
        # System Admin can see all memberships
        if user.profile.role == 'ADMIN':
            return GardenMembership.objects.all()
        
        # Garden managers can see memberships for their gardens
        manager_gardens = GardenMembership.objects.filter(
            user=user, 
            role='MANAGER',
            status='ACCEPTED'
        ).values_list('garden_id', flat=True)
        
        if manager_gardens:
            return GardenMembership.objects.filter(garden_id__in=manager_gardens)
        
        # Users can see their own memberships
        return GardenMembership.objects.filter(user=user)
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create']:
            permission_classes = [IsMember]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsGardenManager | IsSystemAdministrator]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Set the user field to the current user when creating a membership"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='my-gardens')
    def my_gardens(self, request):
        """Get gardens where the user is a member"""
        memberships = GardenMembership.objects.filter(
            user=request.user,
            status='ACCEPTED'
        )
        gardens = [membership.garden for membership in memberships]
        serializer = GardenSerializer(gardens, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_membership(self, request, pk=None):
        """Accept a garden membership request (managers only)"""
        membership = self.get_object()
        
        # Check if the current user is a manager of this garden
        has_permission = GardenMembership.objects.filter(
            user=request.user,
            garden=membership.garden,
            role='MANAGER',
            status='ACCEPTED'
        ).exists() or request.user.profile.role == 'ADMIN'
        
        if not has_permission:
            return Response(
                {"error": "You don't have permission to accept membership requests for this garden"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        membership.status = 'ACCEPTED'
        membership.save()
        return Response(GardenMembershipSerializer(membership).data)


class CustomTaskTypeViewSet(viewsets.ModelViewSet):
    serializer_class = CustomTaskTypeSerializer
    
    def get_queryset(self):
        """
        Filter task types based on user role and garden membership:
        - System admins can see all task types
        - Users can see task types for gardens they're a member of
        """
        user = self.request.user
        # System Admin can see all task types
        if user.profile.role == 'ADMIN':
            return CustomTaskType.objects.all()
        
        # Users can see task types for gardens they're a member of
        member_gardens = GardenMembership.objects.filter(
            user=user, 
            status='ACCEPTED'
        ).values_list('garden_id', flat=True)
        
        return CustomTaskType.objects.filter(garden_id__in=member_gardens)
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsGardenManager | IsSystemAdministrator]
        else:
            permission_classes = [IsGardenMember | IsSystemAdministrator]
        return [permission() for permission in permission_classes]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at', 'status']
    
    def get_queryset(self):
        """
        Filter tasks based on user role and garden membership:
        - System admins can see all tasks
        - Garden managers can see all tasks in their gardens
        - Garden workers can see tasks assigned to them or unassigned tasks in their gardens
        """
        user = self.request.user
        # System Admin can see all tasks
        if user.profile.role == 'ADMIN':
            return Task.objects.all()
        
        # Get gardens where user is a member
        memberships = GardenMembership.objects.filter(
            user=user, 
            status='ACCEPTED'
        )
        
        # Get all gardens where user is a manager
        manager_gardens = [m.garden_id for m in memberships if m.role == 'MANAGER']
        
        # If user is a manager in any gardens, show all tasks for those gardens
        if manager_gardens:
            return Task.objects.filter(garden_id__in=manager_gardens)
        
        # Otherwise show tasks assigned to the user or unassigned tasks in gardens they're a member of
        worker_gardens = [m.garden_id for m in memberships]
        return Task.objects.filter(
            (models.Q(assigned_to=user) | models.Q(assigned_to=None)) &
            models.Q(garden_id__in=worker_gardens)
        )
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsGardenManager | IsSystemAdministrator]
        elif self.action in ['list', 'retrieve']:
            permission_classes = [IsGardenMember | IsTaskAssignee | IsSystemAdministrator]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Set the assigned_by field to the current user when creating a task"""
        serializer.save(assigned_by=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_task(self, request, pk=None):
        """Accept a task (workers only)"""
        task = self.get_object()
        
        if task.assigned_to != request.user:
            return Response(
                {"error": "You cannot accept a task that is not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status not in ['PENDING', 'DECLINED']:
            return Response(
                {"error": f"Task cannot be accepted because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'ACCEPTED'
        task.save()
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['post'], url_path='decline')
    def decline_task(self, request, pk=None):
        """Decline a task (workers only)"""
        task = self.get_object()
        
        if task.assigned_to != request.user:
            return Response(
                {"error": "You cannot decline a task that is not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status not in ['PENDING', 'ACCEPTED']:
            return Response(
                {"error": f"Task cannot be declined because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'DECLINED'
        task.save()
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_task(self, request, pk=None):
        """Mark a task as completed (workers only)"""
        task = self.get_object()
        
        if task.assigned_to != request.user:
            return Response(
                {"error": "You cannot complete a task that is not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status != 'IN_PROGRESS':
            return Response(
                {"error": f"Task cannot be completed because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'COMPLETED'
        task.save()
        return Response(TaskSerializer(task).data)
