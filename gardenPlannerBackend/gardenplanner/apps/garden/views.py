from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import logout
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, status, permissions
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import generics

from .serializers import RegisterSerializer, ProfileSerializer, UserSerializer, ProfileUpdateSerializer, FollowSerializer
from .models import Profile
from .models import ForumPost
from .serializers import ForumPostSerializer


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
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})


class LogoutView(APIView):
    def post(self, request):
        request.user.auth_token.delete()
        logout(request)
        return Response({'success': 'Logged out successfully'}, status=status.HTTP_200_OK)


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
            user_to_follow = get_object_or_404(User, id=serializer.validated_data['user_id'])
            request.user.profile.follow(user_to_follow.profile)
            return Response({'status': 'following'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        """Unfollow a user"""
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            user_to_unfollow = get_object_or_404(User, id=serializer.validated_data['user_id'])
            request.user.profile.unfollow(user_to_unfollow.profile)
            return Response({'status': 'unfollowed'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FollowersListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of users following the current user"""
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
    permission_classes = []  # Allow public access

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

                send_mail(
                    subject='Password Reset Request',
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )

        return Response({'message': 'If the email exists, a reset link has been sent.'}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid user ID'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'New password not provided'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)




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
    
    
    
from .models import Comment
from .serializers import CommentSerializer

class CommentListCreateView(generics.ListCreateAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CommentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]