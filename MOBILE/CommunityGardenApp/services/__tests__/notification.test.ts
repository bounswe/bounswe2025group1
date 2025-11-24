import axios from 'axios';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  registerDevice,
  unregisterDevice,
  Notification,
} from '../notification';
import { API_URL } from '../../constants/Config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications', async () => {
      const mockNotifications: Notification[] = [
        {
          id: 1,
          message: 'Test Notification',
          category: 'SOCIAL',
          read: false,
          timestamp: '2023-01-01T10:00:00Z',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockNotifications });

      const result = await fetchNotifications('test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/notifications/`, {
        headers: { Authorization: 'Token test-token' },
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('fetchUnreadCount', () => {
    it('should fetch unread count', async () => {
      mockedAxios.get.mockResolvedValue({ data: { unread_count: 5 } });

      const result = await fetchUnreadCount('test-token');

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/notifications/unread_count/`, {
        headers: { Authorization: 'Token test-token' },
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockedAxios.post.mockResolvedValue({});

      await markAsRead(1, 'test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/notifications/1/mark_as_read/`,
        {},
        { headers: { Authorization: 'Token test-token' } }
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockedAxios.post.mockResolvedValue({});

      await markAllAsRead('test-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/notifications/mark_all_as_read/`,
        {},
        { headers: { Authorization: 'Token test-token' } }
      );
    });
  });

  describe('registerDevice', () => {
    it('should register device for push notifications', async () => {
      mockedAxios.post.mockResolvedValue({});

      await registerDevice('push-token', 'auth-token');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/devices/gcm/`,
        { registration_id: 'push-token' },
        { headers: { Authorization: 'Token auth-token' } }
      );
    });
  });

  describe('unregisterDevice', () => {
    it('should unregister device', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await unregisterDevice('push-token', 'auth-token');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${API_URL}/devices/gcm/push-token/`,
        { headers: { Authorization: 'Token auth-token' } }
      );
    });
  });
});
