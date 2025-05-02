from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from garden.models import Profile, Garden, GardenMembership, CustomTaskType, Task


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
        self.assertFalse(self.user.profile.is_following(self.user2.profile))
    
    def test_get_followers(self):
        """Test getting list of followers"""
        # User2 follows User1
        self.user2.profile.follow(self.user.profile)
        
        url = reverse('garden:followers')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'testuser2')
    
    def test_get_following(self):
        """Test getting list of users being followed"""
        # User1 follows User2
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
        self.assertEqual(response.data[0]['name'], 'Test Garden')
    
    def test_garden_detail(self):
        """Test retrieving garden details"""
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
        
        # Check garden was created
        self.assertTrue(Garden.objects.filter(name='New Garden').exists())
        
        # Check membership was created for the user as manager
        garden = Garden.objects.get(name='New Garden')
        self.assertTrue(GardenMembership.objects.filter(
            user=self.user,
            garden=garden,
            role='MANAGER',
            status='ACCEPTED'
        ).exists())
    
    def test_update_garden(self):
        """Test updating a garden"""
        url = reverse('garden:garden-detail', args=[self.garden.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        data = {
            'name': 'Updated Garden',
            'description': 'Updated description'
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check garden was updated
        self.garden.refresh_from_db()
        self.assertEqual(self.garden.name, 'Updated Garden')
        self.assertEqual(self.garden.description, 'Updated description')
    
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
        # Create a second garden for testing
        garden2 = Garden.objects.create(
            name="Second Garden",
            description="A second garden",
            is_public=True
        )
        
        url = reverse('garden:membership-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        
        data = {
            'garden': garden2.id,
            'role': 'WORKER'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check membership was created
        self.assertTrue(GardenMembership.objects.filter(
            user=self.user2,
            garden=garden2
        ).exists())
    
    def test_my_gardens(self):
        """Test getting user's gardens"""
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
        
        # For @action methods, use basename-action_name pattern
        url = reverse('garden:membership-accept-membership', args=[pending_membership.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check membership was accepted
        pending_membership.refresh_from_db()
        self.assertEqual(pending_membership.status, 'ACCEPTED')
    
    # Custom Task Type Endpoints
    
    def test_task_type_list(self):
        """Test listing custom task types"""
        url = reverse('garden:task-type-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Test Task Type')
    
    def test_create_task_type(self):
        """Test creating a custom task type"""
        url = reverse('garden:task-type-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        data = {
            'garden': self.garden.id,
            'name': 'New Task Type',
            'description': 'A new task type'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check task type was created
        self.assertTrue(CustomTaskType.objects.filter(name='New Task Type').exists())
    
    # Task Endpoints
    
    def test_task_list(self):
        """Test listing tasks"""
        url = reverse('garden:task-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Existing Task')
    
    def test_create_task(self):
        """Test creating a task"""
        url = reverse('garden:task-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user_token.key}')
        
        data = {
            'garden': self.garden.id,
            'title': 'New Task',
            'description': 'A new task',
            'status': 'PENDING',
            'assigned_to': self.user2.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check task was created
        self.assertTrue(Task.objects.filter(title='New Task').exists())
        task = Task.objects.get(title='New Task')
        self.assertEqual(task.assigned_by, self.user)
    
    def test_accept_task(self):
        """Test accepting a task"""
        # Make user2 a worker in the garden so they can accept tasks
        worker_membership = GardenMembership.objects.create(
            user=self.user2,
            garden=self.garden,
            role='WORKER',
            status='ACCEPTED'
        )
        
        # For @action methods, use basename-action_name pattern
        url = reverse('garden:task-accept-task', args=[self.task.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check task was accepted
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'ACCEPTED')
    
    def test_decline_task(self):
        """Test declining a task"""
        # Make user2 a worker in the garden so they can decline tasks
        worker_membership = GardenMembership.objects.create(
            user=self.user2,
            garden=self.garden,
            role='WORKER',
            status='ACCEPTED'
        )
        
        # First set task to PENDING
        self.task.status = 'PENDING'
        self.task.save()
        
        # For @action methods, use basename-action_name pattern
        url = reverse('garden:task-decline-task', args=[self.task.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check task was declined
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'DECLINED')
    
    def test_complete_task(self):
        """Test completing a task"""
        # Make user2 a worker in the garden so they can complete tasks
        worker_membership = GardenMembership.objects.create(
            user=self.user2,
            garden=self.garden,
            role='WORKER',
            status='ACCEPTED'
        )
        
        # First set task to IN_PROGRESS
        self.task.status = 'IN_PROGRESS'
        self.task.save()
        
        # For @action methods, use basename-action_name pattern
        url = reverse('garden:task-complete-task', args=[self.task.id])
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.user2_token.key}')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check task was completed
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'COMPLETED')