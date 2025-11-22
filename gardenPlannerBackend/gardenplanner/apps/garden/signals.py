from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import GardenMembership, Notification, NotificationCategory, Task, Profile, Comment
from push_notifications.models import GCMDevice


def _send_notification(notification_receiver, notification_title, notification_message, notification_category):

    if notification_receiver == None:
        return

    if not notification_receiver.profile.receives_notifications:
        return
    
    Notification.objects.create(
        recipient=notification_receiver,
        message=notification_message,
        category=notification_category,
    )

    devices = GCMDevice.objects.filter(user=notification_receiver, active=True)
    devices.send_message(
        message=None,  # Set this to None to force data-only
        extra={
            "data_title": notification_title,      # Move title here
            "data_body": notification_message,             # Move body here
            "type": notification_category.value,
        }
    )


@receiver(post_save, sender=Task)
def task_update_notification(sender, instance, created, **kwargs):
    assignee = instance.assigned_to
    assigner = instance.assigned_by
    
    if created:
        # Skip if there's no one assigned
        if not assignee:
            return
        
        message = f"You have been assigned a new task: '{instance.title}'."

        _send_notification(
            notification_receiver=assignee,
            notification_title="Task Update",
            notification_message=message,
            notification_category=NotificationCategory.TASK,
        )
        
    else: # Task update
        new_status = instance.status

        if new_status in ['ACCEPTED', 'DECLINED']:
            if assigner != assignee:
                message = f"{instance.title} Your task has been {instance.get_status_display()}."
                _send_notification(
                    notification_receiver=assigner,
                    notification_title="Task Response",
                    notification_message=message,
                    notification_category=NotificationCategory.TASK,
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
        
        message = f"{follower_profile.user.username} started following you."

        _send_notification(
            notification_receiver=recipient_user,
            notification_title="New Follower",
            notification_message=message,
            notification_category=NotificationCategory.SOCIAL,
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

    message = f"{comment_author.username} commented on your post: '{instance.forum_post.title}'."

    _send_notification(
        notification_receiver=post_author,
        notification_title="New Comment",
        notification_message=message,
        notification_category=NotificationCategory.FORUM,
    )


@receiver(post_save, sender=GardenMembership)
def garden_join_request_notification(sender, instance, created, **kwargs):
    """
    Handles notifications for Garden Memberships:
    1. When a user requests to join (PENDING) -> Notify Garden Managers.
    2. When a request is decided (ACCEPTED/REJECTED) -> Notify the Requesting User.
    """
    target_garden = instance.garden
    requesting_user = instance.user
    current_status = instance.status

    # Only trigger if it's a NEW record and the status is PENDING
    if created and instance.status == 'PENDING':
        requesting_user = instance.user
        target_garden = instance.garden
        
        # Find all active MANAGERS of this garden
        managers_memberships = GardenMembership.objects.filter(
            garden=target_garden,
            role='MANAGER',
            status='ACCEPTED'
        ).select_related('user')
        
        message = f"{requesting_user.username} has requested to join '{target_garden.name}'."

        # Loop through all managers and send a notification to each
        for membership in managers_memberships:
            manager = membership.user
            
            _send_notification(
                notification_receiver=manager,
                notification_title="New Join Request",
                notification_message=message,
                notification_category=NotificationCategory.SOCIAL,
            )

    elif not created and current_status in ['ACCEPTED', 'REJECTED']:
        # Determine the message based on the status
        status_display = instance.get_status_display().lower()
        message = f"Your request to join '{target_garden.name}' has been {status_display}."
        
        title = f"Membership for {target_garden.name} Accepted" if current_status == 'ACCEPTED' else f"Membership for {target_garden.name} Rejected"

        _send_notification(
            notification_receiver=requesting_user,
            notification_title=title,
            notification_message=message,
            notification_category=NotificationCategory.SOCIAL,
        )