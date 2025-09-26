import { TimeBlockInstance, NotificationQueue } from '@/types';
import { format, addMinutes } from 'date-fns';

/**
 * Check if notifications are supported in the browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Show a notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    });
  }
}

/**
 * Schedule notifications for time blocks
 */
export function scheduleBlockNotifications(
  blocks: TimeBlockInstance[],
  earlyWarningMinutes: number = 0
): NotificationQueue[] {
  const notifications: NotificationQueue[] = [];
  const now = new Date();

  blocks.forEach(block => {
    // Skip past blocks
    if (block.start <= now) return;

    // Main notification at block start
    notifications.push({
      id: `block-start-${block.id}`,
      blockId: block.id,
      scheduledTime: block.start,
      title: `Time for: ${block.title}`,
      body: `Starting now until ${format(block.end, 'HH:mm')}`
    });

    // Early warning notification if enabled
    if (earlyWarningMinutes > 0) {
      const earlyWarningTime = addMinutes(block.start, -earlyWarningMinutes);
      if (earlyWarningTime > now) {
        notifications.push({
          id: `block-warning-${block.id}`,
          blockId: block.id,
          scheduledTime: earlyWarningTime,
          title: `Upcoming: ${block.title}`,
          body: `Starting in ${earlyWarningMinutes} minutes`,
          isEarlyWarning: true
        });
      }
    }
  });

  return notifications;
}

/**
 * Schedule a single notification using setTimeout
 */
export function scheduleNotification(notification: NotificationQueue): number {
  const delay = notification.scheduledTime.getTime() - Date.now();
  
  if (delay <= 0) {
    // Show immediately if time has passed
    showNotification(notification.title, { body: notification.body });
    return -1;
  }

  return window.setTimeout(() => {
    showNotification(notification.title, { body: notification.body });
  }, delay);
}

/**
 * Clear all scheduled notifications
 */
export function clearScheduledNotifications(timeoutIds: number[]): void {
  timeoutIds.forEach(id => {
    if (id !== -1) {
      clearTimeout(id);
    }
  });
}

/**
 * Check if it's time for checklist reminder (after 21:00)
 */
export function shouldShowChecklistReminder(): boolean {
  const now = new Date();
  const checklistTime = new Date(now);
  checklistTime.setHours(21, 0, 0, 0);
  
  return now >= checklistTime && now.getHours() < 24;
}

/**
 * Check if it's time for lights out reminder (after 23:30)
 */
export function shouldShowLightsOutReminder(): boolean {
  const now = new Date();
  const lightsOutTime = new Date(now);
  lightsOutTime.setHours(23, 30, 0, 0);
  
  return now >= lightsOutTime;
}

/**
 * Show checklist reminder notification
 */
export function showChecklistReminder(): void {
  showNotification('Daily Checklist', {
    body: 'Time to complete your daily checklist!',
    tag: 'checklist-reminder'
  });
}

/**
 * Show lights out reminder notification
 */
export function showLightsOutReminder(): void {
  showNotification('Lights Out', {
    body: 'Time to wind down for the day. Lights out at 23:30!',
    tag: 'lights-out-reminder'
  });
}

