from django.urls import path

from . import views

app_name = 'garden'

urlpatterns = [
    # API endpoints will be added here
    # For example:
    # path('plants/', views.plant_list, name='plant-list'),
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
    # ForumPost Management
    path('forum/', views.ForumPostListCreateView.as_view(), name='forum-list-create'),
    path('forum/<int:pk>/', views.ForumPostRetrieveUpdateDestroyView.as_view(), name='forum-detail'),
] 
