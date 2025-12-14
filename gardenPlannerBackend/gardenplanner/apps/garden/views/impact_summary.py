"""View for user impact summary statistics."""

from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from ..models import (
    GardenMembership, 
    Task, 
    ForumPost, 
    Comment, 
    ForumPostLike, 
    CommentLike, 
    GardenEvent, 
    EventAttendance,
    AttendanceStatus,
)
from ..serializers import ImpactSummarySerializer


class UserImpactSummaryView(APIView):
    """
    GET /api/user/<user_id>/impact-summary/
    
    Returns aggregated statistics about a user's contributions across:
    - Profile (member since, followers, following)
    - Gardens (joined, managed)
    - Tasks (completed, assigned, completion rate, response time)
    - Forum (posts, comments, likes received, best answers)
    - Events (created, attended)
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        # Get target user
        target_user = get_object_or_404(User, pk=user_id)
        
        # Check blocking
        requester_profile = request.user.profile
        target_profile = target_user.profile
        
        if requester_profile.is_blocked(target_profile) or target_profile.is_blocked(requester_profile):
            return Response(
                {"detail": "You cannot view this user's impact summary."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ============ Profile Stats ============
        member_since = target_profile.created_at
        followers_count = target_profile.followers.count()
        following_count = target_profile.following.count()
        
        # ============ Garden Activity ============
        gardens_joined = GardenMembership.objects.filter(
            user=target_user, 
            status='ACCEPTED'
        ).count()
        
        gardens_managed = GardenMembership.objects.filter(
            user=target_user, 
            status='ACCEPTED', 
            role='MANAGER'
        ).count()
        
        # ============ Task Stats ============
        # Tasks completed (where user is in assigned_to and status is COMPLETED)
        tasks_completed = Task.objects.filter(
            assigned_to=target_user,
            status='COMPLETED'
        ).count()
        
        # Tasks assigned by user
        tasks_assigned = Task.objects.filter(
            assigned_by=target_user
        ).count()
        
        # Task completion rate
        # Count tasks where user was assigned and either completed or accepted (not pending/declined/cancelled)
        total_accepted_tasks = Task.objects.filter(
            assigned_to=target_user,
            status__in=['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']
        ).count()
        
        if total_accepted_tasks > 0:
            task_completion_rate = (tasks_completed / total_accepted_tasks) * 100
        else:
            task_completion_rate = 0.0
        
        # Average task response time (time from created_at to accepted_at)
        tasks_with_response = Task.objects.filter(
            assigned_to=target_user,
            accepted_at__isnull=False
        ).annotate(
            response_time=ExpressionWrapper(
                F('accepted_at') - F('created_at'),
                output_field=DurationField()
            )
        )
        
        if tasks_with_response.exists():
            avg_response = tasks_with_response.aggregate(
                avg_response_time=Avg('response_time')
            )['avg_response_time']
            if avg_response:
                # Convert to hours
                average_task_response_time_hours = avg_response.total_seconds() / 3600
            else:
                average_task_response_time_hours = None
        else:
            average_task_response_time_hours = None
        
        # ============ Forum Engagement ============
        posts_created = ForumPost.objects.filter(
            author=target_user,
            is_deleted=False
        ).count()
        
        comments_made = Comment.objects.filter(
            author=target_user,
            is_deleted=False
        ).count()
        
        # Likes received on posts
        likes_on_posts = ForumPostLike.objects.filter(
            post__author=target_user
        ).count()
        
        # Likes received on comments
        likes_on_comments = CommentLike.objects.filter(
            comment__author=target_user
        ).count()
        
        likes_received = likes_on_posts + likes_on_comments
        
        # Best answers given by the user
        best_answers = ForumPost.objects.filter(
            best_answer__author=target_user
        ).count()
        
        # ============ Events ============
        events_created = GardenEvent.objects.filter(
            created_by=target_user
        ).count()
        
        events_attended = EventAttendance.objects.filter(
            user=target_user,
            status=AttendanceStatus.GOING
        ).count()
        
        # Build response data
        data = {
            'member_since': member_since,
            'followers_count': followers_count,
            'following_count': following_count,
            'gardens_joined': gardens_joined,
            'gardens_managed': gardens_managed,
            'tasks_completed': tasks_completed,
            'tasks_assigned': tasks_assigned,
            'task_completion_rate': round(task_completion_rate, 2),
            'average_task_response_time_hours': round(average_task_response_time_hours, 2) if average_task_response_time_hours else None,
            'posts_created': posts_created,
            'comments_made': comments_made,
            'likes_received': likes_received,
            'best_answers': best_answers,
            'events_created': events_created,
            'events_attended': events_attended,
        }
        
        serializer = ImpactSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
