"""This file is used to make the views package a module and to facilitate imports."""

from .forumpost import (
    ForumPostListCreateView,
    ForumPostRetrieveUpdateDestroyView,
    CommentListCreateView,
    CommentRetrieveUpdateDestroyView
)
from .userauth import (
    RegisterView,
    CustomLoginView,
    LogoutView,
    PasswordResetAPIView,
    PasswordResetConfirmView
)
from .profile import (
    ProfileView,
    UserProfileView,
    FollowView,
    FollowersListView,
    FollowingListView,
    BlockUnblockView
)
from .garden import (
    GardenViewSet,
    GardenMembershipViewSet
)
from .task import (
    CustomTaskTypeViewSet,
    TaskViewSet
)
from .notification import NotificationViewSet
from .weatherdata import WeatherDataView


__all__ = [
    # Forum and Comment Views
    "ForumPostListCreateView",
    "ForumPostRetrieveUpdateDestroyView",
    "CommentListCreateView",
    "CommentRetrieveUpdateDestroyView",
    # User Authentication Views
    "RegisterView",
    "CustomLoginView",
    "LogoutView",
    "PasswordResetAPIView",
    "PasswordResetConfirmView",
    # Profile Views
    "ProfileView",
    "UserProfileView",
    "FollowView",
    "FollowersListView",
    "FollowingListView",
    "BlockUnblockView",
    # Garden Views
    "GardenViewSet",
    "GardenMembershipViewSet",
    # Task Views
    "CustomTaskTypeViewSet",
    "TaskViewSet",
    # Notification Views
    "NotificationViewSet",
    # Other Views
    "WeatherDataView",
]
