// Web Push Notifications utility
// Using Vite proxy - requests to /api/* get forwarded to the push server
const PUSH_SERVER_URL = (import.meta as any).env.PROD ? 'https://time-diet-push-server-production.up.railway.app' : '/api';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationManager {
  private vapidPublicKey: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Get VAPID public key from server
      const response = await fetch(`${PUSH_SERVER_URL}/vapid-public-key`);
      const { publicKey } = await response.json();
      this.vapidPublicKey = publicKey;

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    try {
      if (!this.vapidPublicKey) {
        console.log('🔔 Initializing VAPID key...');
        await this.initialize();
      }

      console.log('🔔 Waiting for service worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('🔔 Service worker ready:', registration.scope);
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      console.log('🔔 Existing subscription:', subscription ? 'Found' : 'None');
      
      if (!subscription) {
        console.log('🔔 Creating new push subscription...');
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!)
        });
        console.log('🔔 New subscription created');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      console.log('🔔 Sending subscription to server:', PUSH_SERVER_URL);
      console.log('🔔 Subscription endpoint:', subscriptionData.endpoint);

      // Send subscription to server
      const response = await fetch(`${PUSH_SERVER_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔔 Failed to register subscription with server:', errorText);
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      const serverResult = await response.json();
      console.log('🔔 Server subscription response:', serverResult);
      console.log('🔔 Push subscription successful:', subscriptionData.endpoint);
      return subscriptionData;
    } catch (error) {
      console.error('🔔 Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await fetch(`${PUSH_SERVER_URL}/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        
        console.log('Push unsubscription successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async sendTestNotification(title: string = 'Test Notification', body: string = 'This is a test push notification'): Promise<boolean> {
    try {
      console.log('🚀 Sending push notification to server:', PUSH_SERVER_URL);
      console.log('🚀 Notification payload:', { title, body });
      
      const response = await fetch(`${PUSH_SERVER_URL}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, body })
      });

      console.log('🚀 Server response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚀 Server error response:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('🚀 Test notification sent successfully:', result);
      return true;
    } catch (error) {
      console.error('🚀 Failed to send test notification:', error);
      return false;
    }
  }

  async scheduleNotification(title: string, body: string, scheduledTime: Date, blockId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${PUSH_SERVER_URL}/schedule-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body,
          scheduledTime: scheduledTime.toISOString(),
          blockId
        })
      });

      const result = await response.json();
      console.log('Notification scheduled:', result);
      return response.ok;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  }

  async scheduleBulkNotifications(notifications: Array<{
    id: string;
    title: string;
    body: string;
    scheduledTime: Date;
    blockId?: string;
    isEarlyWarning?: boolean;
  }>): Promise<boolean> {
    try {
      console.log('🔔 Scheduling bulk notifications:', notifications.length);
      
      const response = await fetch(`${PUSH_SERVER_URL}/schedule-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notifications: notifications.map(notif => ({
            ...notif,
            scheduledTime: notif.scheduledTime.toISOString()
          }))
        })
      });

      const result = await response.json();
      console.log('🔔 Bulk notifications scheduled:', result);
      return response.ok;
    } catch (error) {
      console.error('🔔 Failed to schedule bulk notifications:', error);
      return false;
    }
  }

  async clearScheduledNotifications(): Promise<boolean> {
    try {
      console.log('🗑️ Clearing all scheduled notifications');
      
      const response = await fetch(`${PUSH_SERVER_URL}/clear-scheduled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('🗑️ Scheduled notifications cleared:', result);
      return response.ok;
    } catch (error) {
      console.error('🗑️ Failed to clear scheduled notifications:', error);
      return false;
    }
  }

  async getScheduledNotifications(): Promise<any[]> {
    try {
      const response = await fetch(`${PUSH_SERVER_URL}/scheduled`);
      const result = await response.json();
      return result.notifications || [];
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();
