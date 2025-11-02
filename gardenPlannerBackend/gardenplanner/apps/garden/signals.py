from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Notification, NotificationCategory, Task, Profile, Comment
from push_notifications.models import GCMDevice

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

    devices = GCMDevice.objects.filter(user=instance.assigned_to, active=True)
    devices.send_message(
        message=None,  # Set this to None to force data-only
        extra={
            "data_title": "Task Update",      # Move title here
            "data_body": message,             # Move body here
            "type": "TASK_UPDATE",
        }
    )

@receiver(m2m_changed, sender=Profile.following.through)
def new_follower_notification(sender, instance, action, pk_set, **kwargs):
    """
    Create a notification when a user gets a new follower.
    'instance' is the Profile that is being followed.
    """
    if action == "post_add":
        # The 'instance' is the profile of the person who clicked "follow".
        follower_profile = instance 
        
        # The 'pk_set' contains the PK of the person who was followed.
        # This is the person who should receive the notification.
        pk_list = list(pk_set)
        if not pk_list: # if already follows, pk_set can be empty
            return
        followed_profile_pk = pk_list[0]
        followed_profile = Profile.objects.get(pk=followed_profile_pk)
        
        # The recipient is the user who WAS followed.
        recipient_user = followed_profile.user

        if not recipient_user.profile.receives_notifications:
            return
        
        message = f"{follower_profile.user.username} started following you."
        Notification.objects.create(
            recipient=recipient_user,
            message=message,
            category=NotificationCategory.SOCIAL,
        )

        devices = GCMDevice.objects.filter(user=recipient_user, active=True)
        devices.send_message(
            message=None,  # Set this to None to force data-only
            extra={
                "data_title": "New Follower",      # Move title here
                "data_body": message,             # Move body here
                "type": "NEW_FOLLOWER",
            }
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

    devices = GCMDevice.objects.filter(user=post_author, active=True)
    devices.send_message(
        message=None,  # Set this to None to force data-only
        extra={
            "data_title": "New Comment",      # Move title here
            "data_body": message,             # Move body here
            "type": "NEW_COMMENT",
        }
    )
