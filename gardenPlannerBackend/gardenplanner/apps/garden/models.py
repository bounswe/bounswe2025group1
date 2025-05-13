from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Models will be implemented later
# For example:
# 
# class Plant(models.Model):
#     name = models.CharField(max_length=100)
#     # other fields...
# 
# class Garden(models.Model):
#     name = models.CharField(max_length=100)
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     # other fields...
#
#
# IMPORTANT NOTE: A Profile model must be implemented for storing location information. Please check RegisterSerializer in serializers.py

class Profile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'System Administrator'),
        ('MODERATOR', 'Moderator'),
        ('MEMBER', 'Member'),
        ('GUEST', 'Guest'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by', blank=True)
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
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


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
    
    def __str__(self):
        return f"{self.title} by {self.author.username}"
    
class Comment(models.Model):
    forum_post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.forum_post.title}"
