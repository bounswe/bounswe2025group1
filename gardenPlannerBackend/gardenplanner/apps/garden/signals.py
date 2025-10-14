from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Notification, NotificationCategory, Task, Profile, Comment

@receiver(post_save, sender=Task)
def task_update_notification(sender, instance, created, **kwargs):
    # Skip if there's no one assigned
    if not instance.assigned_to:
        return

    # Skip if the assigned user has disabled notifications
    if not instance.assigned_to.profile.receives_notifications:
        return
    
    if created:
        message = f"You have been assigned a new task: '{instance.title}'."
    else:
        message = f"Task updated: '{instance.title}' status is now '{instance.get_status_display()}'."

    Notification.objects.create(
        recipient=instance.assigned_to,
        message=message,
        category=NotificationCategory.TASK,
    )

@receiver(m2m_changed, sender=Profile.following.through)
def new_follower_notification(sender, instance, action, pk_set, **kwargs):
    """
    Create a notification when a user gets a new follower.
    'instance' is the Profile that is being followed.
    """
    if action == "post_add":
        follower_profile_pk = list(pk_set)[0] 
        follower_profile = Profile.objects.get(pk=follower_profile_pk)
        
        recipient_user = instance.user

        if not recipient_user.profile.receives_notifications:
            return
        
        message = f"{follower_profile.user.username} started following you."
        Notification.objects.create(
            recipient=recipient_user,
            message=message,
            category=NotificationCategory.SOCIAL,
        )

@receiver(post_save, sender=Comment)
def new_comment_notification(sender, instance, created, **kwargs):
    """
    Sends a notification to a post author when a new comment is made.
    """
    # Run for new comments
    if not created:
        return

    post_author = instance.forum_post.author
    comment_author = instance.author

    if post_author == comment_author:
        return

    if not post_author.profile.receives_notifications:
        return

    message = f"{comment_author.username} commented on your post: '{instance.forum_post.title}'."
    Notification.objects.create(
        recipient=post_author,
        message=message,
        category=NotificationCategory.FORUM,
    )

