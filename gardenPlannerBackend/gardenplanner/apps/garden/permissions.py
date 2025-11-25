from rest_framework import permissions
from .models import GardenMembership, Garden

class IsSystemAdministrator(permissions.BasePermission):
    """
    Allows access only to system administrators.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.profile.role == 'ADMIN'


class IsModerator(permissions.BasePermission):
    """
    Allows access only to moderators or system administrators.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.profile.role in ['ADMIN', 'MODERATOR']


class IsMember(permissions.BasePermission):
    """
    Allows access only to authenticated members.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.profile.role in ['ADMIN', 'MODERATOR', 'MEMBER']


class IsGardenManager(permissions.BasePermission):
    """
    Allows access only to garden managers for a specific garden.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # System administrators have full access
        if request.user.profile.role == 'ADMIN':
            return True
        
        # Check if the user is a garden manager
        garden_id = None
        
        if hasattr(obj, 'garden_id'):
            garden_id = obj.garden_id
        elif hasattr(obj, 'id') and isinstance(obj, Garden):
            garden_id = obj.id
            
        if garden_id:
            try:
                membership = GardenMembership.objects.get(
                    user=request.user,
                    garden_id=garden_id,
                    status='ACCEPTED'
                )
                return membership.role == 'MANAGER'
            except GardenMembership.DoesNotExist:
                return False
                
        return False


class IsGardenMember(permissions.BasePermission):
    """
    Allows access only to garden members (managers or workers) for a specific garden.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # System administrators have full access
        if request.user.profile.role == 'ADMIN':
            return True
            
        # Check if the user is a garden member
        garden_id = None
        
        if hasattr(obj, 'garden_id'):
            garden_id = obj.garden_id
        elif hasattr(obj, 'id') and isinstance(obj, Garden):
            garden_id = obj.id
            
        if garden_id:
            try:
                membership = GardenMembership.objects.get(
                    user=request.user,
                    garden_id=garden_id,
                    status='ACCEPTED'
                )
                return True
            except GardenMembership.DoesNotExist:
                return False
                
        return False


class IsGardenPublic(permissions.BasePermission):
    """
    Allows read-only access to public gardens or garden info.
    """
    def has_object_permission(self, request, view, obj):
        # For GET, HEAD, OPTIONS requests only
        if request.method in permissions.SAFE_METHODS:
            garden = None
            
            if hasattr(obj, 'is_public'):
                garden = obj
            elif hasattr(obj, 'garden'):
                garden = obj.garden
                
            if garden and garden.is_public:
                return True
                
        return False


class IsTaskAssignee(permissions.BasePermission):
    """
    Allows access to users who are assigned to a specific task.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # System administrators have full access
        if request.user.profile.role == 'ADMIN':
            return True
            
        # Check if user is assigned to this task
        if hasattr(obj, 'assigned_to') and obj.assigned_to == request.user:
            return True
            
        return False


class CanDeleteMembership(permissions.BasePermission):
    """
    Allows users to delete their own membership (leave garden) or
    allows garden managers to delete any membership in their garden.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # System administrators have full access
        if request.user.profile.role == 'ADMIN':
            return True
        
        # Users can always delete their own membership (leave garden)
        if isinstance(obj, GardenMembership) and obj.user == request.user:
            return True
        
        # Garden managers can delete any membership in their garden
        if isinstance(obj, GardenMembership):
            garden_id = obj.garden_id
            try:
                membership = GardenMembership.objects.get(
                    user=request.user,
                    garden_id=garden_id,
                    status='ACCEPTED'
                )
                return membership.role == 'MANAGER'
            except GardenMembership.DoesNotExist:
                return False
        
        return False 