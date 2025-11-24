import {
  registerForPushNotificationsAsync,
  registerDeviceForPushNotifications,
  getBadgeCount,
  setBadgeCount,
} from '../pushNotifications';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerDevice } from '../../services/notification';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));
jest.mock('../../services/notification');

describe('Push Notifications Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerForPushNotificationsAsync', () => {
    it('should return null if not a physical device', async () => {
      // @ts-ignore
      Device.isDevice = false;

      const token = await registerForPushNotificationsAsync();

      expect(token).toBeNull();
    });

    it('should return token if permission granted', async () => {
      // @ts-ignore
      Device.isDevice = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'test-push-token',
      });

      const token = await registerForPushNotificationsAsync();

      expect(token).toBe('test-push-token');
    });

    it('should request permission if not determined', async () => {
      // @ts-ignore
      Device.isDevice = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'test-push-token',
      });

      const token = await registerForPushNotificationsAsync();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(token).toBe('test-push-token');
    });

    it('should return null if permission denied', async () => {
      // @ts-ignore
      Device.isDevice = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const token = await registerForPushNotificationsAsync();

      expect(token).toBeNull();
    });

    it('should set notification channel on Android', async () => {
      // @ts-ignore
      Device.isDevice = true;
      Platform.OS = 'android';
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'test-push-token',
      });

      await registerForPushNotificationsAsync();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'default',
        expect.any(Object)
      );
    });
  });

  describe('registerDeviceForPushNotifications', () => {
    it('should register device if token available', async () => {
      // Mock registerForPushNotificationsAsync implementation indirectly
      // Since we can't easily mock the internal call to the exported function in the same module
      // We'll have to rely on mocking the dependencies it calls
      
      // @ts-ignore
      Device.isDevice = true;
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'test-push-token',
      });
      (registerDevice as jest.Mock).mockResolvedValue({});

      const result = await registerDeviceForPushNotifications('auth-token');

      expect(registerDevice).toHaveBeenCalledWith('test-push-token', 'auth-token');
      expect(result).toBe(true);
    });

    it('should return false if no token', async () => {
      // @ts-ignore
      Device.isDevice = false; // Will cause registerForPushNotificationsAsync to return null

      const result = await registerDeviceForPushNotifications('auth-token');

      expect(registerDevice).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('Badge Count', () => {
    it('should get badge count', async () => {
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(5);

      const count = await getBadgeCount();

      expect(count).toBe(5);
    });

    it('should set badge count', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(true);

      const result = await setBadgeCount(10);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(10);
      expect(result).toBe(true);
    });
  });
});
