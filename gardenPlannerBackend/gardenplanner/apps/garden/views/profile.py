"""Views for user profile management, including viewing and updating profiles, following users, and managing blocks."""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ..models import GardenMembership, Task
from ..serializers import (
    ProfileSerializer, UserSerializer, ProfileUpdateSerializer, FollowSerializer, UserGardenSerializer, TaskSerializer
)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user's profile"""
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        """Update current user's profile"""
        serializer = ProfileUpdateSerializer(request.user.profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get another user's profile"""
        user = get_object_or_404(User, id=user_id)
        
        # Check if either user has blocked the other
        if request.user.profile.is_blocked(user.profile) or user.profile.is_blocked(request.user.profile):
            return Response(
                {"error": "You cannot view this profile due to blocking restrictions."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)
    

class UserGardensView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get gardens of a specific user"""
        user = get_object_or_404(User, id=user_id)
        
        # Check if either user has blocked the other
        if request.user.profile.is_blocked(user.profile) or user.profile.is_blocked(request.user.profile):
            return Response(
                {"error": "You cannot view this user's gardens due to blocking restrictions."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        memberships = GardenMembership.objects.filter(
            user=user,
            status='ACCEPTED'
        ).select_related('garden').prefetch_related('garden__images')
        
        # Extract the gardens from the memberships
        gardens = [membership.garden for membership in memberships]
        
        # Serialize the gardens with user role information
        serializer = UserGardenSerializer(gardens, many=True, context={'request': request})
        return Response(serializer.data)
    




class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Follow a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_follow = get_object_or_404(User, pk=serializer.validated_data['user_id'])
            
            # Check if either user has blocked the other
            if request.user.profile.is_blocked(user_to_follow.profile) or user_to_follow.profile.is_blocked(request.user.profile):
                return Response(
                    {"error": "You cannot follow this user due to blocking restrictions."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            request.user.profile.follow(user_to_follow.profile)
            return Response({"status": "success", "message": f"You are now following {user_to_follow.username}"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """Unfollow a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_unfollow = get_object_or_404(User, pk=serializer.validated_data['user_id'])
            
            # Check if either user has blocked the other
            if request.user.profile.is_blocked(user_to_unfollow.profile) or user_to_unfollow.profile.is_blocked(request.user.profile):
                return Response(
                    {"error": "You cannot unfollow this user due to blocking restrictions."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
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
    
class UserFollowersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get list of users that are following the given user id"""
        # Ensure target user exists
        target_user = get_object_or_404(User, id=user_id)

        # If either has blocked the other, forbid access
        if request.user.profile.is_blocked(target_user.profile) or target_user.profile.is_blocked(request.user.profile):
            return Response({"error": "You cannot view this user's followers due to blocking restrictions."}, status=status.HTTP_403_FORBIDDEN)

        followers = target_user.profile.followers.all()
        serializer = ProfileSerializer(followers, many=True)
        return Response(serializer.data)


class UserTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get tasks assigned to a specific user.

        Visibility rules:
        - Deny if either user has blocked the other.
        - System admins can see all tasks.
        - Otherwise only include tasks whose garden is public or where the requesting
          user has an accepted membership in the task's garden.
        """
        user = get_object_or_404(User, id=user_id)

        # Check if either user has blocked the other
        if request.user.profile.is_blocked(user.profile) or user.profile.is_blocked(request.user.profile):
            return Response(
                {"error": "You cannot view this user's tasks due to blocking restrictions."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Tasks assigned to the target user only (not tasks they created)
        tasks_qs = Task.objects.filter(assigned_to=user).select_related(
            'garden', 'assigned_by', 'custom_type'
        ).prefetch_related('assigned_to')

        visible_tasks = []
        for task in tasks_qs:
            # Admins see everything
            if request.user.profile.role == 'ADMIN':
                visible_tasks.append(task)
                continue

            # Public gardens are visible
            if task.garden and getattr(task.garden, 'is_public', False):
                visible_tasks.append(task)
                continue

            # Otherwise user must be an accepted member of the garden
            if GardenMembership.objects.filter(user=request.user, garden=task.garden, status='ACCEPTED').exists():
                visible_tasks.append(task)

        serializer = TaskSerializer(visible_tasks, many=True)
        return Response(serializer.data)


class UserFollowingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Get list of users that the given user id is following"""
        # Ensure target user exists
        target_user = get_object_or_404(User, id=user_id)

        # If either has blocked the other, forbid access
        if request.user.profile.is_blocked(target_user.profile) or target_user.profile.is_blocked(request.user.profile):
            return Response({"error": "You cannot view this user's following list due to blocking restrictions."}, status=status.HTTP_403_FORBIDDEN)

        following = target_user.profile.following.all()
        serializer = ProfileSerializer(following, many=True)
        return Response(serializer.data)
    
class UserIsFollowingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """Check if current user is following another user"""
        if not user_id:
            return Response({"error": "user_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if either user has blocked the other
        if request.user.profile.is_blocked(target_user.profile) or target_user.profile.is_blocked(request.user.profile):
            return Response({"error": "You cannot check following status due to blocking restrictions."}, status=status.HTTP_403_FORBIDDEN)
        
        is_following = request.user.profile.is_following(target_user.profile)
        return Response({"is_following": is_following})

class BlockUnblockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Check if current user is blocked by another user or vice versa"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if either user has blocked the other
        is_blocked_by_me = request.user.profile.is_blocked(target_user.profile)
        is_blocked_by_them = target_user.profile.is_blocked(request.user.profile)
        
        return Response({
            "is_blocked_by_me": is_blocked_by_me,
            "is_blocked_by_them": is_blocked_by_them,
            "can_interact": not (is_blocked_by_me or is_blocked_by_them)
        })

    def post(self, request):
        """Block a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_block = get_object_or_404(User, pk=serializer.validated_data['user_id'])
            
            # Prevent blocking yourself
            if user_to_block == request.user:
                return Response(
                    {"error": "You cannot block yourself"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add to blocked users
            request.user.profile.blocked_users.add(user_to_block.profile)
            
            # If following, unfollow them
            if user_to_block.profile in request.user.profile.following.all():
                request.user.profile.unfollow(user_to_block.profile)
            
            return Response({
                "status": "success",
                "message": f"You have blocked {user_to_block.username}"
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """Unblock a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_unblock = get_object_or_404(User, pk=serializer.validated_data['user_id'])
            
            # Remove from blocked users
            request.user.profile.blocked_users.remove(user_to_unblock.profile)
            
            return Response({
                "status": "success",
                "message": f"You have unblocked {user_to_unblock.username}"
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
