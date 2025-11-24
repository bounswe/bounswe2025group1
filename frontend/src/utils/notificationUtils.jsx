import React from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, VAPID_KEY } from '../config/firebaseConfig';
import { toast } from 'react-toastify';


// Requests permission and sends the token to your Django backend.
export const registerForPushNotifications = async (authToken) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Push notification permission denied.");
      return;
    }
    // print vapid key in console
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log("Firebase notification token:", currentToken);
    if (!currentToken) {
      console.log("No registration token available.");
      return;
    }

    // Send this token to your Django backend
    const response = await fetch(`${import.meta.env.VITE_API_URL}/devices/gcm/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${authToken}`,
      },
      body: JSON.stringify({
        "registration_id": currentToken
      }),
    });

    if (response.ok) {
      console.log("Device token registered on backend.");
    } else {
      console.error("Failed to register device token.");
    }
  } catch (err) {
    console.error("An error occurred while registering for push:", err);
  }
};

// Sets up a listener for messages that arrive while the app is in the foreground.
export const setupForegroundMessageListener = (navigate) => {
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", JSON.stringify(payload, null, 2));

      const title = payload.data.data_title;
      const body = payload.data.data_body;
      const link = payload.data.link;

      toast.info(
        <div
          onClick={() => {
            if (link && navigate) {
              navigate(link);
            }
          }}
          style={{ cursor: link ? 'pointer' : 'default' }}
        >
          <strong>{title}</strong>
          <br />
          {body}
        </div>
      );

      const event = new CustomEvent('new-notification');
      document.dispatchEvent(event);
    });
  }

  // Listen for messages from the service worker (e.g. for background notification clicks)
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log("Service Worker message received:", event.data);
    if (event.data && event.data.type === 'navigate' && event.data.link) {
      if (navigate) {
        navigate(event.data.link);
      }
    }
  });
};
