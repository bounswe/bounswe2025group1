from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from .models import Notification, NotificationCategory, Task, Profile, Comment, Badge, UserBadge, ForumPost, GardenMembership

@receiver(post_save, sender=Task)
def task_update_notification(sender, instance, created, **kwargs):
    # Skip if there's no one assigned
    if not instance.assigned_to:
        return

    user = instance.assigned_to

    # Skip if the assigned user has disabled notifications
    if not user.profile.receives_notifications:
        return
    
    if created:
        message = f"You have been assigned a new task: '{instance.title}'."
    else:
        message = f"Task updated: '{instance.title}' status is now '{instance.get_status_display()}'."

    Notification.objects.create(
        recipient=user,
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


def award_badge(user, badge_key):
    badge = Badge.objects.filter(key=badge_key).first()
    if not badge:
        return
    if not UserBadge.objects.filter(user=user, badge=badge).exists():
        UserBadge.objects.create(user=user, badge=badge)


@receiver(post_save, sender=Task)
def check_task_badges(sender, instance, created, **kwargs):
    assigned_user = instance.assigned_to
    created_by_user = instance.assigned_by

    if created:
        total_tasks = Task.objects.filter(assigned_by=created_by_user).count()
        for badge in Badge.objects.filter(category="Task Creation"):
            req = badge.requirement
            if total_tasks >= req.get("tasks_created", 0):
                award_badge(created_by_user, badge.key)

    if instance.status == "COMPLETED" and assigned_user:
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

    user = instance.user

    following_count = instance.following.count()
    for badge in Badge.objects.filter(category="People Followed"):
        req = badge.requirement
        if following_count >= req.get("following_count", 0):
            award_badge(user, badge.key)

    followers_count = instance.followers.count()
    for badge in Badge.objects.filter(category="Followers Gained"):
        req = badge.requirement
        if followers_count >= req.get("followers_count", 0):
            award_badge(user, badge.key)

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

    for badge in Badge.objects.filter(category="Forum Answers"):
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


