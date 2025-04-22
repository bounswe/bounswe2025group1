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
] 
