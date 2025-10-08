from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Notification, NotificationCategory, Task, Profile

@receiver(post_save, sender=Task)
def task_update_notification(sender, instance, created, **kwargs):
    # Skip if there's no one assigned
    if not instance.assigned_to:
        return

    # Skip if the assigned user has disabled notifications
    if not instance.assigned_to.profile.receives_notifications:
        return

    # Notification for a newly assigned task
    if created:
        message = f"You have been assigned a new task: '{instance.title}'."
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
