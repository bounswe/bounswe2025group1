from django.test import TestCase

# Create your tests here.
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import ForumPost

class ForumPostTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client.force_authenticate(user=self.user)

    def test_create_forum_post(self):
        url = reverse('garden:forum-list-create')
        data = {
            'title': 'Test Post',
            'content': 'This is a test forum post.'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ForumPost.objects.count(), 1)
        self.assertEqual(ForumPost.objects.get().title, 'Test Post')

    def test_list_forum_posts(self):
        ForumPost.objects.create(title='Post 1', content='Content 1', author=self.user)
        ForumPost.objects.create(title='Post 2', content='Content 2', author=self.user)
        
        url = reverse('garden:forum-list-create')
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_retrieve_single_post(self):
        post = ForumPost.objects.create(title='Post 1', content='Content 1', author=self.user)
        
        url = reverse('garden:forum-detail', kwargs={'pk': post.pk})
        response = self.client.get(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Post 1')

    def test_update_forum_post(self):
        post = ForumPost.objects.create(title='Old Title', content='Old content', author=self.user)
        
        url = reverse('garden:forum-detail', kwargs={'pk': post.pk})
        data = {'title': 'New Title', 'content': 'New content'}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        post.refresh_from_db()
        self.assertEqual(post.title, 'New Title')

    def test_delete_forum_post(self):
        post = ForumPost.objects.create(title='Title', content='Content', author=self.user)
        
        url = reverse('garden:forum-detail', kwargs={'pk': post.pk})
        response = self.client.delete(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ForumPost.objects.count(), 0)