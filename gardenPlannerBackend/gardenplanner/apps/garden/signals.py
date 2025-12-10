from django.db.models.signals import post_save, m2m_changed, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from push_notifications.models import GCMDevice
from .models import (
    Notification, 
    NotificationCategory, 
    Task, 
    Profile, 
    Comment, 
    Badge, 
    UserBadge, 
    ForumPost, 
    GardenMembership, 
    EventAttendance, 
    Garden,
    ForumPostLike, 
    CommentLike,
)

def _send_notification(notification_receiver, notification_title, notification_message, notification_category, link=None, send_push_notification=True):

    if notification_receiver == None:
        return

    # Skip if the assigned user has disabled notifications
    if not notification_receiver.profile.receives_notifications:
        return

    Notification.objects.create(
        recipient=notification_receiver,
        message=notification_message,
        category=notification_category,
        link=link
    )

    # We may choose to skip push notifications in certain cases
    # to avoid spamming users, and relieve server load.
    if not send_push_notification:
        return

    devices = GCMDevice.objects.filter(user=notification_receiver, active=True)
    
    data = {
        "data_title": notification_title,
        "data_body": notification_message,
        "type": notification_category.value,
    }
    
    if link:
        data["link"] = link

    devices.send_message(
        message=None,  # Set this to None to force data-only
        extra=data
    )


@receiver(post_save, sender=Task)
def task_update_notification(sender, instance, created, update_fields, **kwargs):
    """
    Send notifications for task status changes.
    Note: M2M notifications for new assignees are handled by task_assignee_changed signal.
    """
    # Don't send status notifications for newly created tasks
    if created:
        return
    
    # If update_fields is specified and doesn't include 'status', skip
    if update_fields is not None and 'status' not in update_fields:
        return
    
    # Send notification for status changes to ACCEPTED, DECLINED, or COMPLETED
    # In a production system, we'd track the old value to avoid duplicate notifications
    # For now, we'll send on these status values
    if instance.status in ['ACCEPTED', 'DECLINED', 'COMPLETED'] and instance.assigned_by:
        status_name = instance.status.title()
        message = f"Task Your task has been {status_name}."
        _send_notification(
            notification_receiver=instance.assigned_by,
            notification_title=f"Task {status_name}",
            notification_message=message,
            notification_category=NotificationCategory.TASK,
            link="/tasks"
        )


@receiver(m2m_changed, sender=Task.assigned_to.through)
def task_assignee_changed(sender, instance, action, pk_set, **kwargs):
    """Send notifications when assignees are added to a task"""
    # Only process when assignees are added (post_add action)
    if action != 'post_add':
        return
    
    # Skip if no assignees were added
    if not pk_set:
        return
    
    message = f"You have been assigned a new task: '{instance.title}'."
    
    # Send notification to newly added assignees
    for user_id in pk_set:
        try:
            assignee = User.objects.get(id=user_id)
            _send_notification(
                notification_receiver=assignee,
                notification_title="New Task Assigned",
                notification_message=message,
                notification_category=NotificationCategory.TASK,
                link="/tasks"
            )
        except User.DoesNotExist:
            pass

    
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
            link=f"/profile/{follower_profile.user.id}"
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
        link=f"/forum/{instance.forum_post.id}"
    )


@receiver(post_save, sender=ForumPostLike)
def new_post_like_notification(sender, instance, created, **kwargs):
    """
    Sends a notification to the post author when someone likes their post.
    'instance' is the ForumPostLike object.
    """
    if not created:
        return

    liker = instance.user
    post = instance.post
    post_author = post.author

    # Do not notify if the user liked their own post
    if liker == post_author:
        return

    message = f"{liker.username} liked your post: '{post.title}'."

    _send_notification(
        notification_receiver=post_author,
        notification_title="New Like",
        notification_message=message,
        notification_category=NotificationCategory.SOCIAL,
        link=f"/forum/{post.id}",
        send_push_notification=False
    )


@receiver(post_save, sender=CommentLike)
def new_comment_like_notification(sender, instance, created, **kwargs):
    """
    Sends a notification to the comment author when someone likes their comment.
    'instance' is the CommentLike object.
    """
    if not created:
        return

    liker = instance.user
    comment = instance.comment
    comment_author = comment.author

    # Do not notify if the user liked their own comment
    if liker == comment_author:
        return

    message = f"{liker.username} liked your comment on '{comment.forum_post.title}'."

    _send_notification(
        notification_receiver=comment_author,
        notification_title="New Like",
        notification_message=message,
        notification_category=NotificationCategory.SOCIAL,
        link=f"/forum/{comment.forum_post.id}" ,
        send_push_notification=False
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
                link=f"/gardens/{target_garden.id}"
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
            link=f"/gardens/{target_garden.id}"
        )
def award_badge(user, badge_key):
    badge = Badge.objects.filter(key=badge_key).first()
    if not badge:
        return
    if not UserBadge.objects.filter(user=user, badge=badge).exists():
        UserBadge.objects.create(user=user, badge=badge)


