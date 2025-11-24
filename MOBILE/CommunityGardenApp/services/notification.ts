// File: services/notification.ts

import axios from 'axios';
import { API_URL } from '../constants/Config';

export type NotificationCategory = 'TASK' | 'SOCIAL' | 'FORUM' | 'WEATHER';

export interface Notification {
  id: number;
  message: string;
  category: NotificationCategory;
  read: boolean;
  timestamp: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Fetch all notifications for the authenticated user
 */
export const fetchNotifications = async (token: string): Promise<Notification[]> => {
  const response = await axios.get(`${API_URL}/notifications/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

/**
 * Fetch the count of unread notifications
 */
export const fetchUnreadCount = async (token: string): Promise<number> => {
  const response = await axios.get<UnreadCountResponse>(`${API_URL}/notifications/unread_count/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data.unread_count;
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (id: number, token: string): Promise<void> => {
  await axios.post(`${API_URL}/notifications/${id}/mark_as_read/`, {}, {
    headers: { Authorization: `Token ${token}` },
  });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (token: string): Promise<void> => {
  await axios.post(`${API_URL}/notifications/mark_all_as_read/`, {}, {
    headers: { Authorization: `Token ${token}` },
  });
};

/**
 * Register device for push notifications
 */
export const registerDevice = async (pushToken: string, token: string): Promise<void> => {
  await axios.post(`${API_URL}/devices/gcm/`,
    { registration_id: pushToken },
    { headers: { Authorization: `Token ${token}` } }
  );
};

/**
 * Unregister device from push notifications
 */
export const unregisterDevice = async (pushToken: string, token: string): Promise<void> => {
  await axios.delete(`${API_URL}/devices/gcm/${pushToken}/`, {
    headers: { Authorization: `Token ${token}` },
  });
};
