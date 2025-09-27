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
export async function showNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (Notification.permission !== 'granted') {
    return;
  }

  const notificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options
  };

  try {
    // Temporarily skip Service Worker and use direct API for debugging
    console.log('🔔 Using direct Notification API for:', title);
    console.log('🔔 Notification permission:', Notification.permission);
    console.log('🔔 Creating notification with options:', notificationOptions);
    
    const notification = new Notification(title, notificationOptions);
    console.log('🔔 Direct notification created successfully:', notification);
    
    // Add event handlers for debugging
    notification.onshow = () => {
      console.log('🔔 Notification shown successfully');
    };
    
    notification.onerror = (error) => {
      console.error('🔔 Notification error:', error);
    };
    
    notification.onclick = () => {
      console.log('🔔 Notification clicked');
    };
    
  } catch (error) {
    console.error('🔔 Error showing notification:', error);
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
    showNotification(notification.title, { body: notification.body }).catch(console.error);
    return -1;
  }

  return window.setTimeout(() => {
    showNotification(notification.title, { body: notification.body }).catch(console.error);
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
 * Only show if user hasn't manually filled any checklist items today
 */
export async function shouldShowChecklistReminder(): Promise<boolean> {
  const now = new Date();
  const checklistTime = new Date(now);
  checklistTime.setHours(21, 0, 0, 0);
  
  const isTimeForReminder = now >= checklistTime && now.getHours() < 24;
  
  if (!isTimeForReminder) {
    return false;
  }

  try {
    // Import here to avoid circular dependency
    const { getChecklist } = await import('@/utils/storage');
    const { getCurrentDateString } = await import('@/utils/time');
    
    const today = getCurrentDateString();
    const todayChecklist = await getChecklist(today);
    
    // If no checklist exists, show reminder
    if (!todayChecklist) {
      console.log('🔔 Checklist reminder: No checklist found, showing reminder');
      return true;
    }
    
    // Check if user has manually filled any items (excluding auto-calculated focusBlocksCompleted)
    const hasManualInput = todayChecklist.wake0730 || 
                          todayChecklist.noWeekdayYTGames || 
                          todayChecklist.lightsOut2330;
    
    if (hasManualInput) {
      console.log('🔔 Checklist reminder: User has manual input, skipping reminder');
      return false;
    }
    
    console.log('🔔 Checklist reminder: No manual input found, showing reminder');
    return true;
    
  } catch (error) {
    console.error('🔔 Error checking checklist for reminder:', error);
    // If there's an error, show the reminder to be safe
    return true;
  }
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
  }).catch(console.error);
}

/**
 * Show lights out reminder notification
 */
export function showLightsOutReminder(): void {
  showNotification('Lights Out', {
    body: 'Time to wind down for the day. Lights out at 23:30!',
    tag: 'lights-out-reminder'
  }).catch(console.error);
}

