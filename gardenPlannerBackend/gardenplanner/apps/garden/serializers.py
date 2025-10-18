from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Report, Notification, GardenImage, ForumPostImage, CommentImage
from django.contrib.auth import get_user_model
from django.conf import settings
import requests
from django.contrib.auth import authenticate
import base64

def _decode_base64_image(data_str):
    """Return (bytes, mime_type) from data URL or raw base64 string."""
    mime_type = 'image/jpeg'
    if not data_str:
        raise serializers.ValidationError('Empty image data')
    if data_str.startswith('data:'):
        try:
            header, b64data = data_str.split(',', 1)
            if ';base64' in header:
                mime_type = header.split(':', 1)[1].split(';', 1)[0]
            data_bytes = base64.b64decode(b64data)
            return data_bytes, mime_type
        except Exception:
            raise serializers.ValidationError('Invalid data URL image format')
    try:
        data_bytes = base64.b64decode(data_str)
        return data_bytes, mime_type
    except Exception:
        raise serializers.ValidationError('Invalid base64 image')

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                  'profile_picture', 'location', 'role', 'receives_notifications', 'created_at', 'updated_at']
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_picture', 'location', 'receives_notifications']


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

class GardenImageSerializer(serializers.ModelSerializer):
    image_base64 = serializers.SerializerMethodField()

    class Meta:
        model = GardenImage
        fields = ['id', 'is_cover', 'mime_type', 'image_base64', 'created_at']
        read_only_fields = ['id', 'image_base64', 'created_at']

    def get_image_base64(self, obj):
        if obj.data is None:
            return None
        b64 = base64.b64encode(obj.data).decode('ascii')
        return f"data:{obj.mime_type};base64,{b64}"


class GardenSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField(read_only=True)
    images = GardenImageSerializer(many=True, read_only=True)
    cover_image_base64 = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gallery_base64 = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = Garden
        fields = ['id', 'name', 'description', 'location', 'is_public', 'created_at', 'updated_at', 'cover_image', 'images', 'cover_image_base64', 'gallery_base64']
        read_only_fields = ['id', 'created_at', 'updated_at', 'cover_image', 'images']

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if not cover:
            return None
        return GardenImageSerializer(cover).data

    def create(self, validated_data):
        cover_image_b64 = validated_data.pop('cover_image_base64', None)
        gallery_b64 = validated_data.pop('gallery_base64', [])
        garden = super().create(validated_data)
        if cover_image_b64:
            data_bytes, mime = _decode_base64_image(cover_image_b64)
            GardenImage.objects.create(garden=garden, data=data_bytes, mime_type=mime, is_cover=True)
        for img_b64 in gallery_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            GardenImage.objects.create(garden=garden, data=data_bytes, mime_type=mime, is_cover=False)
        return garden

    def update(self, instance, validated_data):
        cover_image_b64 = validated_data.pop('cover_image_base64', None)
        gallery_b64 = validated_data.pop('gallery_base64', None)
        instance = super().update(instance, validated_data)
        if cover_image_b64 is not None:
            if cover_image_b64 == '':
                instance.images.filter(is_cover=True).update(is_cover=False)
            else:
                data_bytes, mime = _decode_base64_image(cover_image_b64)
                cover = instance.images.filter(is_cover=True).first()
                if cover:
                    cover.data = data_bytes
                    cover.mime_type = mime
                    cover.is_cover = True
                    cover.save()
                else:
                    GardenImage.objects.create(garden=instance, data=data_bytes, mime_type=mime, is_cover=True)
        if gallery_b64 is not None:
            instance.images.filter(is_cover=False).delete()
            for img_b64 in gallery_b64:
                if not img_b64:
                    continue
                data_bytes, mime = _decode_base64_image(img_b64)
                GardenImage.objects.create(garden=instance, data=data_bytes, mime_type=mime, is_cover=False)
        return instance

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
    images = serializers.SerializerMethodField(read_only=True)
    images_base64 = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    comments = serializers.SerializerMethodField(read_only=True)
    comments_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ForumPost
        fields = ['id', 'title', 'content', 'author', 'author_username', 'created_at', 'updated_at', 'images', 'images_base64', 'comments', 'comments_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'images', 'comments', 'comments_count']

    def get_images(self, obj):
        imgs = obj.images.all().order_by('created_at')
        result = []
        for im in imgs:
            b64 = base64.b64encode(im.data).decode('ascii') if im.data is not None else None
            result.append({
                'id': im.id,
                'mime_type': im.mime_type,
                'image_base64': f"data:{im.mime_type};base64,{b64}" if b64 else None,
                'created_at': im.created_at,
            })
        return result

    def get_comments(self, obj):
        # Check if include_comments is requested
        request = self.context.get('request')
        if request and request.query_params.get('include_comments', '').lower() == 'true':
            comments = obj.comments.all().order_by('created_at')
            return CommentSerializer(comments, many=True, context=self.context).data
        return []

    def get_comments_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        images_b64 = validated_data.pop('images_base64', [])
        post = super().create(validated_data)
        for img_b64 in images_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            ForumPostImage.objects.create(post=post, data=data_bytes, mime_type=mime)
        return post


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    images = serializers.SerializerMethodField(read_only=True)
    images_base64 = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = Comment
        fields = ['id', 'forum_post', 'content', 'author', 'author_username', 'created_at', 'images', 'images_base64']
        read_only_fields = ['id', 'author', 'author_username', 'created_at', 'images']

    def get_images(self, obj):
        imgs = obj.images.all().order_by('created_at')
        result = []
        for im in imgs:
            b64 = base64.b64encode(im.data).decode('ascii') if im.data is not None else None
            result.append({
                'id': im.id,
                'mime_type': im.mime_type,
                'image_base64': f"data:{im.mime_type};base64,{b64}" if b64 else None,
                'created_at': im.created_at,
            })
        return result

    def create(self, validated_data):
        images_b64 = validated_data.pop('images_base64', [])
        comment = super().create(validated_data)
        for img_b64 in images_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            CommentImage.objects.create(comment=comment, data=data_bytes, mime_type=mime)
        return comment
        
        
class UserGardenSerializer(serializers.ModelSerializer):
    user_role = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField(read_only=True)
    images = GardenImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Garden
        fields = ['id', 'name', 'description', 'location', 'is_public', 'user_role', 'created_at', 'updated_at', 'cover_image', 'images']
        read_only_fields = ['id', 'created_at', 'updated_at', 'cover_image', 'images']
    
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

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if not cover:
            return None
        return GardenImageSerializer(cover).data
    
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
    



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'category', 'read', 'timestamp')
