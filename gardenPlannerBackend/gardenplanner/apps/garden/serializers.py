from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Report, Notification, GardenImage, ForumPostImage, CommentImage, Badge, UserBadge, GardenEvent, EventAttendance, AttendanceStatus
from django.contrib.auth import get_user_model
from django.conf import settings
import requests
from django.contrib.auth import authenticate
import base64
from push_notifications.models import GCMDevice

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
    profile_picture = serializers.SerializerMethodField()
    
    location = serializers.SerializerMethodField()
    role = serializers.CharField(read_only=True)
    receives_notifications = serializers.BooleanField(read_only=True)
    is_private = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                  'profile_picture', 'location', 'role', 'receives_notifications', 'is_private', 'created_at', 'updated_at']
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']

    def get_profile_picture(self, obj):
        if getattr(obj, 'profile_picture_data', None):
            b64 = base64.b64encode(obj.profile_picture_data).decode('ascii')
            mime = getattr(obj, 'profile_picture_mime_type', 'image/jpeg')
            return f"data:{mime};base64,{b64}"
        return None

    def get_location(self, obj):
        if not obj.location:
            return None
            
        # If the requesting user is the owner, return full location
        request = self.context.get('request')
        if request and request.user == obj.user:
            return obj.location
            
        parts = [p.strip() for p in obj.location.split(',')]
        
        if len(parts) >= 6:
            masked_parts = parts[-6:-3]
            return ", ".join(masked_parts)
        elif len(parts) >= 4:
            masked_parts = parts[1:]
            return ", ".join(masked_parts)
             
        return obj.location

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_picture', 'location', 'receives_notifications', 'is_private']

    def update(self, instance, validated_data):
        request = self.context.get('request') if hasattr(self, 'context') else None
        uploaded = None
        if request and hasattr(request, 'FILES'):
            uploaded = request.FILES.get('profile_picture')
        # Fallback: DRF may have already placed the file in validated_data
        if uploaded is None:
            uploaded = validated_data.get('profile_picture')

        if uploaded is not None:
            # Persist image into DB-backed fields and ignore FileField storage
            try:
                image_bytes = uploaded.read()
            except Exception:
                image_bytes = None
            if image_bytes:
                validated_data.pop('profile_picture', None)
                validated_data['profile_picture_data'] = image_bytes
                validated_data['profile_picture_mime_type'] = getattr(uploaded, 'content_type', 'image/jpeg')
                # Clear file field to avoid dangling references
                instance.profile_picture = None

        return super().update(instance, validated_data)


class FollowSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    location = serializers.CharField(required=False, allow_blank=True)
    profile_picture = serializers.ImageField(required=False)

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'location', 'profile_picture']

    def validate_email(self, value):
        """Validate that email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate that username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        location = validated_data.pop('location', None)
        uploaded = validated_data.pop('profile_picture', None)

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

        if uploaded is not None:
            try:
                image_bytes = uploaded.read()
            except Exception:
                image_bytes = None
            if image_bytes:
                profile.profile_picture_data = image_bytes
                profile.profile_picture_mime_type = getattr(uploaded, 'content_type', 'image/jpeg')
                profile.profile_picture = None

        if location or uploaded is not None:
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
        fields = ['id', 'name', 'description', 'location', 'latitude', 'longitude', 'is_public', 'created_at', 'updated_at', 'cover_image', 'images', 'cover_image_base64', 'gallery_base64']
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
                if cover_image_b64 and img_b64 == cover_image_b64:
                    continue
                data_bytes, mime = _decode_base64_image(img_b64)
                GardenImage.objects.create(garden=instance, data=data_bytes, mime_type=mime, is_cover=False)
        return instance

class GardenMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    garden = serializers.PrimaryKeyRelatedField(queryset=Garden.objects.all(), required=False)
    user_id = serializers.IntegerField(source='user.id', read_only=True)  # ✅ ADD THIS LINE

    class Meta:
        model = GardenMembership
        fields = ['id','user_id', 'garden', 'username', 'garden_name', 'role', 'status', 'joined_at', 'updated_at']
        read_only_fields = ['id', 'joined_at', 'updated_at']
        
    def validate(self, data):
        # Garden is required only on create, not on update
        if self.instance is None and not data.get('garden'):
            raise serializers.ValidationError({"garden": "Garden ID is required"})
        return data
    
    def update(self, instance, validated_data):
        # If garden is not provided in update, use the instance's garden
        if 'garden' not in validated_data:
            validated_data['garden'] = instance.garden
        return super().update(instance, validated_data)

class CustomTaskTypeSerializer(serializers.ModelSerializer):
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    
    class Meta:
        model = CustomTaskType
        fields = ['id', 'garden', 'garden_name', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    assigned_by_username = serializers.CharField(source='assigned_by.username', read_only=True)
    assigned_to_usernames = serializers.SerializerMethodField(read_only=True)
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    custom_type_name = serializers.CharField(source='custom_type.name', read_only=True, allow_null=True)
    assigned_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, write_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    
    class Meta:
        model = Task
        fields = ['id', 'garden', 'garden_name', 'title', 'description', 
                 'task_type', 'custom_type', 'custom_type_name', 
                 'assigned_by', 'assigned_by_username', 
                 'assigned_to', 'assigned_to_usernames', 
                 'status', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_assigned_to_usernames(self, obj):
        return [user.username for user in obj.assigned_to.all()]

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
    
    def create(self, validated_data):
        assigned_to_users = validated_data.pop('assigned_to', [])
        task = Task.objects.create(**validated_data)
        if assigned_to_users:
            task.assigned_to.set(assigned_to_users)
        return task
    
    def update(self, instance, validated_data):
        assigned_to_users = validated_data.pop('assigned_to', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if assigned_to_users is not None:
            instance.assigned_to.set(assigned_to_users)
        return instance

class ForumPostSerializer(serializers.ModelSerializer):
    author_username = serializers.ReadOnlyField(source='author.username')
    author_profile_picture = serializers.SerializerMethodField(read_only=True)
    images = serializers.SerializerMethodField(read_only=True)
    images_base64 = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    delete_image_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    comments = serializers.SerializerMethodField(read_only=True)
    comments_count = serializers.SerializerMethodField(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    is_liked = serializers.SerializerMethodField()
    best_answer_id = serializers.IntegerField(source='best_answer.id', read_only=True)

    class Meta:
        model = ForumPost
        fields = ['id', 'title', 'content', 'author', 'author_username', 'author_profile_picture', 'created_at', 
                  'updated_at', 'images', 'images_base64', 'delete_image_ids', 'comments', 'comments_count', 'likes_count', 'is_liked', 'best_answer_id']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'images', 'comments', 'comments_count', 'likes_count', 'is_liked', 'best_answer_id']

    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False
    
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
            comments = obj.comments.filter(is_deleted=False).order_by('created_at')
            return CommentSerializer(comments, many=True, context=self.context).data
        return []

    def get_comments_count(self, obj):
        return obj.comments.filter(is_deleted=False).count()

    def get_author_profile_picture(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.profile_picture_data:
            b64 = base64.b64encode(obj.author.profile.profile_picture_data).decode('ascii')
            mime = getattr(obj.author.profile, 'profile_picture_mime_type', 'image/jpeg')
            return f"data:{mime};base64,{b64}"
        return None

    def create(self, validated_data):
        images_b64 = validated_data.pop('images_base64', [])
        validated_data.pop('delete_image_ids', [])  # Ignore on create
        post = super().create(validated_data)
        for img_b64 in images_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            ForumPostImage.objects.create(post=post, data=data_bytes, mime_type=mime)
        return post

    def update(self, instance, validated_data):
        # Handle image deletion
        delete_image_ids = validated_data.pop('delete_image_ids', [])
        if delete_image_ids:
            ForumPostImage.objects.filter(id__in=delete_image_ids, post=instance).delete()
        
        # Handle new images
        images_b64 = validated_data.pop('images_base64', [])
        for img_b64 in images_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            ForumPostImage.objects.create(post=instance, data=data_bytes, mime_type=mime)
        
        # Update other fields
        return super().update(instance, validated_data)


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    author_profile_picture = serializers.SerializerMethodField(read_only=True)
    images = serializers.SerializerMethodField(read_only=True)
    images_base64 = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    delete_image_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_best_answer = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'forum_post', 'content', 'author', 'author_username', 'author_profile_picture', 
                  'created_at', 'images', 'images_base64', 'delete_image_ids', 'likes_count', 'is_liked', 'is_best_answer']
        read_only_fields = ['id', 'author', 'author_username', 'created_at', 'images', 'likes_count', 'is_liked']
    
    def get_is_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False

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

    def get_author_profile_picture(self, obj):
        if hasattr(obj.author, 'profile') and obj.author.profile.profile_picture_data:
            b64 = base64.b64encode(obj.author.profile.profile_picture_data).decode('ascii')
            mime = getattr(obj.author.profile, 'profile_picture_mime_type', 'image/jpeg')
            return f"data:{mime};base64,{b64}"
        return None

    def create(self, validated_data):
        images_b64 = validated_data.pop('images_base64', [])
        validated_data.pop('delete_image_ids', [])  # Ignore on create
        comment = super().create(validated_data)
        for img_b64 in images_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            CommentImage.objects.create(comment=comment, data=data_bytes, mime_type=mime)
        return comment

    def update(self, instance, validated_data):
        # Handle image deletion
        delete_image_ids = validated_data.pop('delete_image_ids', [])
        if delete_image_ids:
            CommentImage.objects.filter(id__in=delete_image_ids, comment=instance).delete()
        
        # Handle new images
        images_b64 = validated_data.pop('images_base64', [])
        for img_b64 in images_b64:
            if not img_b64:
                continue
            data_bytes, mime = _decode_base64_image(img_b64)
            CommentImage.objects.create(comment=instance, data=data_bytes, mime_type=mime)
        
        # Update other fields
        return super().update(instance, validated_data)

    def get_is_best_answer(self, obj):
        # Check if this comment is the one linked in the parent post
        return obj.forum_post.best_answer_id == obj.id

class LikerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'profile_picture']

    def get_profile_picture(self, obj):
        if getattr(obj, 'profile_picture_data', None):
            b64 = base64.b64encode(obj.profile_picture_data).decode('ascii')
            mime = getattr(obj, 'profile_picture_mime_type', 'image/jpeg')
            return f"data:{mime};base64,{b64}"
        return None


class UserGardenSerializer(serializers.ModelSerializer):
    user_role = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField(read_only=True)
    images = GardenImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Garden
        fields = ['id', 'name', 'description', 'location', 'latitude', 'longitude', 'is_public', 'user_role', 'created_at', 'updated_at', 'cover_image', 'images']
        read_only_fields = ['id', 'created_at', 'updated_at', 'cover_image', 'images', 'latitude', 'longitude']
    
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
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_username', 'content_type', 'object_id', 
            'reason', 'description', 'created_at', 'reviewed', 'is_valid'
        ]
        read_only_fields = ['reporter', 'reporter_username', 'created_at', 'reviewed', 'is_valid']

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)
    

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'category', 'read', 'timestamp', 'link')


class GCMDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = GCMDevice
        fields = ['registration_id']
        extra_kwargs = {
            'registration_id': {'required': True},
        }
class EventAttendanceSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = EventAttendance
        fields = ['id', 'event', 'user', 'username', 'status', 'responded_at']
        read_only_fields = ['id', 'user', 'responded_at']


class GardenEventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    garden_name = serializers.CharField(source='garden.name', read_only=True)
    going_count = serializers.SerializerMethodField()
    not_going_count = serializers.SerializerMethodField()
    maybe_count = serializers.SerializerMethodField()
    my_attendance = serializers.SerializerMethodField()

    class Meta:
        model = GardenEvent
        fields = [
            'id', 'garden', 'garden_name', 'title', 'description', 'start_at',
            'visibility', 'event_category', 'created_by', 'created_by_username', 'created_at', 'updated_at',
            'going_count', 'not_going_count', 'maybe_count', 'my_attendance'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_username', 'created_at', 'updated_at',
                            'going_count', 'not_going_count', 'maybe_count', 'my_attendance']

    def validate_visibility(self, value):
        if value not in ('PRIVATE', 'PUBLIC'):
            raise serializers.ValidationError('Visibility must be PRIVATE or PUBLIC')
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    def get_going_count(self, obj):
        return obj.attendances.filter(status=AttendanceStatus.GOING).count()

    def get_not_going_count(self, obj):
        return obj.attendances.filter(status=AttendanceStatus.NOT_GOING).count()

    def get_maybe_count(self, obj):
        return obj.attendances.filter(status=AttendanceStatus.MAYBE).count()

    def get_my_attendance(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        vote = obj.attendances.filter(user=request.user).first()
        return vote.status if vote else None
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['key', 'name', 'description', 'category', 'requirement']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)  

    class Meta:
        model = UserBadge
        fields = ['badge', 'earned_at']
