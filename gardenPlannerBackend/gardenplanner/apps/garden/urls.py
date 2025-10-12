from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'garden'

# Create a router for viewsets
router = DefaultRouter()
router.register(r'gardens', views.GardenViewSet, basename='garden')
router.register(r'memberships', views.GardenMembershipViewSet, basename='membership')
router.register(r'task-types', views.CustomTaskTypeViewSet, basename='task-type')
router.register(r'tasks', views.TaskViewSet, basename='task')

# Create forum-specific URL patterns
forum_patterns = [
    path('', views.ForumPostListCreateView.as_view(), name='forum-list-create'),
    path('<int:pk>/', views.ForumPostRetrieveUpdateDestroyView.as_view(), name='forum-detail'),
    path('comments/', views.CommentListCreateView.as_view(), name='comment-list-create'),
    path('comments/<int:pk>/', views.CommentRetrieveUpdateDestroyView.as_view(), name='comment-detail'),
]

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('password-reset/', views.PasswordResetAPIView.as_view(), name='password_reset'),
    path('reset/<uidb64>/<token>/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Profile management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/<int:user_id>/', views.UserProfileView.as_view(), name='user-profile'),
    path('profile/follow/', views.FollowView.as_view(), name='follow'),
    path('profile/followers/', views.FollowersListView.as_view(), name='followers'),
    path('profile/following/', views.FollowingListView.as_view(), name='following'),
    path('profile/block/', views.BlockUnblockView.as_view(), name='block-unblock'),
    # Public endpoints to view arbitrary user's followers/following
    path('user/<int:user_id>/followers/', views.UserFollowersView.as_view(), name='user-followers'),
    path('user/<int:user_id>/following/', views.UserFollowingView.as_view(), name='user-following'),
    
    # Forum endpoints with namespace
    path('forum/', include(forum_patterns)),
    
    # External API integrations
    path('weather/', views.WeatherDataView.as_view(), name='weather'),
] 
