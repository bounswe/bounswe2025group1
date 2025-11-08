"""Views for managing forum posts and comments.""" 

from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied


from ..serializers import (
    ForumPostSerializer, CommentSerializer
)
from ..models import ForumPost, Comment


class ForumPostListCreateView(generics.ListCreateAPIView):
    queryset = ForumPost.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def _str_to_bool(self, val):
        if val is None:
            return False
        return str(val).lower() in ('true')


    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter out posts from blocked users
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return queryset  # no blocking filter for anonymous users
        blocked_profiles = self.request.user.profile.blocked_users.all()
        blocked_users = User.objects.filter(profile__in=blocked_profiles)
        queryset = queryset.exclude(author__in=blocked_users)

        # following filter
        following_param = self.request.query_params.get('following', None)
        if following_param is not None and self._str_to_bool(following_param):
            followed_profiles = user.profile.following.all()
            followed_user_ids = followed_profiles.values_list('user_id', flat=True)

            if not followed_user_ids:
                # If user doesn't follow anyone, only show their own posts
                return queryset.filter(author_id=user.id)

            # Include user's own posts in the following filter using Q objects
            queryset = queryset.filter(Q(author_id__in=followed_user_ids) | Q(author_id=user.id))

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ForumPostRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ForumPost.objects.filter(is_deleted=False)
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self):
        obj = super().get_object()

        user = self.request.user
        if not user.is_authenticated: # Read-only
            return obj

        # Check if either user has blocked the other
        if self.request.user.profile.is_blocked(obj.author.profile) or obj.author.profile.is_blocked(self.request.user.profile):
            raise PermissionDenied("You are blocked from viewing this post.")
        return obj

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
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        forum_post = self.request.query_params.get('forum_post')
        if forum_post is not None:
            queryset = queryset.filter(forum_post_id=forum_post)

        # Read only part
        if not self.request.user.is_authenticated:
            return queryset
        
        # Filter out comments from blocked users
        blocked_profiles = self.request.user.profile.blocked_users.all()
        blocked_users = User.objects.filter(profile__in=blocked_profiles)
        return queryset.exclude(author__in=blocked_users)

    def perform_create(self, serializer):
        # Check if the post author has blocked the current user
        forum_post = serializer.validated_data['forum_post']
        if forum_post.author.profile.is_blocked(self.request.user.profile):
            raise PermissionError("You cannot comment on this post due to blocking restrictions.")
        serializer.save(author=self.request.user)


class CommentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.filter(is_deleted=False)
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_object(self):
        obj = super().get_object()

        # Read only part
        if not self.request.user.is_authenticated:
            return obj

        # Check if either user has blocked the other
        if self.request.user.profile.is_blocked(obj.author.profile) or obj.author.profile.is_blocked(self.request.user.profile):
            raise PermissionError("You cannot access this comment due to blocking restrictions.")
        return obj

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
