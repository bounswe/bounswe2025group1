from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import logout
from django.db import models
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, status, permissions, filters
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import generics

from .serializers import (
    RegisterSerializer, ProfileSerializer, LoginWithCaptchaSerializer, UserSerializer, ProfileUpdateSerializer,
    FollowSerializer, GardenSerializer, GardenMembershipSerializer,
    CustomTaskTypeSerializer, TaskSerializer, ForumPostSerializer, CommentSerializer
)
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment
from .permissions import (
    IsSystemAdministrator, IsModerator, IsMember,
    IsGardenManager, IsGardenMember, IsGardenPublic,
    IsTaskAssignee
)


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
    serializer_class = LoginWithCaptchaSerializer

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
    queryset = GardenMembership.objects.all()
    queryset = GardenMembership.objects.all()
    serializer_class = GardenMembershipSerializer


    def get_permissions(self):
        if self.action in ['create']:
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


class CustomTaskTypeViewSet(viewsets.ModelViewSet):
    queryset = CustomTaskType.objects.all()
    queryset = CustomTaskType.objects.all()
    serializer_class = CustomTaskTypeSerializer


    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsGardenMember | IsGardenPublic]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsGardenManager]
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsGardenMember | IsGardenPublic]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsGardenManager]
        else:
            permission_classes = [IsAuthenticated]
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save()

    def perform_create(self, serializer):
        serializer.save()


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at', 'status']
    def get_queryset(self):
        user = self.request.user
        action = getattr(self, 'action', None)
        print(f"[get_queryset] Action: {action}, User: {user.username}")


        if action in ['retrieve', 'assign_task', 'accept_task', 'decline_task', 'complete_task']:
            memberships = GardenMembership.objects.filter(user=user, status='ACCEPTED')
            garden_ids = memberships.values_list('garden_id', flat=True)
            print(f"[get_queryset] Garden IDs for user {user.username}: {garden_ids}")
            return Task.objects.filter(garden_id__in=garden_ids)

        garden_id = self.request.query_params.get('garden')
        if not garden_id:
            return Task.objects.none()

        garden_id = int(garden_id)
        print(f"Requested garden ID: {garden_id}, user: {user.username}")

        if user.profile.role == 'ADMIN':
            return Task.objects.filter(garden_id=garden_id)

        membership = GardenMembership.objects.filter(user=user, garden_id=garden_id, status='ACCEPTED').first()
        if not membership:
            print(f"User {user.username} is not a member of garden {garden_id}")
            return Task.objects.none()

        if membership.role == 'MANAGER':
            print(f"User {user.username} is a MANAGER in garden {garden_id}")
            return Task.objects.filter(garden_id=garden_id)

        print(f"User {user.username} is a WORKER in garden {garden_id}")
        return Task.objects.filter(
            (models.Q(assigned_to=user) | models.Q(assigned_to=None)|models.Q(status='DECLINED')) &
            models.Q(garden_id=garden_id)
        )
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsGardenMember | IsGardenPublic]
        elif self.action in ['create']:
            permission_classes = [IsAuthenticated, IsGardenMember]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsGardenManager | IsTaskAssignee]
        elif self.action in ['destroy']:
            permission_classes = [IsAuthenticated, IsGardenManager]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
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
        
        task.status = 'IN_PROGRESS'
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

    @action(detail=True, methods=['post'], url_path='assign')
    def assign_task(self, request, pk=None):
        """Assign a user to a task (manager only)"""
        task = self.get_object()
        print(f"[Assign Task] Fetched Task: {task.title} (ID: {task.id})")

        # Only garden managers or system admins can assign
        membership = GardenMembership.objects.filter(
            user=request.user,
            garden=task.garden,
            role='MANAGER',
            status='ACCEPTED'
        ).first()
        print(f"[Assign Task] Request by user: {request.user.username}")
        print(f"[Assign Task] Task ID: {task.id}, Garden: {task.garden.name}")
        print(f"[Assign Task] Manager Membership: {membership}")
        if not (membership or request.user.profile.role == 'ADMIN'):
            return Response({"error": "You do not have permission to assign this task."},
                            status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get("user_id")
        print(f"[Assign Task] user_id: {user_id} (type: {type(user_id)})")
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)
        print(f"Available user IDs: {list(User.objects.values_list('id', flat=True))}")
        assigned_user = get_object_or_404(User, id=user_id)
        print(f"[Assign Task] Assigned user: {assigned_user.username} (ID: {assigned_user.id})")
        # Optional: Check if the assigned user is part of the garden
        if not GardenMembership.objects.filter(user=assigned_user, garden=task.garden, status='ACCEPTED').exists():
            return Response({"error": "User is not a member of this garden."}, status=400)

        task.assigned_to = assigned_user
        task.status = 'PENDING'  # optionally reset status
        task.save()
        return Response(TaskSerializer(task).data)

class ForumPostListCreateView(generics.ListCreateAPIView):
    queryset = ForumPost.objects.all().order_by('-created_at')
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ForumPostRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ForumPost.objects.all()
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to edit this post."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to delete this post."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CommentListCreateView(generics.ListCreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        forum_post = self.request.query_params.get('forum_post')
        if forum_post is not None:
            queryset = queryset.filter(forum_post_id=forum_post)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class CommentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to edit this comment."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.author != request.user:
            return Response({"detail": "You do not have permission to delete this comment."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)