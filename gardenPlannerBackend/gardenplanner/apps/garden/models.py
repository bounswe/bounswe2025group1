from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.exceptions import ValidationError



class Profile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'System Administrator'),
        ('MODERATOR', 'Moderator'),
        ('MEMBER', 'Member'),
        ('GUEST', 'Guest'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    # DB-backed profile picture storage (preferred)
    profile_picture_data = models.BinaryField(null=True, blank=True)
    profile_picture_mime_type = models.CharField(max_length=100, default='image/jpeg')
    location = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)
    receives_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def follow(self, profile):
        """Follow another user's profile"""
        if profile != self:  # Can't follow yourself
            self.following.add(profile)
    
    def unfollow(self, profile):
        """Unfollow a user's profile"""
        self.following.remove(profile)
    
    def is_following(self, profile):
        """Check if this profile is following another profile"""
        return self.following.filter(pk=profile.pk).exists()
    
    def is_blocked(self, profile):
        """Check if this profile has blocked another profile"""
        return self.blocked_users.filter(pk=profile.pk).exists()


# Signal to create/update a user's profile when the user is created/updated
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()


class Garden(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class GardenImage(models.Model):
    garden = models.ForeignKey('Garden', on_delete=models.CASCADE, related_name='images')
    data = models.BinaryField()
    mime_type = models.CharField(max_length=100, default='image/jpeg')
    is_cover = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_cover:
            # Ensure only one cover image per garden
            GardenImage.objects.filter(garden=self.garden, is_cover=True).exclude(pk=self.pk).update(is_cover=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"GardenImage({self.garden_id}){'[cover]' if self.is_cover else ''}"


class GardenMembership(models.Model):
    ROLE_CHOICES = [
        ('MANAGER', 'Garden Manager'),
        ('WORKER', 'Garden Worker'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='garden_memberships')
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='WORKER')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'garden')
        
    def __str__(self):
        return f"{self.user.username} - {self.garden.name} ({self.get_role_display()})"


class CustomTaskType(models.Model):
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='custom_task_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('garden', 'name')
    
    def __str__(self):
        return f"{self.name} ({self.garden.name})"


class Task(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    TASK_TYPE_CHOICES = [
        ('HARVEST', 'Harvest'),
        ('MAINTENANCE', 'Maintenance'),
        ('CUSTOM', 'Custom'),
    ]
    
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='CUSTOM')
    custom_type = models.ForeignKey(CustomTaskType, on_delete=models.SET_NULL, related_name='tasks', null=True, blank=True)
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks_assigned')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks_received', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title


class ForumPost(models.Model):
    title = models.CharField(max_length= 255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="forum_posts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    #soft delete (content will be shown as moderated and not actually deleted from the db)
    def delete(self):
        self.is_deleted = True
        self.save()
    
    def __str__(self):
        return f"{self.title} by {self.author.username}"
    
class Comment(models.Model):
    forum_post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    #soft delete (content will be shown as moderated and not actually deleted from the db)
    def delete(self):
        self.is_deleted = True
        self.save()
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.forum_post.title}"


class ForumPostImage(models.Model):
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='images')
    data = models.BinaryField()
    mime_type = models.CharField(max_length=100, default='image/jpeg')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ForumPostImage({self.post_id})"


class CommentImage(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='images')
    data = models.BinaryField()
    mime_type = models.CharField(max_length=100, default='image/jpeg')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"CommentImage({self.comment_id})"
    
class Report(models.Model):
    REASONS = [
        ('abuse', 'Abusive or Harassing'),
        ('spam', 'Spam or Misleading'),
        ('illegal', 'Illegal Content'),
        ('other', 'Other'),
    ]

    reporter = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Generic relation (can point to ForumPost or Comment)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    reason = models.CharField(max_length=50, choices=REASONS)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)
    is_valid = models.BooleanField(null=True, blank=True)

    def __str__(self):
        return f"Report on {self.content_object} by {self.reporter.username}"


class NotificationCategory(models.TextChoices):
    TASK = 'TASK', 'Task Update'
    SOCIAL = 'SOCIAL', 'Social Activity'
    FORUM = 'FORUM', 'Forum Activity'
    WEATHER = 'WEATHER', 'Weather Alert'
    # Add other categories as needed

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    category = models.CharField(max_length=30, choices=NotificationCategory.choices)
    link = models.CharField(max_length=255, blank=True, null=True)
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-timestamp',)

    def __str__(self):
        return f"Notification for {self.recipient.username} ({self.category})"


# =====================
# Events and Attendance
# =====================

class EventVisibility(models.TextChoices):
    PRIVATE = 'PRIVATE', 'Private'
    PUBLIC = 'PUBLIC', 'Public'



class AttendanceStatus(models.TextChoices):
    GOING = 'GOING', 'Going'
    NOT_GOING = 'NOT_GOING', 'Not Going'
    MAYBE = 'MAYBE', 'Maybe'


class EventCategory(models.TextChoices):
    WORKSHOP = 'WORKSHOP', 'Workshops and Practice'
    POTLUCK = 'POTLUCK', 'Potluck / Picnic'
    EXCHANGE = 'EXCHANGE', 'Garden Exchange'
    TREASURE_HUNT = 'TREASURE_HUNT', 'Treasure Hunt'
    PHOTOGRAPHY = 'PHOTOGRAPHY', 'Photography Day'
    CELEBRATION = 'CELEBRATION', 'Celebration'
    OTHER = 'OTHER', 'Other'



class GardenEvent(models.Model):
    """An event belonging to a garden.

    Visibility is per event:
      - PRIVATE: visible only to accepted garden members
      - PUBLIC: visible to all authenticated platform users
    """

    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    visibility = models.CharField(max_length=10, choices=EventVisibility.choices, default=EventVisibility.PRIVATE)
    event_category = models.CharField(max_length=20, choices=EventCategory.choices, default=EventCategory.OTHER)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-start_at', '-created_at')

    def __str__(self):
        return f"{self.title} ({self.garden.name})"


class EventAttendance(models.Model):
    """A user's attendance vote for a specific event."""

    event = models.ForeignKey(GardenEvent, on_delete=models.CASCADE, related_name='attendances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_attendances')
    status = models.CharField(max_length=10, choices=AttendanceStatus.choices)
    responded_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('event', 'user')
        indexes = [
            models.Index(fields=['event', 'user']),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.status} -> {self.event.title}"
    

class Badge(models.Model):
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    requirement = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="earned_badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="holders")
    earned_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"

