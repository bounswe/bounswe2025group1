from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Report
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


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    location = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False)

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'location', 'profile_picture']

    def create(self, validated_data):
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

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):

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
    gardens = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'gardens']
        read_only_fields = ['id', 'profile', 'gardens']

    def get_gardens(self, obj):
        from .models import GardenMembership
        memberships = GardenMembership.objects.filter(user=obj, status='ACCEPTED')
        gardens = [membership.garden for membership in memberships]
        return GardenSerializer(gardens, many=True).data

class GardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = ['id', 'name', 'description', 'location', 'is_public', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class GardenMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    garden = serializers.PrimaryKeyRelatedField(queryset=Garden.objects.all(), required=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)  # ✅ ADD THIS LINE

    class Meta:
        model = GardenMembership
        fields = ['id','user_id', 'garden', 'username', 'garden_name', 'role', 'status', 'joined_at', 'updated_at']
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
                 'task_type', 'custom_type', 'custom_type_name', 
                 'assigned_by', 'assigned_by_username', 
                 'assigned_to', 'assigned_to_username', 
                 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        task_type = data.get('task_type')
        custom_type = data.get('custom_type')
        
        # If task_type is CUSTOM, custom_type should be provided
        if task_type == 'CUSTOM' and not custom_type:
            raise serializers.ValidationError({"custom_type": "Custom type is required when task type is CUSTOM"})
        
        # If task_type is not CUSTOM, custom_type should be None
        if task_type in ['HARVEST', 'MAINTENANCE'] and custom_type:
            data['custom_type'] = None
        
        return data

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
        
        
class UserGardenSerializer(serializers.ModelSerializer):
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Garden
        fields = ['id', 'name', 'description', 'location', 'is_public', 'user_role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_role(self, obj):
        # This assumes that the request context contains the user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                membership = GardenMembership.objects.get(user=request.user, garden=obj)
                return membership.role
            except GardenMembership.DoesNotExist:
                return None
        return None
    
class ReportSerializer(serializers.ModelSerializer):
    content_type = serializers.CharField()
    object_id = serializers.IntegerField()

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'content_type', 'object_id', 
            'reason', 'description', 'created_at', 'reviewed', 'is_valid'
        ]
        read_only_fields = ['reporter', 'created_at', 'reviewed', 'is_valid']

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)
    

