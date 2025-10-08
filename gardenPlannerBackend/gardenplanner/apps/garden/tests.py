from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from garden.models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Notification
from unittest.mock import patch


class ModelTests(TestCase):
    """Tests for the model functionality"""

    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpassword1'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpassword2'
        )
        
        # Create a garden
        self.garden = Garden.objects.create(
            name="Test Garden",
            description="A test garden",
            location="Test Location",
            is_public=True
        )
        
        # Create garden membership
        self.membership = GardenMembership.objects.create(
            user=self.user1,
            garden=self.garden,
            role='MANAGER',
            status='ACCEPTED'
        )

    def test_profile_creation(self):
        """Test that profiles are automatically created for users"""
        self.assertTrue(hasattr(self.user1, 'profile'))
        self.assertEqual(self.user1.profile.role, 'MEMBER')  # Default role

    def test_profile_follow_unfollow(self):
        """Test profile follow/unfollow functionality"""
        # User1 follows User2
        self.user1.profile.follow(self.user2.profile)
        self.assertTrue(self.user1.profile.is_following(self.user2.profile))
        
        # User1 unfollows User2
        self.user1.profile.unfollow(self.user2.profile)
        self.assertFalse(self.user1.profile.is_following(self.user2.profile))

    def test_garden_str_representation(self):
        """Test the string representation of a Garden object"""
        self.assertEqual(str(self.garden), "Test Garden")

    def test_garden_membership_str_representation(self):
        """Test the string representation of a GardenMembership object"""
        expected = f"{self.user1.username} - {self.garden.name} (Garden Manager)"
        self.assertEqual(str(self.membership), expected)


