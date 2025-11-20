from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.contenttypes.models import ContentType
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task, ForumPost, Comment, Report, Notification
from unittest.mock import patch, MagicMock


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
        from .serializers import UserSerializer
        
        serializer = UserSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')
        self.assertTrue('profile' in data)

    def test_garden_serializer(self):
        """Test that GardenSerializer correctly serializes a Garden object"""
        from .serializers import GardenSerializer
        
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
    def test_register_user(self):
        """Test user registration"""
        url = reverse('garden:register')
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpassword',
            'location': 'New Location'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('token' in response.data)
        
        # Check that the user was created
        self.assertTrue(User.objects.filter(username='newuser').exists())
        
        # Check that profile was created with location
        user = User.objects.get(username='newuser')
        self.assertEqual(user.profile.location, 'New Location')

    def test_login(self):
        """Test user login"""
        url = reverse('garden:login')
        data = {
            'username': 'testuser',
            'password': 'testpassword'
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
        self.assertEqual(response.data['profile']['location'], 'Updated Location')
    
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
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        data = {
            'garden': self.garden.id,
            'title': 'New Task',
            'description': 'A new task',
            'due_date': '2025-12-31T23:59:59Z',  # This line is required
            'custom_type': self.task_type.id,
            'assigned_to': None,
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
        post.refresh_from_db()
        self.assertTrue(post.is_deleted)


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
        comment.refresh_from_db()
        self.assertTrue(comment.is_deleted)


class WeatherDataViewTests(APITestCase):
    @patch('gardenplanner.apps.garden.views.weatherdata.get_weather_data')
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

    @patch('gardenplanner.apps.garden.views.weatherdata.get_weather_data')
    def test_weather_location_not_found(self, mock_get_weather_data):
        mock_get_weather_data.return_value = {'error': 'Location not found'}
        response = self.client.get(reverse('weather'), {'location': 'Atlantis'})
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['error'], 'Location not found. Please check the city name or provide a more specific location.')

    def test_weather_missing_location_param(self):
        response = self.client.get(reverse('weather'))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'Location parameter is required')

# In garden/tests.py

