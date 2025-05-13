// API configuration and utility functions
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Mock data for development until the backend is ready
const MOCK_DATA = {
  // Mock garden data
  gardens: [
    {
      id: '1',
      name: 'Community Roots Garden',
      description: 'A beautiful community garden in the heart of the city.',
      location: 'Downtown',
      members: 15,
      tasks: 8,
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: '2',
      name: 'Green Thumbs Collective',
      description: 'Organic gardening and sustainable practices.',
      location: 'East Side',
      members: 23,
      tasks: 12,
      image: 'https://images.unsplash.com/photo-1611843467160-25afb8df1074?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: '3',
      name: 'Urban Sprouts',
      description: 'Urban gardening initiative for local food production.',
      location: 'North District',
      members: 18,
      tasks: 5,
      image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    }
  ],

  // Mock tasks data
  tasks: [
    {
      id: '1',
      title: 'Water vegetable beds',
      description: 'Water all vegetable beds in section A',
      status: 'Pending',
      assignee: 'John Doe',
      deadline: '2025-04-20',
      gardenId: '1'
    },
    {
      id: '2',
      title: 'Harvest tomatoes',
      description: 'Harvest ripe tomatoes from section B',
      status: 'In Progress',
      assignee: 'Jane Smith',
      deadline: '2025-04-18',
      gardenId: '1'
    },

    { id: '1', title: 'Water tomato bed', description: '', status: 'Pending', assignee: 'John Doe', deadline: '2025-05-10', gardenId: '1' },
    { id: '2', title: 'Harvest spinach', description: '', status: 'In Progress', assignee: 'Jane Smith', deadline: '2025-05-10', gardenId: '1' },
    { id: '3', title: 'Pest control', description: '', status: 'Completed', assignee: 'Alex', deadline: '2025-05-11', gardenId: '1' },
    { id: '4', title: 'Prune lavender', description: '', status: 'Pending', assignee: null, deadline: '2025-05-12', gardenId: '1' },
    { id: '5', title: 'Fertilize soil', description: '', status: 'Pending', assignee: null, deadline: '2025-05-13', gardenId: '1' },
    { id: '6', title: 'General maintenance', description: '', status: 'Pending', assignee: 'Team A', deadline: '2025-05-14', gardenId: '1' },
    { id: '7', title: 'Harvest strawberries', description: '', status: 'Pending', assignee: null, deadline: '2025-05-15', gardenId: '1' },
    { id: '8', title: 'Water herb section', description: '', status: 'Pending', assignee: null, deadline: '2025-05-15', gardenId: '1' },
    { id: '9', title: 'Spray for aphids', description: '', status: 'Pending', assignee: null, deadline: '2025-05-17', gardenId: '1' },
    { id: '10', title: 'Fertilize tomatoes', description: '', status: 'Pending', assignee: null, deadline: '2025-05-17', gardenId: '1' },
    { id: '11', title: 'Prune rosemary', description: '', status: 'Pending', assignee: null, deadline: '2025-05-18', gardenId: '1' },
    { id: '12', title: 'Harvest lettuce', description: '', status: 'Pending', assignee: null, deadline: '2025-05-19', gardenId: '1' },
    { id: '13', title: 'Water fruit trees', description: '', status: 'Pending', assignee: null, deadline: '2025-05-20', gardenId: '1' },
    { id: '14', title: 'Clean tools', description: '', status: 'Pending', assignee: null, deadline: '2025-05-21', gardenId: '1' },
    { id: '15', title: 'Maintain compost area', description: '', status: 'Pending', assignee: null, deadline: '2025-05-21', gardenId: '1' },
    { id: '16', title: 'Water greenhouse', description: '', status: 'Pending', assignee: null, deadline: '2025-05-22', gardenId: '1' },
    { id: '17', title: 'Harvest peppers', description: '', status: 'Pending', assignee: null, deadline: '2025-05-22', gardenId: '1' },
    { id: '18', title: 'Pest monitoring', description: '', status: 'Pending', assignee: null, deadline: '2025-05-24', gardenId: '1' },

    {
      id: '3',
      title: 'Plant new herbs',
      description: 'Plant basil, mint, and rosemary in herb garden',
      status: 'Completed',
      assignee: 'Alex Johnson',
      deadline: '2025-04-15',
      gardenId: '2'
    },
    {
      id: '4',
      title: 'Clean garden tools',
      description: 'Clean and organize tools in the shed',
      status: 'Pending',
      assignee: null, // Unassigned task
      deadline: '2025-04-25',
      gardenId: '2'
    }
  ],

  // Mock forum posts
  forumPosts: [
    {
      id: '1',
      title: 'Tips for growing tomatoes in small spaces',
      content: 'I\'ve been growing cherry tomatoes in containers on my balcony and wanted to share some tips...',
      author: 'GardenGuru',
      authorId: '101',
      date: '2025-04-10',
      likes: 24,
      comments: 8
    },
    {
      id: '2',
      title: 'Best compost methods for community gardens',
      content: 'Our garden has been experimenting with different composting methods and I wanted to share our results...',
      author: 'CompostKing',
      authorId: '102',
      date: '2025-04-12',
      likes: 18,
      comments: 5
    },
    {
      id: '3',
      title: 'Dealing with pests organically',
      content: 'Has anyone found effective organic ways to deal with aphids? They\'re attacking our roses...',
      author: 'OrganicGardener',
      authorId: '103',
      date: '2025-04-14',
      likes: 12,
      comments: 14
    }
  ],

  // Mock weather data
  weather: {
    location: 'Istanbul',
    current: {
      temp: 22,
      condition: 'Sunny',
      humidity: 45,
      wind: 10
    },
    forecast: [
      { date: '2025-04-17', high: 24, low: 15, condition: 'Partly Cloudy' },
      { date: '2025-04-18', high: 26, low: 16, condition: 'Sunny' },
      { date: '2025-04-19', high: 20, low: 14, condition: 'Rain' }
    ]
  }
};