class SerializerTests(TestCase):
    """Tests for serializer functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )
        
        self.garden = Garden.objects.create(
            name="Test Garden",
            description="A test garden",
            location="Test Location",
            is_public=True
        )

    def test_user_serializer(self):
        """Test that UserSerializer correctly serializes a User object"""
        from garden.serializers import UserSerializer
        
        serializer = UserSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')
        self.assertTrue('profile' in data)

    def test_garden_serializer(self):
        """Test that GardenSerializer correctly serializes a Garden object"""
        from garden.serializers import GardenSerializer
        
        serializer = GardenSerializer(self.garden)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Test Garden')
        self.assertEqual(data['description'], 'A test garden')
        self.assertEqual(data['location'], 'Test Location')
        self.assertTrue(data['is_public'])


class APITests(APITestCase):
    """Tests for API endpoints"""

    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpassword2'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpassword'
        )
        self.admin_user.profile.role = 'ADMIN'
        self.admin_user.profile.save()
        
        # Create tokens
        self.user_token = Token.objects.create(user=self.user)
        self.user2_token = Token.objects.create(user=self.user2)
        self.admin_token = Token.objects.create(user=self.admin_user)
        
        # Create a garden
        self.garden = Garden.objects.create(
            name="Test Garden",
            description="A test garden",
            location="Test Location",
            is_public=True
        )
        
        # Create garden membership
        self.membership = GardenMembership.objects.create(
            user=self.user,
            garden=self.garden,
            role='MANAGER',
            status='ACCEPTED'
        )
        
        # Create custom task type
        self.task_type = CustomTaskType.objects.create(
            garden=self.garden,
            name="Test Task Type",
            description="A test task type"
        )
        
        # Create task
        self.task = Task.objects.create(
            garden=self.garden,
            title="Existing Task",
            description="An existing task",
            custom_type=self.task_type,
            assigned_by=self.user,
            assigned_to=self.user2,
            status='PENDING'
        )

    # Authentication Endpoints
    @patch('garden.serializers.verify_recaptcha')
    def test_register_user(self, mock_verify_recaptcha):
        """Test user registration"""
        mock_verify_recaptcha.return_value = {'success': True}
        url = reverse('garden:register')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpassword',
            'location': 'New Location',
            'captcha': 'dummy-token'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('token' in response.data)
        
        # Check that the user was created
        self.assertTrue(User.objects.filter(username='newuser').exists())
        
        # Check that profile was created with location
        user = User.objects.get(username='newuser')
        self.assertEqual(user.profile.location, 'New Location')

    @patch('garden.serializers.verify_recaptcha')
    def test_login(self, mock_verify_recaptcha):
        """Test user login"""
        mock_verify_recaptcha.return_value = {'success': True}
        url = reverse('garden:login')
        data = {
            'username': 'testuser',
            'password': 'testpassword',
            'captcha': 'dummy-token'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('token' in response.data)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_logout(self):
        """Test user logout"""
        url = reverse('garden:logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify token is deleted
        self.assertFalse(Token.objects.filter(key=self.user_token.key).exists())
    
    def test_password_reset_request(self):
        """Test password reset request"""
        url = reverse('garden:password_reset')
        data = {
            'email': 'test@example.com'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # Profile Endpoints
    
    def test_get_profile(self):
        """Test getting user profile"""
        url = reverse('garden:profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertTrue('profile' in response.data)
    
    def test_update_profile(self):
        """Test updating user profile"""
        url = reverse('garden:profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'location': 'Updated Location'
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['location'], 'Updated Location')
    
    def test_get_user_profile(self):
        """Test getting another user's profile"""
        url = reverse('garden:user-profile', args=[self.user2.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser2')
    
    def test_follow_user(self):
        """Test following a user"""
        url = reverse('garden:follow')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'user_id': self.user2.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user1 is following user2
        self.assertTrue(self.user.profile.is_following(self.user2.profile))
    
    def test_unfollow_user(self):
        """Test unfollowing a user"""
        # First follow the user
        self.user.profile.follow(self.user2.profile)
        
        url = reverse('garden:follow')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'user_id': self.user2.id
        }
        
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user1 is not following user2
        self.assertFalse(self.user.profile.is_following(self.user2.profile))
    
    def test_get_followers(self):
        """Test getting list of followers"""
        # First make user2 follow user1
        self.user2.profile.follow(self.user.profile)
        
        url = reverse('garden:followers')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'testuser2')
    
    def test_get_following(self):
        """Test getting list of users being followed"""
        # First make user1 follow user2
        self.user.profile.follow(self.user2.profile)
        
        url = reverse('garden:following')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'testuser2')
    
    # Garden Endpoints
    
    def test_garden_list(self):
        """Test listing gardens"""
        url = reverse('garden:garden-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_garden_detail(self):
        """Test retrieving a garden's details"""
        url = reverse('garden:garden-detail', args=[self.garden.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Garden')
    
    def test_create_garden(self):
        """Test creating a garden"""
        url = reverse('garden:garden-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'name': 'New Garden',
            'description': 'A new garden',
            'location': 'New Location',
            'is_public': True
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that garden was created
        self.assertTrue(Garden.objects.filter(name='New Garden').exists())
        
        # Check that user is a manager of the garden
        garden = Garden.objects.get(name='New Garden')
        membership = GardenMembership.objects.get(garden=garden, user=self.user)
        self.assertEqual(membership.role, 'MANAGER')
    
    def test_update_garden(self):
        """Test updating a garden"""
        url = reverse('garden:garden-detail', args=[self.garden.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'name': 'Updated Garden',
            'description': 'An updated garden',
            'location': 'Updated Location',
            'is_public': False
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that garden was updated
        garden = Garden.objects.get(id=self.garden.id)
        self.assertEqual(garden.name, 'Updated Garden')
        self.assertEqual(garden.is_public, False)
    
    # Garden Membership Endpoints
    
    def test_membership_list(self):
        """Test listing garden memberships"""
        url = reverse('garden:membership-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_membership(self):
        """Test creating a garden membership"""
        url = reverse('garden:membership-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        data = {
            'garden': self.garden.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that membership was created
        membership = GardenMembership.objects.get(garden=self.garden, user=self.user2)
        self.assertEqual(membership.role, 'WORKER')
        self.assertEqual(membership.status, 'PENDING')
    
    def test_my_gardens(self):
        """Test listing user's gardens"""
        url = reverse('garden:membership-my-gardens')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Garden')
    
    def test_accept_membership(self):
        """Test accepting a garden membership"""
        # Create a pending membership
        pending_membership = GardenMembership.objects.create(
            user=self.user2,
            garden=self.garden,
            role='WORKER',
            status='PENDING'
        )
        
        url = reverse('garden:membership-accept', args=[pending_membership.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that membership was accepted
        membership = GardenMembership.objects.get(id=pending_membership.id)
        self.assertEqual(membership.status, 'ACCEPTED')
    
    # Garden Task Type Endpoints
    
    def test_task_type_list(self):
        """Test listing task types"""
        url = reverse('garden:task-type-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_task_type(self):
        """Test creating a task type"""
        url = reverse('garden:task-type-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'garden': self.garden.id,
            'name': 'New Task Type',
            'description': 'A new task type'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that task type was created
        self.assertTrue(CustomTaskType.objects.filter(name='New Task Type').exists())
    
    # Garden Task Endpoints
    
    def test_task_list(self):
        """Test listing tasks"""
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_task(self):
        """Test creating a task"""
        url = reverse('garden:task-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'garden': self.garden.id,
            'title': 'New Task',
            'description': 'A new task',
            'custom_type': self.task_type.id,
            'assigned_to': self.user2.id,
            'status': 'PENDING'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that task was created
        self.assertTrue(Task.objects.filter(title='New Task').exists())
    


class ForumPostTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        self.forum_url = reverse('garden:forum-list-create')
    
    def test_create_forum_post(self):
        data = {'title': 'Test Post', 'content': 'This is a test post.'}
        response = self.client.post(self.forum_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ForumPost.objects.count(), 1)
        self.assertEqual(ForumPost.objects.get().title, 'Test Post')
        self.assertEqual(ForumPost.objects.get().author, self.user)
    
    def test_list_forum_posts(self):
        ForumPost.objects.create(title='Post 1', content='Content 1', author=self.user)
        ForumPost.objects.create(title='Post 2', content='Content 2', author=self.user)
        
        response = self.client.get(self.forum_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_retrieve_single_post(self):
        post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        url = reverse('garden:forum-detail', args=[post.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Post')
    
    def test_update_forum_post(self):
        post = ForumPost.objects.create(title='Original Title', content='Original Content', author=self.user)
        url = reverse('garden:forum-detail', args=[post.id])
        
        data = {'title': 'Updated Title', 'content': 'Updated Content'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post.refresh_from_db()
        self.assertEqual(post.title, 'Updated Title')
    
    def test_delete_forum_post(self):
        post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        url = reverse('garden:forum-detail', args=[post.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ForumPost.objects.count(), 0)


class CommentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        self.comment_url = reverse('garden:comment-list-create')
    
    def test_create_comment(self):
        data = {'forum_post': self.post.id, 'content': 'This is a test comment'}
        response = self.client.post(self.comment_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)
    
    def test_list_comments(self):
        Comment.objects.create(forum_post=self.post, content='Comment 1', author=self.user)
        Comment.objects.create(forum_post=self.post, content='Comment 2', author=self.user)
        
        response = self.client.get(self.comment_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_update_comment(self):
        comment = Comment.objects.create(forum_post=self.post, content='Original Comment', author=self.user)
        url = reverse('garden:comment-detail', args=[comment.id])
        
        data = {'forum_post': self.post.id, 'content': 'Updated Comment'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        comment.refresh_from_db()
        self.assertEqual(comment.content, 'Updated Comment')
    
    def test_delete_comment(self):
        comment = Comment.objects.create(forum_post=self.post, content='Test Comment', author=self.user)
        url = reverse('garden:comment-detail', args=[comment.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Comment.objects.count(), 0)


class WeatherDataViewTests(APITestCase):
    @patch('garden.views.get_weather_data')
    def test_weather_data_success(self, mock_get_weather_data):
        # Mock the successful weather data response
        mock_get_weather_data.return_value = {
            "main": {"temp": 25},
            "weather": [{"description": "clear sky"}],
            "name": "Istanbul"
        }

        response = self.client.get(reverse('weather'), {'location': 'Istanbul'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('main', response.data)
        self.assertEqual(response.data['name'], 'Istanbul')

    @patch('garden.views.get_weather_data')
    def test_weather_location_not_found(self, mock_get_weather_data):
        mock_get_weather_data.return_value = {'error': 'Location not found'}
        response = self.client.get(reverse('weather'), {'location': 'Atlantis'})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'Location not found. Please check the city name or provide a more specific location.')

    def test_weather_missing_location_param(self):
        response = self.client.get(reverse('weather'))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Location parameter is required')


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')
        
        self.notification1_user1 = Notification.objects.create(recipient=self.user1, message='Message 1 for user1', read=False)
        self.notification2_user1 = Notification.objects.create(recipient=self.user1, message='Message 2 for user1', read=False)
        self.notification3_user1 = Notification.objects.create(recipient=self.user1, message='Message 3 for user1', read=True)
        
        self.notification1_user2 = Notification.objects.create(recipient=self.user2, message='Message 1 for user2', read=False)
        
        self.client.force_authenticate(user=self.user1)

    def test_list_notifications_for_authenticated_user(self):
        """
        Ensure a user can only list their own notifications.
        """
        url = reverse('garden:notification-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_retrieve_own_notification(self):
        """
        Ensure a user can retrieve a detail view of their own notification.
        """
        url = reverse('garden:notification-detail', args=[self.notification1_user1.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], self.notification1_user1.message)

    def test_cannot_retrieve_other_user_notification(self):
        """
        Ensure a user gets a 404 when trying to access another user's notification.
        """
        url = reverse('garden:notification-detail', args=[self.notification1_user2.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_unread_count(self):
        """
        Ensure the unread_count action returns the correct count.
        """
        url = reverse('garden:notification-unread-count')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 2)

    def test_mark_as_read(self):
        """
        Ensure the mark_as_read action correctly updates a notification.
        """
        self.assertFalse(self.notification1_user1.read)

        url = reverse('garden:notification-mark-as-read', args=[self.notification1_user1.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.notification1_user1.refresh_from_db()
        self.assertTrue(self.notification1_user1.read)

    def test_mark_all_as_read(self):
        """
        Ensure the mark_all_as_read action updates all of the user's notifications.
        """
        url = reverse('garden:notification-mark-all-as-read')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        user1_notifications = Notification.objects.filter(recipient=self.user1)
        for notif in user1_notifications:
            self.assertTrue(notif.read)

        self.notification1_user2.refresh_from_db()
        self.assertFalse(self.notification1_user2.read)