class ReportingSystemTests(APITestCase):
    """Tests the core functionality and permissions for user reporting and admin review."""

    def setUp(self):
        def get_auth_token(user):
            token, _ = Token.objects.get_or_create(user=user)
            return token.key
        self.get_auth_token = get_auth_token

        self.user = User.objects.create_user(username='reporter', password='pw')
        self.admin_user = User.objects.create_superuser(username='admin', email='a@a.com', password='pw')
        Profile.objects.filter(user=self.admin_user).update(role='ADMIN')

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.get_auth_token(self.user)}')
        self.admin_client = self.client_class()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Token {self.get_auth_token(self.admin_user)}')
        
        self.report_url = reverse('garden:report-list')
        self.admin_reports_url = reverse('garden:admin-report-list')

        self.post = ForumPost.objects.create(title="Post to Report", content="Content", author=self.user)
        self.comment = Comment.objects.create(forum_post=self.post, content="Comment", author=self.user)


    # --- Test Report Creation (User) ---

    def test_create_report_success(self):
        """User can successfully report a ForumPost."""
        data = {'content_type': 'forumpost', 'object_id': self.post.id, 'reason': 'abuse'}
        response = self.client.post(self.report_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        self.assertEqual(Report.objects.first().reporter, self.user)
        self.assertEqual(Report.objects.first().content_object, self.post)

    def test_create_report_duplicate_fail(self):
        """User cannot report the same object twice."""
        data = {'content_type': 'forumpost', 'object_id': self.post.id, 'reason': 'spam'}
        self.client.post(self.report_url, data, format='json')
        
        response = self.client.post(self.report_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'You already reported this content.')
    
    def test_create_report_invalid_type_fail(self):
        """Invalid content_type string fails with 400."""
        data = {'content_type': 'badmodel', 'object_id': 999, 'reason': 'other'}
        response = self.client.post(self.report_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


  
    # --- Test Admin Review (AdminReportViewSet) ---

    def test_admin_list_and_review_access(self):
        """Only admins can access the admin report list."""
        non_admin_client = self.client_class()
        non_admin_client.credentials(HTTP_AUTHORIZATION=f'Token {self.get_auth_token(self.user)}')
        response = non_admin_client.get(self.admin_reports_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.admin_client.get(self.admin_reports_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_review_mark_valid_deletes_content(self):
        """Marking a report as VALID should soft-delete the reported content."""
        data = {'content_type': 'forumpost', 'object_id': self.post.id, 'reason': 'abuse'}
        self.client.post(self.report_url, data, format='json')
        report_id = Report.objects.first().id
        
        review_url = reverse('garden:admin-report-review', kwargs={'pk': report_id})
        
        response = self.admin_client.post(review_url, {'is_valid': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        report = Report.objects.get(id=report_id)
        self.assertTrue(report.reviewed)
        self.assertTrue(report.is_valid)
        self.post.refresh_from_db()
        self.assertTrue(self.post.is_deleted, "Post must be soft-deleted by admin action.")

    def test_admin_review_mark_invalid_keeps_content(self):
        """Marking a report as INVALID should mark it reviewed but preserve the content."""
        data = {'content_type': 'forumpost', 'object_id': self.post.id, 'reason': 'abuse'}
        self.client.post(self.report_url, data, format='json')
        report_id = Report.objects.first().id
        
        review_url = reverse('garden:admin-report-review', kwargs={'pk': report_id})

        response = self.admin_client.post(review_url, {'is_valid': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        report = Report.objects.get(id=report_id)
        self.assertTrue(report.reviewed)
        self.assertFalse(report.is_valid)
        self.post.refresh_from_db()
        self.assertFalse(self.post.is_deleted, "Post must NOT be soft-deleted by invalid report.")

class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='user1', password='password123')
        self.user2 = User.objects.create_user(username='user2', password='password123')
        
        self.notification1_user1 = Notification.objects.create(recipient=self.user1, message='Message 1 for user1', read=False, category='FORUM')
        self.notification2_user1 = Notification.objects.create(recipient=self.user1, message='Message 2 for user1', read=False, category='FORUM')
        self.notification3_user1 = Notification.objects.create(recipient=self.user1, message='Message 3 for user1', read=True, category='FORUM')
        
        self.notification1_user2 = Notification.objects.create(recipient=self.user2, message='Message 1 for user2', read=False, category='FORUM')
        
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



class TaskActionTests(APITestCase):
    """Tests for TaskViewSet custom actions"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user3 = User.objects.create_user(username='testuser3', password='password123')
        
        self.user_token = Token.objects.create(user=self.user)
        self.user2_token = Token.objects.create(user=self.user2)
        self.user3_token = Token.objects.create(user=self.user3)
        
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        
        # User is manager
        GardenMembership.objects.create(user=self.user, garden=self.garden, role='MANAGER', status='ACCEPTED')
        # User2 is worker
        GardenMembership.objects.create(user=self.user2, garden=self.garden, role='WORKER', status='ACCEPTED')
        # User3 is worker
        GardenMembership.objects.create(user=self.user3, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='Test Type')
        
        self.task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            description='Test Description',
            custom_type=self.task_type,
            assigned_by=self.user,
            assigned_to=self.user2,
            status='PENDING'
        )
    
    def test_accept_task(self):
        """Test accepting a task"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-accept-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'IN_PROGRESS')
    
    def test_accept_task_wrong_user(self):
        """Test accepting a task assigned to someone else"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user3_token.key}')
        url = reverse('garden:task-accept-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_accept_task_invalid_status(self):
        """Test accepting a task with invalid status"""
        self.task.status = 'COMPLETED'
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-accept-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_decline_task(self):
        """Test declining a task"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-decline-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'DECLINED')
    
    def test_decline_task_wrong_user(self):
        """Test declining a task assigned to someone else"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user3_token.key}')
        url = reverse('garden:task-decline-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_decline_task_invalid_status(self):
        """Test declining a task with invalid status"""
        self.task.status = 'COMPLETED'
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-decline-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_complete_task(self):
        """Test completing a task"""
        self.task.status = 'IN_PROGRESS'
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-complete-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'COMPLETED')
    
    def test_complete_task_wrong_user(self):
        """Test completing a task assigned to someone else"""
        self.task.status = 'IN_PROGRESS'
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user3_token.key}')
        url = reverse('garden:task-complete-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_complete_task_invalid_status(self):
        """Test completing a task with invalid status"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-complete-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_assign_task(self):
        """Test assigning a task to a user"""
        self.task.assigned_to = None
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-assign-task', args=[self.task.id])
        data = {'user_id': self.user3.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task.refresh_from_db()
        self.assertEqual(self.task.assigned_to, self.user3)
        self.assertEqual(self.task.status, 'PENDING')
    
    def test_assign_task_non_manager(self):
        """Test assigning a task as non-manager"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:task-assign-task', args=[self.task.id])
        data = {'user_id': self.user3.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_assign_task_non_member(self):
        """Test assigning a task to a non-member"""
        non_member = User.objects.create_user(username='nonmember', password='password123')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-assign-task', args=[self.task.id])
        data = {'user_id': non_member.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_self_assign_task(self):
        """Test self-assigning a task"""
        self.task.assigned_to = None
        self.task.status = 'PENDING'
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user3_token.key}')
        url = reverse('garden:task-self-assign-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task.refresh_from_db()
        self.assertEqual(self.task.assigned_to, self.user3)
        self.assertEqual(self.task.status, 'IN_PROGRESS')
    
    def test_self_assign_task_already_assigned(self):
        """Test self-assigning an already assigned task"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user3_token.key}')
        url = reverse('garden:task-self-assign-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_self_assign_task_invalid_status(self):
        """Test self-assigning a task with invalid status"""
        self.task.assigned_to = None
        self.task.status = 'COMPLETED'
        self.task.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user3_token.key}')
        url = reverse('garden:task-self-assign-task', args=[self.task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_task_update_view(self):
        """Test TaskUpdateView"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-update', args=[self.task.id])
        data = {'title': 'Updated Task Title'}
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Updated Task Title')


class ProfileEndpointTests(APITestCase):
    """Tests for profile-related endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user3 = User.objects.create_user(username='testuser3', password='password123')
        
        self.user_token = Token.objects.create(user=self.user)
        self.user2_token = Token.objects.create(user=self.user2)
        
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        GardenMembership.objects.create(user=self.user2, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        self.task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            assigned_by=self.user2,
            assigned_to=self.user2,
            status='PENDING'
        )
    
    def test_user_gardens_view(self):
        """Test getting user's gardens"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-gardens', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_user_gardens_view_blocked(self):
        """Test getting user's gardens when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-gardens', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_tasks_view(self):
        """Test getting user's tasks"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-tasks', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_user_tasks_view_blocked(self):
        """Test getting user's tasks when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-tasks', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_tasks_view_admin(self):
        """Test admin sees all tasks"""
        self.user.profile.role = 'ADMIN'
        self.user.profile.save()
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-tasks', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_tasks_view_public_garden(self):
        """Test public garden tasks are visible"""
        private_garden = Garden.objects.create(name='Private Garden', is_public=False)
        GardenMembership.objects.create(user=self.user3, garden=private_garden, role='WORKER', status='ACCEPTED')
        Task.objects.create(
            garden=private_garden,
            title='Private Task',
            assigned_by=self.user3,
            assigned_to=self.user3
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-tasks', args=[self.user3.id])
        
        response = self.client.get(url)
        # Should not see private garden tasks
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_user_followers_view(self):
        """Test getting user's followers"""
        self.user2.profile.followers.add(self.user.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-followers', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_user_followers_view_blocked(self):
        """Test getting user's followers when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-followers', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_following_view(self):
        """Test getting user's following list"""
        self.user2.profile.following.add(self.user.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-following', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_user_following_view_blocked(self):
        """Test getting user's following list when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-following', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_is_following_view(self):
        """Test checking if user is following another user"""
        self.user.profile.following.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-is-following', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_following'])
    
    def test_user_is_following_view_blocked(self):
        """Test checking following status when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-is-following', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_block_user(self):
        """Test blocking a user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:block-unblock')
        data = {'user_id': self.user2.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(self.user.profile.is_blocked(self.user2.profile))
    
    def test_block_user_self(self):
        """Test blocking yourself"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:block-unblock')
        data = {'user_id': self.user.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unblock_user(self):
        """Test unblocking a user"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:block-unblock')
        data = {'user_id': self.user2.id}
        
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertFalse(self.user.profile.is_blocked(self.user2.profile))
    
    def test_get_block_status(self):
        """Test getting block status"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:block-unblock') + f'?user_id={self.user2.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_blocked_by_me'])
        self.assertFalse(response.data['is_blocked_by_them'])


class GardenEndpointTests(APITestCase):
    """Tests for garden-related endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user3 = User.objects.create_user(username='testuser3', password='password123')
        
        self.user_token = Token.objects.create(user=self.user)
        self.user2_token = Token.objects.create(user=self.user2)
        
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        GardenMembership.objects.create(user=self.user, garden=self.garden, role='MANAGER', status='ACCEPTED')
        GardenMembership.objects.create(user=self.user2, garden=self.garden, role='WORKER', status='ACCEPTED')
    
    def test_garden_members_list(self):
        """Test getting garden members list"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:garden-members', args=[self.garden.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_delete_membership(self):
        """Test deleting a membership"""
        membership = GardenMembership.objects.create(
            user=self.user3,
            garden=self.garden,
            role='WORKER',
            status='ACCEPTED'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:membership-detail', args=[membership.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GardenMembership.objects.filter(id=membership.id).exists())
    
    def test_delete_membership_promotes_manager(self):
        """Test that deleting last manager promotes another member"""
        # Make user2 a worker
        membership2 = GardenMembership.objects.get(user=self.user2, garden=self.garden)
        membership2.role = 'WORKER'
        membership2.save()
        
        # Delete manager (user)
        membership = GardenMembership.objects.get(user=self.user, garden=self.garden)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:membership-detail', args=[membership.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that user2 was promoted to manager
        membership2.refresh_from_db()
        self.assertEqual(membership2.role, 'MANAGER')
    
    def test_delete_membership_deletes_garden(self):
        """Test that deleting last member deletes the garden"""
        # Delete user2 membership
        membership2 = GardenMembership.objects.get(user=self.user2, garden=self.garden)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:membership-detail', args=[membership2.id])
        self.client.delete(url)
        
        # Delete user membership (last one)
        membership = GardenMembership.objects.get(user=self.user, garden=self.garden)
        url = reverse('garden:membership-detail', args=[membership.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Garden should be deleted
        self.assertFalse(Garden.objects.filter(id=self.garden.id).exists())


class AuthEndpointTests(APITestCase):
    """Tests for authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
    
    def test_password_reset_confirm(self):
        """Test password reset confirmation"""
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        
        url = reverse('garden:password_reset_confirm', args=[uid, token])
        data = {'new_password': 'newpassword123'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))
    
    def test_password_reset_confirm_invalid_token(self):
        """Test password reset with invalid token"""
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = 'invalid_token'
        
        url = reverse('garden:password_reset_confirm', args=[uid, token])
        data = {'new_password': 'newpassword123'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_password_reset_confirm_missing_password(self):
        """Test password reset without password"""
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        
        url = reverse('garden:password_reset_confirm', args=[uid, token])
        data = {}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)



class PermissionTests(TestCase):
    """Tests for permission classes"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.moderator = User.objects.create_user(username='moderator', password='password123')
        self.moderator.profile.role = 'MODERATOR'
        self.moderator.profile.save()
        
        self.admin = User.objects.create_user(username='admin', password='password123')
        self.admin.profile.role = 'ADMIN'
        self.admin.profile.save()
        
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        self.private_garden = Garden.objects.create(name='Private Garden', is_public=False)
        
        GardenMembership.objects.create(user=self.user, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        self.task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            assigned_by=self.user,
            assigned_to=self.user,
            status='PENDING'
        )
        
        self.membership = GardenMembership.objects.get(user=self.user, garden=self.garden)
    
    def test_is_moderator_permission(self):
        """Test IsModerator permission"""
        from .permissions import IsModerator
        
        permission = IsModerator()
        
        # Create mock request
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        # Moderator should have access
        request = MockRequest(self.moderator)
        self.assertTrue(permission.has_permission(request, None))
        
        # Admin should have access
        request = MockRequest(self.admin)
        self.assertTrue(permission.has_permission(request, None))
        
        # Regular user should not have access
        request = MockRequest(self.user)
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_garden_member_permission(self):
        """Test IsGardenMember permission"""
        from .permissions import IsGardenMember
        
        permission = IsGardenMember()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Member should have access
        request = MockRequest(self.user)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.garden))
        
        # Admin should have access
        request = MockRequest(self.admin)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.garden))
        
        # Non-member should not have access
        non_member = User.objects.create_user(username='nonmember', password='password123')
        request = MockRequest(non_member)
        self.assertFalse(permission.has_object_permission(request, MockView(), self.private_garden))
    
    def test_is_garden_public_permission(self):
        """Test IsGardenPublic permission"""
        from .permissions import IsGardenPublic
        
        permission = IsGardenPublic()
        
        class MockRequest:
            def __init__(self, method='GET'):
                self.method = method
        
        class MockView:
            pass
        
        # Public garden should be accessible for GET
        request = MockRequest('GET')
        self.assertTrue(permission.has_object_permission(request, MockView(), self.garden))
        
        # Private garden should not be accessible
        request = MockRequest('GET')
        self.assertFalse(permission.has_object_permission(request, MockView(), self.private_garden))
        
        # POST should not be allowed
        request = MockRequest('POST')
        self.assertFalse(permission.has_object_permission(request, MockView(), self.garden))
    
    def test_is_task_assignee_permission(self):
        """Test IsTaskAssignee permission"""
        from .permissions import IsTaskAssignee
        
        permission = IsTaskAssignee()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Assignee should have access
        request = MockRequest(self.user)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.task))
        
        # Admin should have access
        request = MockRequest(self.admin)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.task))
        
        # Non-assignee should not have access
        non_assignee = User.objects.create_user(username='nonassignee', password='password123')
        request = MockRequest(non_assignee)
        self.assertFalse(permission.has_object_permission(request, MockView(), self.task))
    
    def test_can_delete_membership_own(self):
        """Test user can delete own membership"""
        from .permissions import CanDeleteMembership
        
        permission = CanDeleteMembership()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # User should be able to delete own membership
        request = MockRequest(self.user)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.membership))
    
    def test_can_delete_membership_manager(self):
        """Test manager can delete any membership"""
        from .permissions import CanDeleteMembership
        
        permission = CanDeleteMembership()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Create manager
        manager = User.objects.create_user(username='manager', password='password123')
        GardenMembership.objects.create(user=manager, garden=self.garden, role='MANAGER', status='ACCEPTED')
        
        # Manager should be able to delete any membership
        request = MockRequest(manager)
        self.assertTrue(permission.has_object_permission(request, MockView(), self.membership))
    
    def test_can_delete_membership_non_manager(self):
        """Test non-manager cannot delete other memberships"""
        from .permissions import CanDeleteMembership
        
        permission = CanDeleteMembership()
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        class MockView:
            pass
        
        # Create another worker
        worker = User.objects.create_user(username='worker', password='password123')
        worker_membership = GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        # Worker should not be able to delete other memberships
        request = MockRequest(worker)
        self.assertFalse(permission.has_object_permission(request, MockView(), self.membership))
        
        # But should be able to delete own membership
        self.assertTrue(permission.has_object_permission(request, MockView(), worker_membership))



class ExtendedSerializerTests(TestCase):
    """Extended tests for serializer functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        self.garden = Garden.objects.create(
            name="Test Garden",
            description="A test garden",
            location="Test Location",
            is_public=True
        )
        
        self.task_type = CustomTaskType.objects.create(
            garden=self.garden,
            name="Test Task Type"
        )
    
    def test_register_serializer_duplicate_email(self):
        """Test RegisterSerializer email uniqueness validation"""
        from .serializers import RegisterSerializer
        
        serializer = RegisterSerializer(data={
            'username': 'newuser',
            'email': 'test@example.com',  # Duplicate email
            'password': 'password123'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_register_serializer_duplicate_username(self):
        """Test RegisterSerializer username uniqueness validation"""
        from .serializers import RegisterSerializer
        
        serializer = RegisterSerializer(data={
            'username': 'testuser',  # Duplicate username
            'email': 'new@example.com',
            'password': 'password123'
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
    
    def test_task_serializer_custom_type_required(self):
        """Test TaskSerializer custom type validation"""
        from .serializers import TaskSerializer
        
        serializer = TaskSerializer(data={
            'garden': self.garden.id,
            'title': 'Test Task',
            'task_type': 'CUSTOM',
            # Missing custom_type
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('custom_type', serializer.errors)
    
    def test_task_serializer_custom_type_invalid(self):
        """Test TaskSerializer invalid custom type handling"""
        from .serializers import TaskSerializer
        
        serializer = TaskSerializer(data={
            'garden': self.garden.id,
            'title': 'Test Task',
            'task_type': 'HARVEST',
            'custom_type': self.task_type.id  # Should be None for HARVEST
        })
        # Should be valid, but custom_type should be set to None
        if serializer.is_valid():
            data = serializer.validated_data
            self.assertIsNone(data.get('custom_type'))
    
    def test_garden_membership_serializer_missing_garden(self):
        """Test GardenMembershipSerializer garden required validation"""
        from .serializers import GardenMembershipSerializer
        
        serializer = GardenMembershipSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('garden', serializer.errors)



class UtilsTests(TestCase):
    """Tests for utility functions"""
    
    @patch('gardenplanner.apps.garden.utils.requests.get')
    def test_get_location_coordinates_success(self, mock_get):
        """Test successful geocoding"""
        from .utils import get_location_coordinates
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{'lat': 41.0082, 'lon': 28.9784}]
        mock_get.return_value = mock_response
        
        result = get_location_coordinates('Istanbul')
        self.assertEqual(result, (41.0082, 28.9784))
    
    @patch('gardenplanner.apps.garden.utils.requests.get')
    def test_get_location_coordinates_not_found(self, mock_get):
        """Test location not found"""
        from .utils import get_location_coordinates
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = []
        mock_get.return_value = mock_response
        
        result = get_location_coordinates('Atlantis')
        self.assertIsNone(result)
    
    @patch('gardenplanner.apps.garden.utils.requests.get')
    def test_get_location_coordinates_api_error(self, mock_get):
        """Test API error handling"""
        from .utils import get_location_coordinates
        import requests
        
        mock_get.side_effect = requests.RequestException("API Error")
        
        result = get_location_coordinates('Istanbul')
        self.assertIsNone(result)
    
    @patch('gardenplanner.apps.garden.utils.get_location_coordinates')
    @patch('gardenplanner.apps.garden.utils.requests.get')
    def test_get_weather_data_success(self, mock_get, mock_coords):
        """Test successful weather fetch"""
        from .utils import get_weather_data
        
        mock_coords.return_value = (41.0082, 28.9784)
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'main': {'temp': 25}, 'weather': [{'description': 'clear sky'}]}
        mock_get.return_value = mock_response
        
        result = get_weather_data('Istanbul')
        self.assertIn('main', result)
        self.assertIn('weather', result)
    
    @patch('gardenplanner.apps.garden.utils.get_location_coordinates')
    def test_get_weather_data_location_not_found(self, mock_coords):
        """Test location not found"""
        from .utils import get_weather_data
        
        mock_coords.return_value = None
        
        result = get_weather_data('Atlantis')
        self.assertIn('error', result)
        self.assertEqual(result['error'], 'Location not found')
    
    @patch('gardenplanner.apps.garden.utils.get_location_coordinates')
    @patch('gardenplanner.apps.garden.utils.requests.get')
    def test_get_weather_data_api_error(self, mock_get, mock_coords):
        """Test API error handling"""
        from .utils import get_weather_data
        import requests
        
        mock_coords.return_value = (41.0082, 28.9784)
        mock_get.side_effect = requests.RequestException("API Error")
        
        result = get_weather_data('Istanbul')
        self.assertIn('error', result)



class ExtendedModelTests(TestCase):
    """Extended tests for model methods"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='Test Type')
        self.task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            assigned_by=self.user,
            status='PENDING'
        )
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        self.comment = Comment.objects.create(forum_post=self.post, content='Comment', author=self.user)
        self.report = Report.objects.create(
            reporter=self.user,
            content_type=ContentType.objects.get_for_model(ForumPost),
            object_id=self.post.id,
            reason='abuse'
        )
        self.notification = Notification.objects.create(
            recipient=self.user,
            message='Test notification',
            category='FORUM'
        )
    
    def test_profile_str(self):
        """Test Profile.__str__()"""
        self.assertEqual(str(self.user.profile), f"{self.user.username}'s Profile")
    
    def test_garden_image_str(self):
        """Test GardenImage.__str__()"""
        from .models import GardenImage
        
        image = GardenImage.objects.create(
            garden=self.garden,
            data=b'fake_image_data',
            mime_type='image/jpeg',
            is_cover=True
        )
        self.assertIn('GardenImage', str(image))
        self.assertIn('[cover]', str(image))
    
    def test_custom_task_type_str(self):
        """Test CustomTaskType.__str__()"""
        self.assertEqual(str(self.task_type), f"{self.task_type.name} ({self.garden.name})")
    
    def test_task_str(self):
        """Test Task.__str__()"""
        self.assertEqual(str(self.task), 'Test Task')
    
    def test_forum_post_str(self):
        """Test ForumPost.__str__()"""
        self.assertIn('Test Post', str(self.post))
        self.assertIn(self.user.username, str(self.post))
    
    def test_comment_str(self):
        """Test Comment.__str__()"""
        self.assertIn('Comment', str(self.comment))
        self.assertIn(self.user.username, str(self.comment))
    
    def test_forum_post_image_str(self):
        """Test ForumPostImage.__str__()"""
        from .models import ForumPostImage
        
        image = ForumPostImage.objects.create(
            post=self.post,
            data=b'fake_image_data',
            mime_type='image/jpeg'
        )
        self.assertIn('ForumPostImage', str(image))
    
    def test_comment_image_str(self):
        """Test CommentImage.__str__()"""
        from .models import CommentImage
        
        image = CommentImage.objects.create(
            comment=self.comment,
            data=b'fake_image_data',
            mime_type='image/jpeg'
        )
        self.assertIn('CommentImage', str(image))
    
    def test_report_str(self):
        """Test Report.__str__()"""
        self.assertIn('Report', str(self.report))
        self.assertIn(self.user.username, str(self.report))
    
    def test_notification_str(self):
        """Test Notification.__str__()"""
        self.assertIn('Notification', str(self.notification))
        self.assertIn(self.user.username, str(self.notification))
    
    def test_garden_image_save_cover_image(self):
        """Test GardenImage.save cover image uniqueness logic"""
        from .models import GardenImage
        
        # Create first cover image
        image1 = GardenImage.objects.create(
            garden=self.garden,
            data=b'fake_image_data',
            mime_type='image/jpeg',
            is_cover=True
        )
        
        # Create second cover image
        image2 = GardenImage.objects.create(
            garden=self.garden,
            data=b'fake_image_data2',
            mime_type='image/jpeg',
            is_cover=True
        )
        
        # First image should no longer be cover
        image1.refresh_from_db()
        self.assertFalse(image1.is_cover)
        # Second image should be cover
        self.assertTrue(image2.is_cover)
    
    def test_profile_update_signal(self):
        """Test profile update signal handler"""
        # Profile should be created automatically
        self.assertTrue(hasattr(self.user, 'profile'))
        
        # Update user should trigger profile save
        self.user.username = 'updateduser'
        self.user.save()
        
        # Profile should still exist
        self.assertTrue(hasattr(self.user, 'profile'))



class ExtendedForumPostTests(APITestCase):
    """Extended tests for forum post edge cases"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user_token = Token.objects.create(user=self.user)
        self.user2_token = Token.objects.create(user=self.user2)
        
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        self.post2 = ForumPost.objects.create(title='Test Post 2', content='Content 2', author=self.user2)
    
    def test_forum_post_list_filters_blocked_users(self):
        """Test forum post list filters blocked users"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:forum-list-create')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not see posts from blocked user
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Post')
    
    def test_forum_post_list_following_filter(self):
        """Test forum post list with following filter"""
        self.user.profile.following.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:forum-list-create') + '?following=true'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see posts from followed users
        self.assertEqual(len(response.data), 2) # Including own post
    
    def test_forum_post_retrieve_blocked(self):
        """Test retrieving a post when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:forum-detail', args=[self.post2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_forum_post_update_not_author(self):
        """Test updating a post when not the author"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:forum-detail', args=[self.post.id])
        data = {'title': 'Updated Title'}
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_forum_post_delete_not_author(self):
        """Test deleting a post when not the author"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:forum-detail', args=[self.post.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_forum_post_include_comments(self):
        """Test forum post with include_comments parameter"""
        Comment.objects.create(forum_post=self.post, content='Comment 1', author=self.user)
        Comment.objects.create(forum_post=self.post, content='Comment 2', author=self.user)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:forum-detail', args=[self.post.id]) + '?include_comments=true'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('comments', response.data)
        self.assertEqual(len(response.data['comments']), 2)


class ExtendedCommentTests(APITestCase):
    """Extended tests for comment edge cases"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user_token = Token.objects.create(user=self.user)
        self.user2_token = Token.objects.create(user=self.user2)
        
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user2)
        self.comment = Comment.objects.create(forum_post=self.post, content='Comment', author=self.user)
    
    def test_comment_list_filters_blocked_users(self):
        """Test comment list filters blocked users"""
        self.user2.profile.blocked_users.add(self.user.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:comment-list-create') + f'?forum_post={self.post.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not see comments from blocked user
        self.assertEqual(len(response.data), 0)
    
    def test_comment_create_blocked_author(self):
        """Test creating a comment when post author has blocked you"""
        self.user2.profile.blocked_users.add(self.user.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:comment-list-create')
        data = {'forum_post': self.post.id, 'content': 'New Comment'}
        
        with self.assertRaises(PermissionError):
            self.client.post(url, data, format='json')
    
    def test_comment_retrieve_blocked(self):
        """Test retrieving a comment when blocked"""
        self.user2.profile.blocked_users.add(self.user.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:comment-detail', args=[self.comment.id])
        
        with self.assertRaises(PermissionError):
            self.client.get(url)
    
    def test_comment_update_not_author(self):
        """Test updating a comment when not the author"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:comment-detail', args=[self.comment.id])
        data = {'forum_post': self.post.id, 'content': 'Updated Comment'}
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_comment_delete_not_author(self):
        """Test deleting a comment when not the author"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        url = reverse('garden:comment-detail', args=[self.comment.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)



class AdminTests(TestCase):
    """Tests for admin actions"""
    
    def setUp(self):
        from django.contrib.admin.sites import AdminSite
        from .admin import ReportAdmin
        
        self.site = AdminSite()
        self.admin = ReportAdmin(Report, self.site)
        
        # Add message_user method to admin for testing
        def mock_message_user(request, message):
            self.last_message = message
        self.admin.message_user = mock_message_user
        
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        self.comment = Comment.objects.create(forum_post=self.post, content='Comment', author=self.user)
        
        self.report = Report.objects.create(
            reporter=self.user,
            content_type=ContentType.objects.get_for_model(ForumPost),
            object_id=self.post.id,
            reason='abuse'
        )
    
    def test_report_admin_object_link(self):
        """Test ReportAdmin.object_link method"""
        # Test with valid object
        link = self.admin.object_link(self.report)
        self.assertIsNotNone(link)
        
        # Test with invalid object_id
        self.report.object_id = 99999
        link = self.admin.object_link(self.report)
        self.assertIsNotNone(link)
    
    def test_report_admin_mark_as_valid(self):
        """Test mark_as_valid admin action"""
        queryset = Report.objects.filter(id=self.report.id)
        
        class MockRequest:
            pass
        
        request = MockRequest()
        self.admin.mark_as_valid(request, queryset)
        
        self.report.refresh_from_db()
        self.assertTrue(self.report.reviewed)
        self.assertTrue(self.report.is_valid)
        self.post.refresh_from_db()
        self.assertTrue(self.post.is_deleted)
    
    def test_report_admin_mark_as_invalid(self):
        """Test mark_as_invalid admin action"""
        queryset = Report.objects.filter(id=self.report.id)
        
        class MockRequest:
            pass
        
        request = MockRequest()
        self.admin.mark_as_invalid(request, queryset)
        
        self.report.refresh_from_db()
        self.assertTrue(self.report.reviewed)
        self.assertFalse(self.report.is_valid)
        self.post.refresh_from_db()
        self.assertFalse(self.post.is_deleted)
    
    def test_report_admin_soft_delete_content(self):
        """Test soft_delete_reported_content admin action"""
        queryset = Report.objects.filter(id=self.report.id)
        
        class MockRequest:
            pass
        
        request = MockRequest()
        self.admin.soft_delete_reported_content(request, queryset)
        
        self.post.refresh_from_db()
        self.assertTrue(self.post.is_deleted)



class SignalTests(TestCase):
    """Tests for signal handlers"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        GardenMembership.objects.create(user=self.user2, garden=self.garden, role='WORKER', status='ACCEPTED')
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='Test Type')
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
    
    def test_task_update_notification_signal(self):
        """Test notification on task creation"""
        task = Task.objects.create(
            garden=self.garden,
            title='New Task',
            assigned_by=self.user,
            assigned_to=self.user2,
            status='PENDING'
        )
        
        # Check notification was created
        notifications = Notification.objects.filter(recipient=self.user2, category='TASK')
        self.assertEqual(notifications.count(), 1)
        self.assertIn('New Task', notifications.first().message)
    
    def test_task_update_notification_signal_no_assignee(self):
        """Test no notification when task has no assignee"""
        task = Task.objects.create(
            garden=self.garden,
            title='Unassigned Task',
            assigned_by=self.user,
            assigned_to=None,
            status='PENDING'
        )
        
        # Should not create notification
        notifications = Notification.objects.filter(category='TASK')
        self.assertEqual(notifications.count(), 0)
    
    def test_task_update_notification_signal_notifications_disabled(self):
        """Test no notification when user has notifications disabled"""
        self.user2.profile.receives_notifications = False
        self.user2.profile.save()
        
        task = Task.objects.create(
            garden=self.garden,
            title='Task',
            assigned_by=self.user,
            assigned_to=self.user2,
            status='PENDING'
        )
        
        # Should not create notification
        notifications = Notification.objects.filter(recipient=self.user2)
        self.assertEqual(notifications.count(), 0)
    
    def test_new_follower_notification_signal(self):
        """Test notification on follow"""
        self.user.profile.following.add(self.user2.profile)
        
        # Check notification was created
        notifications = Notification.objects.filter(recipient=self.user2, category='SOCIAL')
        self.assertEqual(notifications.count(), 1)
        self.assertIn('testuser', notifications.first().message)
    
    def test_new_follower_notification_signal_notifications_disabled(self):
        """Test no notification when user has notifications disabled"""
        self.user2.profile.receives_notifications = False
        self.user2.profile.save()
        
        self.user.profile.following.add(self.user2.profile)
        
        # Should not create notification
        notifications = Notification.objects.filter(recipient=self.user2)
        self.assertEqual(notifications.count(), 0)
    
    def test_new_comment_notification_signal(self):
        """Test notification on comment"""
        comment = Comment.objects.create(
            forum_post=self.post,
            content='New Comment',
            author=self.user2
        )
        
        # Check notification was created
        notifications = Notification.objects.filter(recipient=self.user, category='FORUM')
        self.assertEqual(notifications.count(), 1)
        self.assertIn('testuser2', notifications.first().message)
    
    def test_new_comment_notification_signal_own_post(self):
        """Test no notification when commenting on own post"""
        comment = Comment.objects.create(
            forum_post=self.post,
            content='Own Comment',
            author=self.user
        )
        
        # Should not create notification
        notifications = Notification.objects.filter(recipient=self.user)
        self.assertEqual(notifications.count(), 0)
    
    def test_new_comment_notification_signal_notifications_disabled(self):
        """Test no notification when user has notifications disabled"""
        self.user.profile.receives_notifications = False
        self.user.profile.save()
        
        comment = Comment.objects.create(
            forum_post=self.post,
            content='Comment',
            author=self.user2
        )
        
        # Should not create notification
        notifications = Notification.objects.filter(recipient=self.user)
        self.assertEqual(notifications.count(), 0)

    def test_garden_membership_flow(self):

        # 1. Setup: Make self.user a MANAGER of the garden so they can receive requests
        # (self.user2 is already a WORKER in setUp, so we use self.user as manager)
        GardenMembership.objects.create(
            user=self.user, 
            garden=self.garden, 
            role='MANAGER', 
            status='ACCEPTED'
        )

        applicant = User.objects.create_user(username='applicant', password='password123')
        membership = GardenMembership.objects.create(
            user=applicant,
            garden=self.garden,
            role='WORKER',
            status='PENDING'
        )

        manager_notifications = Notification.objects.filter(recipient=self.user, category='SOCIAL')
        self.assertEqual(manager_notifications.count(), 1)
        self.assertIn(f"{applicant.username} has requested to join", manager_notifications.first().message)

        membership.status = 'ACCEPTED'
        membership.save()

        applicant_notifications = Notification.objects.filter(recipient=applicant, category='SOCIAL')
        self.assertEqual(applicant_notifications.count(), 1)
        self.assertIn("has been accepted", applicant_notifications.first().message)

    def test_garden_membership_rejection(self):
        """Test that a user is notified when their request is rejected"""
        
        applicant = User.objects.create_user(username='rejectee', password='password123')
        membership = GardenMembership.objects.create(
            user=applicant,
            garden=self.garden,
            role='WORKER',
            status='PENDING'
        )

        membership.status = 'REJECTED'
        membership.save()

        # Assertion: Check if Applicant received the 'Rejected' notification
        notifications = Notification.objects.filter(recipient=applicant, category='SOCIAL')
        self.assertEqual(notifications.count(), 1)
        self.assertIn("has been rejected", notifications.first().message)



class EdgeCaseTests(APITestCase):
    """Tests for edge cases and error paths"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user_token = Token.objects.create(user=self.user)
        
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        GardenMembership.objects.create(user=self.user, garden=self.garden, role='MANAGER', status='ACCEPTED')
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='Test Type')
    
    def test_task_list_no_garden_param(self):
        """Test task list without garden parameter"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_task_list_admin_access(self):
        """Test task list with admin access"""
        self.user.profile.role = 'ADMIN'
        self.user.profile.save()
        
        Task.objects.create(
            garden=self.garden,
            title='Admin Task',
            assigned_by=self.user,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_task_list_manager_access(self):
        """Test task list with manager access"""
        Task.objects.create(
            garden=self.garden,
            title='Manager Task',
            assigned_by=self.user,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_task_list_worker_access(self):
        """Test task list with worker access"""
        worker = User.objects.create_user(username='worker', password='password123')
        worker_token = Token.objects.create(user=worker)
        GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        Task.objects.create(
            garden=self.garden,
            title='Unassigned Task',
            assigned_by=self.user,
            assigned_to=None,
            status='PENDING'
        )
        
        Task.objects.create(
            garden=self.garden,
            title='Assigned Task',
            assigned_by=self.user,
            assigned_to=worker,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {worker_token.key}')
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see unassigned and assigned tasks
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_garden_queryset_filtering_unauthenticated(self):
        """Test garden queryset filtering for unauthenticated users"""
        private_garden = Garden.objects.create(name='Private Garden', is_public=False)
        
        url = reverse('garden:garden-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see public gardens
        garden_names = [g['name'] for g in response.data]
        self.assertIn('Test Garden', garden_names)
        self.assertNotIn('Private Garden', garden_names)
    
    def test_garden_queryset_filtering_authenticated(self):
        """Test garden queryset filtering for authenticated users"""
        private_garden = Garden.objects.create(name='Private Garden', is_public=False)
        GardenMembership.objects.create(user=self.user, garden=private_garden, role='WORKER', status='ACCEPTED')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:garden-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see public gardens and gardens user is member of
        garden_names = [g['name'] for g in response.data]
        self.assertIn('Test Garden', garden_names)
        self.assertIn('Private Garden', garden_names)
    
    def test_assign_task_missing_user_id(self):
        """Test assigning task without user_id"""
        task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            assigned_by=self.user,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-assign-task', args=[task.id])
        data = {}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_user_profile_view_blocked(self):
        """Test user profile view when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:user-profile', args=[self.user2.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_follow_user_blocked(self):
        """Test following a user when blocked"""
        self.user.profile.blocked_users.add(self.user2.profile)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:follow')
        data = {'user_id': self.user2.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_task_update_status_transition(self):
        """Test task status transition"""
        task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            assigned_by=self.user,
            assigned_to=self.user2,
            status='PENDING'
        )
        
        # Update task status
        task.status = 'IN_PROGRESS'
        task.save()
        
        self.assertEqual(task.status, 'IN_PROGRESS')
    
    def test_accept_task_from_declined_status(self):
        """Test accepting a task from DECLINED status"""
        worker = User.objects.create_user(username='worker', password='password123')
        worker_token = Token.objects.create(user=worker)
        GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        task = Task.objects.create(
            garden=self.garden,
            title='Declined Task',
            assigned_by=self.user,
            assigned_to=worker,
            status='DECLINED'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {worker_token.key}')
        url = reverse('garden:task-accept-task', args=[task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        task.refresh_from_db()
        self.assertEqual(task.status, 'IN_PROGRESS')
    
    def test_decline_task_from_accepted_status(self):
        """Test declining a task from ACCEPTED status"""
        worker = User.objects.create_user(username='worker', password='password123')
        worker_token = Token.objects.create(user=worker)
        GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        task = Task.objects.create(
            garden=self.garden,
            title='Accepted Task',
            assigned_by=self.user,
            assigned_to=worker,
            status='ACCEPTED'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {worker_token.key}')
        url = reverse('garden:task-decline-task', args=[task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        task.refresh_from_db()
        self.assertEqual(task.status, 'DECLINED')
    
    def test_self_assign_declined_task(self):
        """Test self-assigning a declined task"""
        worker = User.objects.create_user(username='worker', password='password123')
        worker_token = Token.objects.create(user=worker)
        GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        task = Task.objects.create(
            garden=self.garden,
            title='Declined Task',
            assigned_by=self.user,
            assigned_to=None,
            status='DECLINED'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {worker_token.key}')
        url = reverse('garden:task-self-assign-task', args=[task.id])
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        task.refresh_from_db()
        self.assertEqual(task.assigned_to, worker)
        self.assertEqual(task.status, 'IN_PROGRESS')


# Additional Serializer Image Handling Tests

class SerializerImageTests(TestCase):
    """Tests for serializer image handling"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        self.post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        self.comment = Comment.objects.create(forum_post=self.post, content='Comment', author=self.user)
    
    def test_garden_serializer_with_images(self):
        """Test GardenSerializer with cover and gallery images"""
        from .serializers import GardenSerializer
        import base64
        
        # Create base64 image data
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        serializer = GardenSerializer(data={
            'name': 'Garden with Images',
            'description': 'Test',
            'location': 'Test Location',
            'is_public': True,
            'cover_image_base64': data_url,
            'gallery_base64': [data_url, data_url]
        })
        
        self.assertTrue(serializer.is_valid())
        garden = serializer.save()
        
        # Check images were created
        from .models import GardenImage
        images = GardenImage.objects.filter(garden=garden)
        self.assertEqual(images.count(), 3)  # 1 cover + 2 gallery
        self.assertEqual(images.filter(is_cover=True).count(), 1)
    
    def test_forum_post_serializer_with_images(self):
        """Test ForumPostSerializer with images"""
        from .serializers import ForumPostSerializer
        import base64
        
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        serializer = ForumPostSerializer(data={
            'title': 'Post with Images',
            'content': 'Content',
            'images_base64': [data_url, data_url]
        }, context={'request': type('MockRequest', (), {'user': self.user})()})
        
        self.assertTrue(serializer.is_valid())
        post = serializer.save(author=self.user)
        
        # Check images were created
        from .models import ForumPostImage
        images = ForumPostImage.objects.filter(post=post)
        self.assertEqual(images.count(), 2)
    
    def test_comment_serializer_with_images(self):
        """Test CommentSerializer with images"""
        from .serializers import CommentSerializer
        import base64
        
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        serializer = CommentSerializer(data={
            'forum_post': self.post.id,
            'content': 'Comment with Images',
            'images_base64': [data_url]
        }, context={'request': type('MockRequest', (), {'user': self.user})()})
        
        self.assertTrue(serializer.is_valid())
        comment = serializer.save(author=self.user)
        
        # Check images were created
        from .models import CommentImage
        images = CommentImage.objects.filter(comment=comment)
        self.assertEqual(images.count(), 1)


# Additional Edge Case Tests

class AdditionalEdgeCaseTests(APITestCase):
    """Additional edge case tests"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')
        self.user_token = Token.objects.create(user=self.user)
        
        self.garden = Garden.objects.create(name='Test Garden', is_public=True)
        GardenMembership.objects.create(user=self.user, garden=self.garden, role='MANAGER', status='ACCEPTED')
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='Test Type')
    
    def test_create_task_not_member(self):
        """Test creating a task when not a member"""
        non_member = User.objects.create_user(username='nonmember', password='password123')
        non_member_token = Token.objects.create(user=non_member)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {non_member_token.key}')
        url = reverse('garden:task-list')
        data = {
            'garden': self.garden.id,
            'title': 'New Task',
            'custom_type': self.task_type.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_task_assign_to_non_member(self):
        """Test creating a task assigned to a non-member"""
        non_member = User.objects.create_user(username='nonmember', password='password123')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-list')
        data = {
            'garden': self.garden.id,
            'title': 'New Task',
            'custom_type': self.task_type.id,
            'assigned_to': non_member.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_task_queryset_retrieve_update(self):
        """Test task queryset for retrieve/update actions"""
        task = Task.objects.create(
            garden=self.garden,
            title='Test Task',
            assigned_by=self.user,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        url = reverse('garden:task-detail', args=[task.id])
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_task_queryset_worker_sees_assigned_and_unassigned(self):
        """Test worker sees assigned and unassigned tasks"""
        worker = User.objects.create_user(username='worker', password='password123')
        worker_token = Token.objects.create(user=worker)
        GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        # Create unassigned task
        Task.objects.create(
            garden=self.garden,
            title='Unassigned Task',
            assigned_by=self.user,
            assigned_to=None,
            status='PENDING'
        )
        
        # Create declined task
        Task.objects.create(
            garden=self.garden,
            title='Declined Task',
            assigned_by=self.user,
            assigned_to=None,
            status='DECLINED'
        )
        
        # Create assigned task
        Task.objects.create(
            garden=self.garden,
            title='Assigned Task',
            assigned_by=self.user,
            assigned_to=worker,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {worker_token.key}')
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see unassigned, declined, and assigned tasks
        self.assertGreaterEqual(len(response.data), 2)
    
    def test_task_queryset_worker_sees_other_assigned(self):
        """Test worker sees tasks assigned to others"""
        worker = User.objects.create_user(username='worker', password='password123')
        worker_token = Token.objects.create(user=worker)
        other_worker = User.objects.create_user(username='otherworker', password='password123')
        GardenMembership.objects.create(user=worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        GardenMembership.objects.create(user=other_worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        
        # Create task assigned to other worker
        Task.objects.create(
            garden=self.garden,
            title='Other Worker Task',
            assigned_by=self.user,
            assigned_to=other_worker,
            status='PENDING'
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {worker_token.key}')
        url = reverse('garden:task-list') + f'?garden={self.garden.id}'
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not see tasks assigned to others
        task_titles = [t['title'] for t in response.data]
        self.assertIn('Other Worker Task', task_titles)
    
    def test_weather_api_error_handling(self):
        """Test weather API error handling"""
        from .views.weatherdata import WeatherDataView
        from unittest.mock import patch
        
        with patch('gardenplanner.apps.garden.views.weatherdata.get_weather_data') as mock_get_weather:
            mock_get_weather.return_value = {'error': 'Weather service unavailable'}
            
            view = WeatherDataView()
            request = type('MockRequest', (), {'query_params': {'location': 'Istanbul'}, 'method': 'GET', 'build_absolute_uri': lambda *args: 'http://test.com/'})()
            response = view.get(request)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_weather_api_404_error(self):
        """Test weather API 404 error handling"""
        from .views.weatherdata import WeatherDataView
        from unittest.mock import patch
        
        with patch('gardenplanner.apps.garden.views.weatherdata.get_weather_data') as mock_get_weather:
            mock_get_weather.return_value = {'error': 'Weather data not found'}
            
            view = WeatherDataView()
            request = type('MockRequest', (), {'query_params': {'location': 'Istanbul'}, 'method': 'GET', 'build_absolute_uri': lambda *args: 'http://test.com/'})()
            response = view.get(request)
            
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def test_garden_serializer_update_with_images(self):
        """Test GardenSerializer update with images"""
        from .serializers import GardenSerializer
        from .models import GardenImage
        import base64
        
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        serializer = GardenSerializer(self.garden, data={
            'name': 'Updated Garden',
            'cover_image_base64': data_url,
            'gallery_base64': [data_url]
        }, partial=True)
        
        self.assertTrue(serializer.is_valid())
        garden = serializer.save()
        
        # Check images were created
        images = GardenImage.objects.filter(garden=garden)
        self.assertGreaterEqual(images.count(), 1)
    
    def test_forum_post_serializer_update_with_images(self):
        """Test ForumPostSerializer update with images"""
        from .serializers import ForumPostSerializer
        from .models import ForumPostImage
        import base64
        
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        
        serializer = ForumPostSerializer(post, data={
            'title': 'Updated Post',
            'images_base64': [data_url]
        }, partial=True, context={'request': type('MockRequest', (), {'user': self.user})()})
        
        self.assertTrue(serializer.is_valid())
        updated_post = serializer.save()
        
        # Check images were created
        images = ForumPostImage.objects.filter(post=updated_post)
        self.assertEqual(images.count(), 1)
    
    def test_comment_serializer_update_with_images(self):
        """Test CommentSerializer update with images"""
        from .serializers import CommentSerializer
        from .models import CommentImage
        import base64
        
        post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        comment = Comment.objects.create(forum_post=post, content='Comment', author=self.user)
        
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        serializer = CommentSerializer(comment, data={
            'content': 'Updated Comment',
            'images_base64': [data_url]
        }, partial=True, context={'request': type('MockRequest', (), {'user': self.user})()})
        
        self.assertTrue(serializer.is_valid())
        updated_comment = serializer.save()
        
        # Check images were created
        images = CommentImage.objects.filter(comment=updated_comment)
        self.assertEqual(images.count(), 1)
    
    def test_forum_post_serializer_delete_images(self):
        """Test ForumPostSerializer delete images on update"""
        from .serializers import ForumPostSerializer
        from .models import ForumPostImage
        import base64
        
        post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        
        # Create images
        fake_image_data = b'fake_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        image1 = ForumPostImage.objects.create(post=post, data=b'data1', mime_type='image/jpeg')
        image2 = ForumPostImage.objects.create(post=post, data=b'data2', mime_type='image/jpeg')
        
        serializer = ForumPostSerializer(post, data={
            'title': 'Updated Post',
            'delete_image_ids': [image1.id]
        }, partial=True, context={'request': type('MockRequest', (), {'user': self.user})()})
        
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        # Check image1 was deleted
        self.assertFalse(ForumPostImage.objects.filter(id=image1.id).exists())
        # Check image2 still exists
        self.assertTrue(ForumPostImage.objects.filter(id=image2.id).exists())
    
    def test_comment_serializer_delete_images(self):
        """Test CommentSerializer delete images on update"""
        from .serializers import CommentSerializer
        from .models import CommentImage
        
        post = ForumPost.objects.create(title='Test Post', content='Content', author=self.user)
        comment = Comment.objects.create(forum_post=post, content='Comment', author=self.user)
        
        # Create images
        image1 = CommentImage.objects.create(comment=comment, data=b'data1', mime_type='image/jpeg')
        image2 = CommentImage.objects.create(comment=comment, data=b'data2', mime_type='image/jpeg')
        
        serializer = CommentSerializer(comment, data={
            'content': 'Updated Comment',
            'delete_image_ids': [image1.id]
        }, partial=True, context={'request': type('MockRequest', (), {'user': self.user})()})
        
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        # Check image1 was deleted
        self.assertFalse(CommentImage.objects.filter(id=image1.id).exists())
        # Check image2 still exists
        self.assertTrue(CommentImage.objects.filter(id=image2.id).exists())
    
    def test_garden_serializer_update_remove_cover_image(self):
        """Test GardenSerializer update removing cover image"""
        from .serializers import GardenSerializer
        from .models import GardenImage
        
        # Create cover image
        GardenImage.objects.create(
            garden=self.garden,
            data=b'fake_data',
            mime_type='image/jpeg',
            is_cover=True
        )
        
        serializer = GardenSerializer(self.garden, data={
            'name': 'Updated Garden',
            'cover_image_base64': ''  # Empty string removes cover
        }, partial=True)
        
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        # Check cover image was removed
        cover_images = GardenImage.objects.filter(garden=self.garden, is_cover=True)
        self.assertEqual(cover_images.count(), 0)
    
    def test_garden_serializer_update_replace_gallery(self):
        """Test GardenSerializer update replacing gallery"""
        from .serializers import GardenSerializer
        from .models import GardenImage
        import base64
        
        # Create existing gallery images
        GardenImage.objects.create(garden=self.garden, data=b'old1', mime_type='image/jpeg', is_cover=False)
        GardenImage.objects.create(garden=self.garden, data=b'old2', mime_type='image/jpeg', is_cover=False)
        
        fake_image_data = b'new_image_data'
        base64_image = base64.b64encode(fake_image_data).decode('ascii')
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        serializer = GardenSerializer(self.garden, data={
            'gallery_base64': [data_url]
        }, partial=True)
        
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        # Check old gallery images were deleted and new one was created
        gallery_images = GardenImage.objects.filter(garden=self.garden, is_cover=False)
        self.assertEqual(gallery_images.count(), 1)



class DecodeBase64ImageTests(TestCase):
    """Tests for _decode_base64_image helper covering error paths"""
    def test_decode_empty_string(self):
        from .serializers import _decode_base64_image
        from rest_framework import serializers as drf_serializers
        with self.assertRaises(drf_serializers.ValidationError):
            _decode_base64_image('')

    def test_decode_invalid_base64(self):
        from .serializers import _decode_base64_image
        from rest_framework import serializers as drf_serializers
        with self.assertRaises(drf_serializers.ValidationError):
            _decode_base64_image('!!!notbase64!!!')

    def test_decode_invalid_data_url(self):
        from .serializers import _decode_base64_image
        from rest_framework import serializers as drf_serializers
        # Missing comma separator after header
        with self.assertRaises(drf_serializers.ValidationError):
            _decode_base64_image('data:image/jpeg;base64INVALID')


class ProfileUpdateImageTests(TestCase):
    """Tests for ProfileUpdateSerializer image handling logic"""
    def setUp(self):
        self.user = User.objects.create_user(username='imguser', password='pw')

    def test_profile_update_with_uploaded_image(self):
        from .serializers import ProfileUpdateSerializer
        from django.core.files.uploadedfile import SimpleUploadedFile
        # Create a fake image file
        image_content = b'\x89PNG\r\n--fake--'
        uploaded = SimpleUploadedFile('avatar.png', image_content, content_type='image/png')

        class MockRequest:
            FILES = {'profile_picture': uploaded}
            user = self.user

        serializer = ProfileUpdateSerializer(self.user.profile, data={'location': 'New Place'}, context={'request': MockRequest()}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.location, 'New Place')
        self.assertIsNotNone(self.user.profile.profile_picture_data)
        self.assertEqual(self.user.profile.profile_picture_mime_type, 'image/png')


class GardenMembershipEdgeCaseTests(APITestCase):
    """Extra tests for GardenMembershipViewSet edge cases"""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='memberuser', password='pw')
        self.client.force_authenticate(user=self.user)
        self.garden = Garden.objects.create(name='Edge Garden', is_public=True)
        # Use MANAGER role so deletion of other users' memberships is permitted by CanDeleteMembership
        GardenMembership.objects.create(user=self.user, garden=self.garden, role='MANAGER', status='ACCEPTED')

    def test_duplicate_membership_creation_fails(self):
        url = reverse('garden:membership-list')
        response = self.client.post(url, {'garden': self.garden.id}, format='json')
        # First attempt should fail because membership already exists
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_pending_membership_skips_promotion(self):
        # Create a pending membership for another user then delete it
        other = User.objects.create_user(username='pendinguser', password='pw')
        pending = GardenMembership.objects.create(user=other, garden=self.garden, role='WORKER', status='PENDING')
        url = reverse('garden:membership-detail', args=[pending.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Garden still exists and original user remains manager (no promotion logic triggered because deleted membership wasn't ACCEPTED)
        self.assertTrue(Garden.objects.filter(id=self.garden.id).exists())
        orig_membership = GardenMembership.objects.get(user=self.user, garden=self.garden)
        self.assertEqual(orig_membership.role, 'MANAGER')


class TaskCreationAssignmentTests(APITestCase):
    """Tests for TaskViewSet perform_create assignment behaviors"""
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(username='manager', password='pw')
        self.worker = User.objects.create_user(username='worker', password='pw')
        self.client.force_authenticate(user=self.manager)
        self.garden = Garden.objects.create(name='Task Garden', is_public=True)
        GardenMembership.objects.create(user=self.manager, garden=self.garden, role='MANAGER', status='ACCEPTED')
        GardenMembership.objects.create(user=self.worker, garden=self.garden, role='WORKER', status='ACCEPTED')
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='CustomType')

    def test_create_task_assigned_to_member_success(self):
        url = reverse('garden:task-list')
        payload = {
            'garden': self.garden.id,
            'title': 'Assigned Task',
            'task_type': 'CUSTOM',
            'custom_type': self.task_type.id,
            'assigned_to': self.worker.id,
            'status': 'PENDING'
        }
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(title='Assigned Task')
        self.assertEqual(task.assigned_to, self.worker)
        self.assertEqual(task.assigned_by, self.manager)  # auto set

    def test_create_task_attempt_override_assigned_by(self):
        # User tries to spoof assigned_by to worker; should still be manager
        url = reverse('garden:task-list')
        payload = {
            'garden': self.garden.id,
            'title': 'Spoof Task',
            'task_type': 'CUSTOM',
            'custom_type': self.task_type.id,
            'assigned_to': self.worker.id,
            'assigned_by': self.worker.id
        }
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(title='Spoof Task')
        self.assertEqual(task.assigned_by, self.manager)


class AdditionalTaskSerializerTests(TestCase):
    """Extra TaskSerializer validation cases"""
    def setUp(self):
        self.user = User.objects.create_user(username='userx', password='pw')
        self.garden = Garden.objects.create(name='Serializer Garden', is_public=True)
        self.task_type = CustomTaskType.objects.create(garden=self.garden, name='CT')

    def test_task_serializer_maintenance_clears_custom_type(self):
        from .serializers import TaskSerializer
        serializer = TaskSerializer(data={
            'garden': self.garden.id,
            'title': 'Maintenance Task',
            'task_type': 'MAINTENANCE',
            'custom_type': self.task_type.id
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data.get('custom_type'))


class ForumPostSerializerCommentsTests(TestCase):
    """Tests that comments are omitted unless include_comments=true"""
    def setUp(self):
        self.user = User.objects.create_user(username='poster', password='pw')
        self.post = ForumPost.objects.create(title='P', content='C', author=self.user)
        Comment.objects.create(forum_post=self.post, content='Hidden', author=self.user)

    def test_forum_post_serializer_comments_default_empty(self):
        from .serializers import ForumPostSerializer
        serializer = ForumPostSerializer(self.post, context={'request': type('R', (), {'query_params': {}})()})
        data = serializer.data
        self.assertIn('comments', data)
        self.assertEqual(len(data['comments']), 0)


class AdditionalPermissionTests(TestCase):
    """Coverage for IsSystemAdministrator and IsGardenManager/IsMember nuances"""
    def setUp(self):
        self.admin = User.objects.create_user(username='adminx', password='pw')
        self.admin.profile.role = 'ADMIN'
        self.admin.profile.save()
        self.manager = User.objects.create_user(username='managerx', password='pw')
        self.worker = User.objects.create_user(username='workerx', password='pw')
        self.garden = Garden.objects.create(name='Perm Garden', is_public=True)
        GardenMembership.objects.create(user=self.manager, garden=self.garden, role='MANAGER', status='ACCEPTED')
        GardenMembership.objects.create(user=self.worker, garden=self.garden, role='WORKER', status='ACCEPTED')

    def test_is_system_administrator_permission(self):
        from .permissions import IsSystemAdministrator
        perm = IsSystemAdministrator()
        class R: pass
        r = R(); r.user = self.admin
        self.assertTrue(perm.has_permission(r, None))
        r.user = self.worker
        self.assertFalse(perm.has_permission(r, None))

    def test_is_garden_manager_permission(self):
        from .permissions import IsGardenManager
        perm = IsGardenManager()
        class R: pass
        class V: pass
        r = R(); r.user = self.manager
        # Object is the garden itself
        self.assertTrue(perm.has_object_permission(r, V(), self.garden))
        r.user = self.worker
        self.assertFalse(perm.has_object_permission(r, V(), self.garden))
        r.user = self.admin
        self.assertTrue(perm.has_object_permission(r, V(), self.garden))

    def test_is_member_permission(self):
        from .permissions import IsMember
        perm = IsMember()
        class R: pass
        r = R(); r.user = self.worker
        self.assertTrue(perm.has_permission(r, None))
        guest = User.objects.create_user(username='guestx', password='pw')
        guest.profile.role = 'GUEST'
        guest.profile.save()
        r.user = guest
        self.assertFalse(perm.has_permission(r, None))