// Flag to toggle between mock and real API
const USE_MOCK_DATA = true;

// API request helper with mock data fallback
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  // If we're using mock data, return the appropriate mock data
  if (USE_MOCK_DATA) {
    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return mock data based on the endpoint
    switch (endpoint) {
      case '/gardens':
        return { data: MOCK_DATA.gardens };
      case '/tasks':
        return { data: MOCK_DATA.tasks };
      case '/forum':
        return { data: MOCK_DATA.forumPosts };
      case '/weather':
        return { data: MOCK_DATA.weather };
      default:
        if (endpoint.startsWith('/gardens/') && endpoint.includes('tasks')) {
          const gardenId = endpoint.split('/')[2];
          return {
            data: MOCK_DATA.tasks.filter(task => task.gardenId === gardenId)
          };
        }
        if (endpoint.startsWith('/gardens/')) {
          const gardenId = endpoint.split('/')[2];
          return {
            data: MOCK_DATA.gardens.find(garden => garden.id === gardenId)
          };
        }
        return { data: null };
    }
  }

  // When backend is ready, use real API calls
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here when authentication is implemented
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API functions that can be used throughout the app
export const api = {
  // Auth endpoints
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  logout: () => apiRequest('/auth/logout', 'POST'),

  // Garden endpoints
  getGardens: () => apiRequest('/gardens/'),
  getGarden: (id) => apiRequest(`/gardens/${id}/`),
  createGarden: (garden) => apiRequest('/gardens/', 'POST', garden),
  updateGarden: (id, garden) => apiRequest(`/gardens/${id}/`, 'PUT', garden),
  deleteGarden: (id) => apiRequest(`/gardens/${id}/`, 'DELETE'),
  
  // Garden Member endpoints
  getGardenMembers: (gardenId) => apiRequest(`/memberships/?garden=${gardenId}`),
  joinGarden: (gardenId) => apiRequest('/memberships/', 'POST', { garden: gardenId }),
  updateGardenMember: (membershipId, memberData) => apiRequest(`/memberships/${membershipId}/`, 'PUT', memberData),
  removeGardenMember: (membershipId) => apiRequest(`/memberships/${membershipId}/`, 'DELETE'),

  // Task endpoints
  getTasks: () => apiRequest('/tasks'),
  getGardenTasks: (gardenId) => apiRequest(`/gardens/${gardenId}/tasks`),
  createTask: (task) => apiRequest('/tasks', 'POST', task),
  updateTask: (id, task) => apiRequest(`/tasks/${id}`, 'PUT', task),
  deleteTask: (id) => apiRequest(`/tasks/${id}`, 'DELETE'),
  assignTask: (id, userId) => apiRequest(`/tasks/${id}/assign/${userId}`, 'POST'),
  unassignTask: (id, userId) => apiRequest(`/tasks/${id}/unassign/${userId}`, 'POST'),
  acceptTask: (id) => apiRequest(`/tasks/${id}/accept`, 'POST'),
  declineTask: (id) => apiRequest(`/tasks/${id}/decline`, 'POST'),

  // Forum endpoints
  getPosts: () => apiRequest('/forum'),
  getPost: (id) => apiRequest(`/forum/${id}`),
  createPost: (post) => apiRequest('/forum', 'POST', post),
  updatePost: (id, post) => apiRequest(`/forum/${id}`, 'PUT', post),
  deletePost: (id) => apiRequest(`/forum/${id}`, 'DELETE'),
  addComment: (postId, comment) => apiRequest(`/forum/${postId}/comments`, 'POST', comment),

  // User endpoints
  getUserProfile: (id) => apiRequest(`/users/${id}`),
  updateUserProfile: (id, profile) => apiRequest(`/users/${id}`, 'PUT', profile),
  followUser: (id) => apiRequest(`/users/${id}/follow`, 'POST'),
  unfollowUser: (id) => apiRequest(`/users/${id}/unfollow`, 'POST'),

  // Weather endpoints
  getWeather: (location) => {
    if (USE_MOCK_DATA) {
      return apiRequest('/weather');
    }
    const locationParam = location || 'Istanbul';
    return apiRequest(`/weather?location=${encodeURIComponent(locationParam)}`);
  },
};

export default api;