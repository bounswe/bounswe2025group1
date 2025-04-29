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


# Signal to create/update a user's profile when the user is created/updated
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()


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