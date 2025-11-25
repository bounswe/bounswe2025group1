"""Views for managing tasks and custom task types in gardens."""

from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import models
from rest_framework.response import Response
from rest_framework import viewsets, status, filters, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError

from ..serializers import (
    CustomTaskTypeSerializer, TaskSerializer
)
from ..models import GardenMembership, CustomTaskType, Task
from ..permissions import (
    IsGardenManager, IsGardenMember, IsGardenPublic, IsTaskAssignee
)


class CustomTaskTypeViewSet(viewsets.ModelViewSet):
    queryset = CustomTaskType.objects.all()
    serializer_class = CustomTaskTypeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsGardenMember | IsGardenPublic]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsGardenManager]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save()


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at', 'status']
    def get_queryset(self):
        user = self.request.user
        action = getattr(self, 'action', None)

        # Ensure update/partial_update also use the membership-based queryset
        if action in ['retrieve', 'update', 'partial_update', 'assign_task', 'accept_task', 'decline_task', 'complete_task','self_assign_task']:
            memberships = GardenMembership.objects.filter(user=user, status='ACCEPTED')
            garden_ids = memberships.values_list('garden_id', flat=True)
            return Task.objects.filter(garden_id__in=garden_ids)

        garden_id = self.request.query_params.get('garden')
        if not garden_id:
            return Task.objects.none()

        garden_id = int(garden_id)

        if user.profile.role == 'ADMIN':
            return Task.objects.filter(garden_id=garden_id)

        membership = GardenMembership.objects.filter(user=user, garden_id=garden_id, status='ACCEPTED').first()
        if not membership:
            return Task.objects.none()

        return Task.objects.filter(garden_id=garden_id)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated, IsGardenMember | IsGardenPublic]
        elif self.action in ['create']:
            permission_classes = [IsAuthenticated, IsGardenMember]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsGardenManager | IsTaskAssignee]
        elif self.action in ['destroy']:
            permission_classes = [IsAuthenticated, IsGardenManager]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        garden = serializer.validated_data.get('garden')
        user = self.request.user
        assigned_to = serializer.validated_data.get('assigned_to')
        
        
        # Check if user has an ACCEPTED membership for this garden
        membership = GardenMembership.objects.filter(
            user=user,
            garden=garden,
            status='ACCEPTED'
        ).first()
        
        if not membership:
            raise PermissionDenied("You must be an accepted member of this garden to create tasks.")
        
        # If assigning to someone, verify they are also an accepted member
        if assigned_to:
            if not GardenMembership.objects.filter(user=assigned_to, garden=garden, status='ACCEPTED').exists():
                raise ValidationError({"assigned_to": "The assigned user must be an accepted member of this garden."})
        
        serializer.save(assigned_by=user)
    
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_task(self, request, pk=None):
        """Accept a task (workers only)"""
        task = self.get_object()
        
        if task.assigned_to != request.user:
            return Response(
                {"error": "You cannot accept a task that is not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status not in ['PENDING', 'DECLINED']:
            return Response(
                {"error": f"Task cannot be accepted because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'IN_PROGRESS'
        task.save()
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['post'], url_path='decline')
    def decline_task(self, request, pk=None):
        """Decline a task (workers only)"""
        task = self.get_object()
        
        if task.assigned_to != request.user:
            return Response(
                {"error": "You cannot decline a task that is not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status not in ['PENDING', 'ACCEPTED']:
            return Response(
                {"error": f"Task cannot be declined because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'DECLINED'
        task.save()
        return Response(TaskSerializer(task).data)
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_task(self, request, pk=None):
        """Mark a task as completed (workers only)"""
        task = self.get_object()
        
        if task.assigned_to != request.user:
            return Response(
                {"error": "You cannot complete a task that is not assigned to you"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if task.status != 'IN_PROGRESS':
            return Response(
                {"error": f"Task cannot be completed because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'COMPLETED'
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign_task(self, request, pk=None):
        """Assign a user to a task (manager only)"""
        task = self.get_object()

        # Only garden managers or system admins can assign
        membership = GardenMembership.objects.filter(
            user=request.user,
            garden=task.garden,
            role='MANAGER',
            status='ACCEPTED'
        ).first()

        if not (membership or request.user.profile.role == 'ADMIN'):
            return Response({"error": "You do not have permission to assign this task."},
                            status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)
        assigned_user = get_object_or_404(User, id=user_id)
        # Optional: Check if the assigned user is part of the garden
        if not GardenMembership.objects.filter(user=assigned_user, garden=task.garden, status='ACCEPTED').exists():
            return Response({"error": "User is not a member of this garden."}, status=400)

        task.assigned_to = assigned_user
        task.status = 'PENDING'  # optionally reset status
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='self-assign')
    def self_assign_task(self, request, pk=None):
        """Allow a member to self-assign an unassigned or declined task"""
        task = self.get_object()
        user = request.user

        if task.assigned_to is not None and task.assigned_to != user:
            return Response(
                {"error": "This task is already assigned to someone else."},
                status=status.HTTP_403_FORBIDDEN
            )

        if task.status not in ['PENDING', 'DECLINED']:
            return Response(
                {"error": f"Task cannot be self-assigned because it has status: {task.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the user is a valid member of the garden
        is_member = GardenMembership.objects.filter(
            user=user,
            garden=task.garden,
            status='ACCEPTED'
        ).exists()

        if not is_member:
            return Response({"error": "You are not a member of this garden."},
                            status=status.HTTP_403_FORBIDDEN)

        task.assigned_to = user
        task.status = 'IN_PROGRESS'  # 🚀 Directly move to active work
        task.save()

        return Response(TaskSerializer(task).data)


class TaskUpdateView(generics.UpdateAPIView):
    """Dedicated endpoint to update a Task using PUT at /tasks/<pk> (no trailing slash).

    Permissions mirror the TaskViewSet update behavior: only garden managers or
    the task assignee (or system admins) may update the task.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_permissions(self):
        # Follow same permission choices used in TaskViewSet for update operations
        permission_classes = [IsAuthenticated, IsGardenManager | IsTaskAssignee]
        return [permission() for permission in permission_classes]
