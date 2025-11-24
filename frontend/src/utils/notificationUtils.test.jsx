import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerForPushNotifications, setupForegroundMessageListener } from './notificationUtils';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from 'react-toastify';

// Mock firebase/messaging
vi.mock('firebase/messaging', () => ({
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
  },
}));

// Mock firebaseConfig
vi.mock('../config/firebaseConfig', () => ({
  messaging: {},
  VAPID_KEY: 'test-vapid-key',
}));

// Mock fetch
globalThis.fetch = vi.fn();

// Mock Notification API
globalThis.Notification = {
  requestPermission: vi.fn(),
};

describe('notificationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env = { VITE_API_URL: 'http://test-api.com' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerForPushNotifications', () => {
    it('should register successfully when permission is granted', async () => {
      const mockToken = 'test-firebase-token';
      const mockAuthToken = 'test-auth-token';

      Notification.requestPermission.mockResolvedValue('granted');
      getToken.mockResolvedValue(mockToken);
      globalThis.fetch.mockResolvedValue({ ok: true });

      await registerForPushNotifications(mockAuthToken);

      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(getToken).toHaveBeenCalled();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/gcm/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Token ${mockAuthToken}`,
          }),
          body: expect.stringContaining(mockToken),
        })
      );
    });

    it('should not register when permission is denied', async () => {
      Notification.requestPermission.mockResolvedValue('denied');

      await registerForPushNotifications('test-auth-token');

      expect(getToken).not.toHaveBeenCalled();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('should handle when no token is available', async () => {
      Notification.requestPermission.mockResolvedValue('granted');
      getToken.mockResolvedValue(null);

      await registerForPushNotifications('test-auth-token');

      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      Notification.requestPermission.mockResolvedValue('granted');
      getToken.mockResolvedValue('test-token');
      globalThis.fetch.mockResolvedValue({ ok: false });

      await registerForPushNotifications('test-auth-token');

      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  describe('setupForegroundMessageListener', () => {
    let addEventListenerSpy;

    beforeEach(() => {
      addEventListenerSpy = vi.fn();
      globalThis.navigator.serviceWorker = {
        addEventListener: addEventListenerSpy,
      };
    });

    it('should setup message listener and show toast', () => {
      const mockPayload = {
        data: {
          data_title: 'Test Title',
          data_body: 'Test Body',
          link: '/test-link',
        },
      };

      let messageCallback;
      onMessage.mockImplementation((messaging, callback) => {
        messageCallback = callback;
      });

      const dispatchEventSpy = vi.spyOn(document, 'dispatchEvent');
      const mockNavigate = vi.fn();

      setupForegroundMessageListener(mockNavigate);

      // Simulate receiving a message
      messageCallback(mockPayload);

      expect(toast.info).toHaveBeenCalled();
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new-notification',
        })
      );

      // Verify service worker listener is attached
      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

      dispatchEventSpy.mockRestore();
    });

    it('should handle service worker navigation message', () => {
      const mockNavigate = vi.fn();
      setupForegroundMessageListener(mockNavigate);

      // Get the message listener callback
      const messageListener = addEventListenerSpy.mock.calls.find(call => call[0] === 'message')[1];

      // Simulate service worker message
      messageListener({
        data: {
          type: 'navigate',
          link: '/test-link'
        }
      });

      expect(mockNavigate).toHaveBeenCalledWith('/test-link');
    });
  });
});
