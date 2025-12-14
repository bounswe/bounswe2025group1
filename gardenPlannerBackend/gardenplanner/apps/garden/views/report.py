# forum/views.py

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from ..models import Report, Garden, GardenMembership, ForumPost, Comment
from ..serializers import ReportSerializer
from ..permissions import IsMember, IsSystemAdministrator, IsModerator

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def get_permissions(self):
        """
        Return permissions based on action.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsSystemAdministrator]  # only admins can view reports
        elif self.action == 'create':
            permission_classes = [IsMember]  # only members can report
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsSystemAdministrator]  # only managers/admins
        else:
            permission_classes = [IsMember]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        content_type_str = request.data.get('content_type')
        object_id = request.data.get('object_id')
        reason = request.data.get('reason')
        description = request.data.get('description', '')

        try:
            content_type = ContentType.objects.get(model=content_type_str.lower())
        except ContentType.DoesNotExist:
            return Response({'detail': 'Invalid content type.'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch reported object
        try:
            obj = content_type.get_object_for_this_type(pk=object_id)
        except Exception:
            return Response({'detail': 'Reported object not found.'}, status=status.HTTP_404_NOT_FOUND)

        reported_user = None

        if content_type.model == 'user':
            reported_user = obj


        elif hasattr(obj, 'author') and obj.author:
            reported_user = obj.author

        elif content_type.model == 'garden':
            manager_membership = GardenMembership.objects.filter(
                garden=obj,
                role='MANAGER',
                status='ACCEPTED'
            ).select_related('user').first()

            if not manager_membership:
                return Response(
                    {'detail': 'Garden has no active manager.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reported_user = manager_membership.user

            if reported_user == request.user:
                return Response(
                    {'detail': 'You cannot report your own garden.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Safety check
        if reported_user is None:
            return Response(
                {'detail': 'Could not determine reported user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent self-reporting 
        if reported_user == request.user:
            return Response(
                {'detail': 'You cannot report yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent duplicate reports
        if Report.objects.filter(
            reporter=request.user,
            content_type=content_type,
            object_id=object_id
        ).exists():
            return Response(
                {'detail': 'You already reported this content.'},
                status=status.HTTP_400_BAD_REQUEST
            )



        Report.objects.create(
            reporter=request.user,
            reported_user=reported_user,
            content_type=content_type,
            object_id=object_id,
            reason=reason,
            description=description
        )

        return Response(
            {'detail': 'Report submitted successfully.'},
            status=status.HTTP_201_CREATED
        )



class AdminReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all().select_related('reporter')
    serializer_class = ReportSerializer
    permission_classes = [IsModerator]

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        report = self.get_object()
        is_valid = request.data.get('is_valid')
        action_type = request.data.get('action_type')  # 'suspend' or 'ban' for user reports

        report.reviewed = True
        report.is_valid = bool(is_valid)
        report.save()

        if report.is_valid:
            obj = report.content_object
            
            # Handle user reports differently - don't auto-ban/suspend, let suspend_user/ban_user actions handle it
            # Handle garden reports differently - don't auto-delete, let hide_garden/delete_garden actions handle it
            # For other content types (posts, comments), delete them
            if report.content_type.model not in ['user', 'garden']:
                if hasattr(obj, "delete"):
                    obj.delete()

        return Response({'detail': 'Report reviewed successfully.'})
    
    @action(detail=True, methods=['post'])
    def suspend_user(self, request, pk=None):
        """Suspend the user reported in this report"""
        report = self.get_object()
        
        if report.content_type.model != 'user':
            return Response({'detail': 'This action is only available for user reports.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reported_user = User.objects.get(pk=report.object_id)
            suspension_days = request.data.get('suspension_days', 7)
            reason = request.data.get('reason', report.description or f"Reported for: {report.get_reason_display()}")
            
            reported_user.profile.is_suspended = True
            reported_user.profile.suspension_reason = reason
            reported_user.profile.suspended_until = timezone.now() + timedelta(days=suspension_days)
            reported_user.profile.save()
            
            report.reviewed = True
            report.is_valid = True
            report.save()
            
            return Response({
                'detail': f'User {reported_user.username} has been suspended until {reported_user.profile.suspended_until}.'
            })
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def unsuspend_user(self, request, pk=None):
        """Remove suspension penalty from a user (can be called from reviewed history)"""
        report = self.get_object()
        
        if report.content_type.model != 'user':
            return Response({'detail': 'This action is only available for user reports.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reported_user = User.objects.get(pk=report.object_id)
            
            # Remove suspension
            reported_user.profile.is_suspended = False
            reported_user.profile.suspension_reason = None
            reported_user.profile.suspended_until = None
            reported_user.profile.save()
            
            # Update report to reflect that suspension was removed
            # Note: We don't change reviewed/is_valid as this is a follow-up action
            report.is_valid = False  # Marking as invalid since we're removing the penalty
            report.save()
            
            return Response({
                'detail': f'User {reported_user.username} has been unsuspended and can now use the platform again.'
            })
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def ban_user(self, request, pk=None):
        """Ban the user reported in this report and delete all their content"""
        report = self.get_object()
        
        if report.content_type.model != 'user':
            return Response({'detail': 'This action is only available for user reports.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            reported_user = User.objects.get(pk=report.object_id)
            reason = request.data.get('reason', report.description or f"Reported for: {report.get_reason_display()}")
            
            # Delete all forum posts by this user
            posts_count = ForumPost.objects.filter(author=reported_user, is_deleted=False).count()
            for post in ForumPost.objects.filter(author=reported_user, is_deleted=False):
                post.delete()  # Soft delete
            
            # Delete all comments by this user
            comments_count = Comment.objects.filter(author=reported_user, is_deleted=False).count()
            for comment in Comment.objects.filter(author=reported_user, is_deleted=False):
                comment.delete()  # Soft delete
            
            reported_user.profile.is_banned = True
            reported_user.profile.ban_reason = reason
            reported_user.profile.save()
            
            # Deactivate the user account
            reported_user.is_active = False
            reported_user.save()
            
            report.reviewed = True
            report.is_valid = True
            report.save()
            
            return Response({
                'detail': f'User {reported_user.username} has been banned. {posts_count} posts and {comments_count} comments were removed.'
            })
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def hide_garden(self, request, pk=None):
        """Hide the garden reported in this report"""
        report = self.get_object()
        
        if report.content_type.model != 'garden':
            return Response({'detail': 'This action is only available for garden reports.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            garden = Garden.objects.get(pk=report.object_id)
            reason = request.data.get('reason', report.description or f"Reported for: {report.get_reason_display()}")
            
            garden.is_hidden = True
            garden.hidden_reason = reason
            garden.save()
            
            report.reviewed = True
            report.is_valid = True
            report.save()
            
            return Response({
                'detail': f'Garden "{garden.name}" has been hidden.'
            })
        except Garden.DoesNotExist:
            return Response({'detail': 'Garden not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def unhide_garden(self, request, pk=None):
        """Unhide a previously hidden garden"""
        report = self.get_object()
        
        if report.content_type.model != 'garden':
            return Response({'detail': 'This action is only available for garden reports.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            garden = Garden.objects.get(pk=report.object_id)
            
            garden.is_hidden = False
            garden.hidden_reason = None
            garden.save()
            
            report.reviewed = True
            report.is_valid = False  # Marking as invalid since we're unhiding
            report.save()
            
            return Response({
                'detail': f'Garden "{garden.name}" has been unhidden and is now visible again.'
            })
        except Garden.DoesNotExist:
            return Response({'detail': 'Garden not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def delete_garden(self, request, pk=None):
        """Delete the garden reported in this report"""
        report = self.get_object()
        
        if report.content_type.model != 'garden':
            return Response({'detail': 'This action is only available for garden reports.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            garden = Garden.objects.get(pk=report.object_id)
            garden_name = garden.name
            
            garden.delete()
            
            report.reviewed = True
            report.is_valid = True
            report.save()
            
            return Response({
                'detail': f'Garden "{garden_name}" has been deleted.'
            })
        except Garden.DoesNotExist:
            return Response({'detail': 'Garden not found.'}, status=status.HTTP_404_NOT_FOUND)
