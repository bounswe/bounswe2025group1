from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment
from django.contrib.auth import get_user_model
from django.conf import settings
import requests
from django.contrib.auth import authenticate

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                  'profile_picture', 'location', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_picture', 'location']

class FollowSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


def verify_recaptcha(token):
    url = 'https://www.google.com/recaptcha/api/siteverify'
    data = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': token,
    }
    response = requests.post(url, data=data)
    return response.json()
    
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    location = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False)
    captcha = serializers.CharField(write_only=True)

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'location', 'profile_picture', 'captcha']

   
    def validate(self, data):
        captcha_token = data.pop('captcha', None)
        result = verify_recaptcha(captcha_token)

        if not result.get('success'):
            raise serializers.ValidationError({'captcha': 'Invalid captcha. Try again.'})

        return data

    def create(self, validated_data):
        validated_data.pop('captcha', None)
        location = validated_data.pop('location', None)
        profile_picture = validated_data.pop('profile_picture', None)

        user = self.Meta.model.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        if location:
            profile.location = location
        if profile_picture:
            profile.profile_picture = profile_picture
        if location or profile_picture:
            profile.save()

        return user

class LoginWithCaptchaSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)
    captcha = serializers.CharField(write_only=True)

    def validate(self, attrs):
        captcha_token = attrs.get('captcha')
        result = verify_recaptcha(captcha_token)
        if not result.get('success'):
            raise serializers.ValidationError({'recaptcha': 'Invalid captcha. Please try again.'})

        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'), username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid username or password.')
        else:
            raise serializers.ValidationError('Must include "username" and "password".')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        read_only_fields = ['id', 'profile']

class GardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = ['id', 'name', 'description', 'location', 'is_public', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class GardenMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    garden = serializers.PrimaryKeyRelatedField(queryset=Garden.objects.all(), required=True)
    
    class Meta:
        model = GardenMembership
        fields = ['id', 'garden', 'username', 'garden_name', 'role', 'status', 'joined_at', 'updated_at']
        read_only_fields = ['id', 'joined_at', 'updated_at']
        
    def validate(self, data):
        if not data.get('garden'):
            raise serializers.ValidationError({"garden": "Garden ID is required"})
        return data

class CustomTaskTypeSerializer(serializers.ModelSerializer):
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    
    class Meta:
        model = CustomTaskType
        fields = ['id', 'garden', 'garden_name', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    custom_type_name = serializers.CharField(source='custom_type.name', read_only=True, allow_null=True)
    assigned_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, write_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'garden', 'garden_name', 'title', 'description', 
                 'custom_type', 'custom_type_name', 
                 'assigned_by', 'assigned_by_username', 
                 'assigned_to', 'assigned_to_username', 
                 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ForumPostSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = ForumPost
        fields = ['id', 'title', 'content', 'author', 'author_username', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author']


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'forum_post', 'content', 'author', 'author_username', 'created_at']
        read_only_fields = ['id', 'author', 'author_username', 'created_at']