@receiver(post_save, sender=Task)
def check_task_badges(sender, instance, created, **kwargs):
    created_by_user = instance.assigned_by

    if created:
        total_tasks = Task.objects.filter(assigned_by=created_by_user).count()
        for badge in Badge.objects.filter(category="Task Creation"):
            req = badge.requirement
            if total_tasks >= req.get("tasks_created", 0):
                award_badge(created_by_user, badge.key)

    # For task completion badges, check all assignees
    if instance.status == "COMPLETED":
        for assigned_user in instance.assigned_to.all():
            completed_tasks = Task.objects.filter(
                assigned_to=assigned_user, status="COMPLETED"
            ).count()
            for badge in Badge.objects.filter(category="Task Completion"):
                req = badge.requirement
                if completed_tasks >= req.get("tasks_completed", 0):
                    award_badge(assigned_user, badge.key)

@receiver(m2m_changed, sender=Profile.following.through)
def check_follow_badges(sender, instance, action, pk_set, **kwargs):
    if action != "post_add":
        return

    # instance is the profile that initiated the follow (follower)
    follower_profile = instance
    follower_user = follower_profile.user

    # Check "People Followed" badges for the follower
    following_count = follower_profile.following.count()
    for badge in Badge.objects.filter(category="People Followed"):
        req = badge.requirement
        if following_count >= req.get("following_count", 0):
            award_badge(follower_user, badge.key)

    # pk_set contains the IDs of profiles being followed
    # Check "Followers Gained" badges for each profile being followed
    for followed_profile_id in pk_set:
        followed_profile = Profile.objects.get(id=followed_profile_id)
        followed_user = followed_profile.user
        followers_count = followed_profile.followers.count()
        for badge in Badge.objects.filter(category="Followers Gained"):
            req = badge.requirement
            if followers_count >= req.get("followers_count", 0):
                award_badge(followed_user, badge.key)

@receiver(post_save, sender=ForumPost)
def forum_post_badges(sender, instance, created, **kwargs):
    if not created:
        return

    author = instance.author
    posts_count = ForumPost.objects.filter(author=author, is_deleted=False).count() # filter out soft deleted posts

    for badge in Badge.objects.filter(category="Forum Posts"):
        req = badge.requirement
        if posts_count >= req.get("posts_count", 0):
            award_badge(author, badge.key)

@receiver(post_save, sender=Comment)
def forum_comment_badges(sender, instance, created, **kwargs):
    if not created:
        return

    author = instance.author
    comments_count = Comment.objects.filter(author=author, is_deleted=False).count()

    for badge in Badge.objects.filter(category="Forum Answers / Replies"):
        req = badge.requirement
        if comments_count >= req.get("comments_count", 0):
            award_badge(author, badge.key)

@receiver(post_save, sender=Profile)
def welcome_badge(sender, instance, created, **kwargs):
    if created:
        try:
            badge = Badge.objects.get(key="tiny_sprout")
            award_badge(instance.user, badge.key)
        except Badge.DoesNotExist:
            pass  


@receiver(post_save, sender=GardenMembership)
def garden_membership_badges(sender, instance, created, **kwargs):
    if not created:
        return

    user = instance.user


    total_joined = GardenMembership.objects.filter(user=user, status='ACCEPTED').count()
    for badge in Badge.objects.filter(category="Garden Joining"):
        req = badge.requirement
        if total_joined >= req.get("gardens_joined", 0):
            award_badge(user, badge.key)


    if instance.role == 'MANAGER':
        managers = GardenMembership.objects.filter(garden=instance.garden, role='MANAGER')
        if managers.count() == 1: 
            total_created = GardenMembership.objects.filter(user=user, role='MANAGER').count()
            for badge in Badge.objects.filter(category="Garden Creation"):
                req = badge.requirement
                if total_created >= req.get("gardens_created", 0):
                    award_badge(user, badge.key)


def get_season(dt):
    month = dt.month
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    if month in (9, 10, 11):
        return "autumn"
    return "winter"


@receiver(post_save, sender=EventAttendance)
def event_attendance_badges(sender, instance, created, **kwargs):
    user = instance.user

    # Only count GOING statuses
    if instance.status != "GOING":
        return

    total_attended = EventAttendance.objects.filter(
        user=user,
        status="GOING",
    ).count()

    #  Participation Count Badges
    for badge in Badge.objects.filter(category="Event Participation"):
        req = badge.requirement or {}
        needed = req.get("events_attended", None)
        if needed is not None and total_attended >= needed:
            award_badge(user, badge.key)

    # Seasonal Badges
    event = instance.event
    season = get_season(event.start_at)

    for badge in Badge.objects.filter(category="Event Seasonal"):
        req = badge.requirement or {}
        if req.get("season") == season:
            award_badge(user, badge.key)


@receiver(post_delete, sender=Garden)
def delete_garden_chat(sender, instance, **kwargs):
    """
    Delete the garden chat from Firebase when the garden is deleted.
    """
    try:
        from gardenplanner.apps.chat.firebase_config import get_firestore_client
        db = get_firestore_client()
        if db:
            chat_ref = db.collection('chats').document(f'garden_{instance.id}')
            chat_ref.delete()
            print(f"Garden chat deleted for garden: {instance.name} (ID: {instance.id})")
    except Exception as e:
        print(f"Warning: Could not delete garden chat: {e}")




