"""Views for user profile management, including viewing and updating profiles, following users, and managing blocks."""

from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ..serializers import (
    ProfileSerializer, UserSerializer, ProfileUpdateSerializer, FollowSerializer,
)


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
        
        # Check if either user has blocked the other
        if request.user.profile.is_blocked(user.profile) or user.profile.is_blocked(request.user.profile):
            return Response(
                {"error": "You cannot view this profile due to blocking restrictions."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = UserSerializer(user)
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
