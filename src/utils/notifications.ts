import { TimeBlockInstance, NotificationQueue } from '@/types';
import { format, addMinutes } from 'date-fns';
import { pushNotificationManager } from './pushNotifications';

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
 * Show a notification using push notification system
 */
export async function showNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    console.log('🔔 Sending immediate push notification:', title);
    
    // Use push notification system for immediate notifications
    const success = await pushNotificationManager.sendTestNotification(
      title,
      options?.body || 'Time Diet notification'
    );
    
    if (success) {
      console.log('🔔 Push notification sent successfully:', title);
    } else {
      console.error('🔔 Failed to send push notification, falling back to local');
      
      // Fallback to local notification if push fails
      const notificationOptions = {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      };
      
      const notification = new Notification(title, notificationOptions);
      console.log('🔔 Local fallback notification created:', notification);
    }
    
  } catch (error) {
    console.error('🔔 Error showing notification:', error);
  }
}

/**
 * Schedule notifications for time blocks using Smart-Merge strategy
 * 
 * Strategy:
 * - For CONTIGUOUS blocks: Merge early warning with wrap-up notification
 * - For NON-CONTIGUOUS blocks: Send all 3 notifications (end, early warning, start)
 * 
 * This reduces cognitive load for ADHD users by asking for completion during
 * the natural "winding down" phase, not at the high-pressure "start now!" moment.
 */
export function scheduleBlockNotifications(
  blocks: TimeBlockInstance[],
  earlyWarningMinutes: number,
  date?: string
): NotificationQueue[] {
  const now = new Date();
  const notifications: NotificationQueue[] = [];

  console.log('📅 scheduleBlockNotifications called:', {
    blockCount: blocks.length,
    earlyWarningMinutes,
    date,
    currentTime: format(now, 'HH:mm:ss')
  });

  blocks.forEach((block, index) => {
    // Skip past blocks
    if (block.end <= now) {
      console.log(`⏭️ Skipping past block: ${block.title} (ended at ${format(block.end, 'HH:mm')})`);
      return;
    }

    const nextBlock = blocks[index + 1];
    const isContiguous = nextBlock && block.end.getTime() === nextBlock.start.getTime();

    // Check if this is a future block (not currently running)
    const isFutureBlock = block.start > now;
    
    console.log(`🔍 Processing block: ${block.title}`, {
      start: format(block.start, 'HH:mm'),
      end: format(block.end, 'HH:mm'),
      isFutureBlock,
      isContiguous,
      nextBlock: nextBlock?.title || 'none'
    });

    if (isContiguous && earlyWarningMinutes > 0 && isFutureBlock) {
      // SMART-MERGE: Contiguous blocks with early warning enabled
      
      // Enhanced early warning: wrap up current block + preview next block
      const earlyWarningTime = addMinutes(block.end, -earlyWarningMinutes);
      if (earlyWarningTime > now) {
        const notification = {
          id: `block-wrap-${block.id}`,
          blockId: block.id, // Current block for Complete/Skip actions
          scheduledTime: earlyWarningTime,
          title: `Wrap up: ${block.title}`,
          body: `Next: ${nextBlock.title} in ${earlyWarningMinutes} minutes`,
          isEarlyWarning: true,
          date: date,
          notificationType: 'early-warning' as const
        };
        notifications.push(notification);
        console.log(`  ✅ Created WRAP-UP notification at ${format(earlyWarningTime, 'HH:mm')}:`, notification.title);
      } else {
        console.log(`  ⏭️ Skipped WRAP-UP (time ${format(earlyWarningTime, 'HH:mm')} already passed)`);
      }

      // Start notification for next block (at transition moment)
      if (nextBlock.start > now) {
        const notification = {
          id: `block-start-${nextBlock.id}`,
          blockId: nextBlock.id,
          scheduledTime: nextBlock.start,
          title: `Time for: ${nextBlock.title}`,
          body: `Starting now until ${format(nextBlock.end, 'HH:mm')}`,
          date: date,
          notificationType: 'block-start' as const
        };
        notifications.push(notification);
        console.log(`  ✅ Created START notification at ${format(nextBlock.start, 'HH:mm')}:`, notification.title);
      } else {
        console.log(`  ⏭️ Skipped START for next block (already started)`);
      }
    } else if (!isContiguous && isFutureBlock) {
      // NON-CONTIGUOUS: Full set of notifications
      
      // 1. End-of-block notification (wrap up and mark completion)
      if (block.end > now) {
        notifications.push({
          id: `block-end-${block.id}`,
          blockId: block.id,
          scheduledTime: block.end,
          title: `How did it go?`,
          body: `${block.title} - Mark as complete or skipped`,
          date: date,
          notificationType: 'block-end'
        });
      }

      // 2. Early warning for next block (if exists and early warning enabled)
      if (nextBlock && earlyWarningMinutes > 0) {
        const earlyWarningTime = addMinutes(nextBlock.start, -earlyWarningMinutes);
        if (earlyWarningTime > now) {
          notifications.push({
            id: `block-warning-${nextBlock.id}`,
            blockId: nextBlock.id,
            scheduledTime: earlyWarningTime,
            title: `Coming up: ${nextBlock.title}`,
            body: `Starting in ${earlyWarningMinutes} minutes`,
            isEarlyWarning: true,
            date: date,
            notificationType: 'early-warning'
          });
        }
      }

      // 3. Start notification for next block
      if (nextBlock && nextBlock.start > now) {
        notifications.push({
          id: `block-start-${nextBlock.id}`,
          blockId: nextBlock.id,
          scheduledTime: nextBlock.start,
          title: `Time for: ${nextBlock.title}`,
          body: `Starting now until ${format(nextBlock.end, 'HH:mm')}`,
          date: date,
          notificationType: 'block-start'
        });
      }
    } else if (isFutureBlock) {
      // CONTIGUOUS but no early warning: Just send start notification
      if (block.start > now) {
        notifications.push({
          id: `block-start-${block.id}`,
          blockId: block.id,
          scheduledTime: block.start,
          title: `Time for: ${block.title}`,
          body: `Starting now until ${format(block.end, 'HH:mm')}`,
          date: date,
          notificationType: 'block-start'
        });
      }
    }
  });

  console.log(`📊 Total notifications created: ${notifications.length}`);
  notifications.forEach(n => {
    console.log(`  📅 ${format(n.scheduledTime, 'HH:mm')} - ${n.title} (${n.notificationType})`);
  });

  return notifications;
}

/**
 * Schedule notifications using push notification system
 */
export async function scheduleNotificationsPush(notifications: NotificationQueue[]): Promise<boolean> {
  try {
    console.log('🔔 Scheduling notifications via push system:', notifications.length);
    
    // Clear any existing scheduled notifications on the server
    await pushNotificationManager.clearScheduledNotifications();
    
    // Convert to push notification format
    const pushNotifications = notifications.map(notif => ({
      id: notif.id,
      title: notif.title,
      body: notif.body,
      scheduledTime: notif.scheduledTime,
      blockId: notif.blockId,
      isEarlyWarning: notif.isEarlyWarning || false,
      date: notif.date,
      notificationType: notif.notificationType || 'default'
    }));
    
    // Schedule via push server
    const success = await pushNotificationManager.scheduleBulkNotifications(pushNotifications);
    
    if (success) {
      console.log('🔔 All notifications scheduled successfully via push system');
    } else {
      console.error('🔔 Failed to schedule notifications via push system');
    }
    
    return success;
  } catch (error) {
    console.error('🔔 Error scheduling push notifications:', error);
    return false;
  }
}

/**
 * Schedule a single notification using setTimeout (legacy fallback)
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
 * Clear all scheduled notifications (legacy)
 */
export function clearScheduledNotifications(timeoutIds: number[]): void {
  timeoutIds.forEach(id => {
    if (id !== -1) {
      clearTimeout(id);
    }
  });
}

/**
 * Clear all scheduled push notifications
 */
export async function clearScheduledPushNotifications(): Promise<boolean> {
  try {
    console.log('🗑️ Clearing all scheduled push notifications');
    return await pushNotificationManager.clearScheduledNotifications();
  } catch (error) {
    console.error('🗑️ Error clearing scheduled push notifications:', error);
    return false;
  }
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
  console.log('🔔 Showing checklist reminder via push system');
  showNotification('Daily Checklist', {
    body: 'Time to complete your daily checklist!',
    tag: 'checklist-reminder'
  }).catch(console.error);
}

/**
 * Show lights out reminder notification
 */
export function showLightsOutReminder(): void {
  console.log('🔔 Showing lights out reminder via push system');
  showNotification('Lights Out', {
    body: 'Time to wind down for the day. Lights out at 23:30!',
    tag: 'lights-out-reminder'
  }).catch(console.error);
}

/**
 * Schedule a test notification for debugging
 * This uses the REAL Smart-Merge notification logic to generate accurate test notifications
 */
export async function scheduleTestNotification(
  blockId: string,
  blocks: TimeBlockInstance[],
  date: string,
  notificationType: 'early-warning' | 'block-start' | 'block-end',
  earlyWarningMinutes: number,
  delaySeconds: number = 30
): Promise<boolean> {
  try {
    // Find the block index
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      console.error('Block not found:', blockId);
      return false;
    }
    
    const block = blocks[blockIndex];
    const nextBlock = blockIndex < blocks.length - 1 ? blocks[blockIndex + 1] : null;
    
    // Generate the REAL notification using Smart-Merge logic
    let notification: NotificationQueue | null = null;
    
    if (notificationType === 'early-warning') {
      // Check if this block is contiguous with the next block
      const isContiguousWithNext = nextBlock && block.end.getTime() === nextBlock.start.getTime();
      
      if (isContiguousWithNext && earlyWarningMinutes > 0) {
        // SMART-MERGE: Wrap up current block + preview next block
        notification = {
          id: `test-early-warning-${blockId}-${Date.now()}`,
          blockId: block.id,
          scheduledTime: new Date(Date.now() + delaySeconds * 1000),
          title: `Wrap up: ${block.title}`,
          body: `Next: ${nextBlock!.title} in ${earlyWarningMinutes} minutes`,
          isEarlyWarning: true,
          date,
          notificationType: 'early-warning'
        };
      } else {
        // NON-CONTIGUOUS: Standard early warning
        notification = {
          id: `test-early-warning-${blockId}-${Date.now()}`,
          blockId: block.id,
          scheduledTime: new Date(Date.now() + delaySeconds * 1000),
          title: `Coming up: ${block.title}`,
          body: `Starting in ${earlyWarningMinutes} minutes`,
          isEarlyWarning: true,
          date,
          notificationType: 'early-warning'
        };
      }
    } else if (notificationType === 'block-start') {
      // Block start notification
      notification = {
        id: `test-block-start-${blockId}-${Date.now()}`,
        blockId: block.id,
        scheduledTime: new Date(Date.now() + delaySeconds * 1000),
        title: `Time for: ${block.title}`,
        body: `Starting now until ${format(block.end, 'HH:mm')}`,
        date,
        notificationType: 'block-start'
      };
    } else if (notificationType === 'block-end') {
      // Block end notification (for non-contiguous blocks)
      notification = {
        id: `test-block-end-${blockId}-${Date.now()}`,
        blockId: block.id,
        scheduledTime: new Date(Date.now() + delaySeconds * 1000),
        title: `How did it go?`,
        body: `${block.title} - Mark as complete or skipped`,
        date,
        notificationType: 'block-end'
      };
    }
    
    if (!notification) {
      console.error('Failed to generate test notification');
      return false;
    }
    
    console.log(`🔔 Scheduling SMART test ${notificationType} notification in ${delaySeconds}s:`, notification);
    
    // Schedule via push notification system
    const success = await scheduleNotificationsPush([notification]);
    
    if (success) {
      console.log(`✅ Test notification scheduled successfully with Smart-Merge logic`);
    } else {
      console.error(`❌ Failed to schedule test notification`);
    }
    
    return success;
  } catch (error) {
    console.error('Error scheduling test notification:', error);
    return false;
  }
}

/**
 * Persistent Current Block Notification
 * Shows a sticky notification for the active time block
 */

const PERSISTENT_NOTIFICATION_TAG = 'time-diet-current-block';

export async function showPersistentCurrentBlock(
  block: TimeBlockInstance,
  timeRemaining: string
): Promise<void> {
  try {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Close any existing persistent notification first
    const notifications = await registration.getNotifications({ tag: PERSISTENT_NOTIFICATION_TAG });
    notifications.forEach(n => n.close());
    
    // Show new persistent notification
    await registration.showNotification(`⏰ ${block.title}`, {
      body: `Time remaining: ${timeRemaining}`,
      tag: PERSISTENT_NOTIFICATION_TAG,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      requireInteraction: true, // Makes it persistent (won't auto-dismiss)
      silent: true, // No sound for updates
      data: {
        blockId: block.id,
        date: format(block.start, 'yyyy-MM-dd'),
        type: 'PERSISTENT_CURRENT_BLOCK'
      },
      actions: [
        { action: 'complete', title: '✓ Complete' },
        { action: 'open', title: 'Open App' }
      ]
    } as any); // TypeScript types are outdated for notification actions
    
    console.log('📌 Persistent notification shown:', block.title, timeRemaining);
  } catch (error) {
    console.error('Error showing persistent notification:', error);
  }
}

export async function updatePersistentCurrentBlock(
  block: TimeBlockInstance,
  timeRemaining: string
): Promise<void> {
  // Simply show a new notification with the same tag (replaces the old one)
  await showPersistentCurrentBlock(block, timeRemaining);
}

export async function clearPersistentCurrentBlock(): Promise<void> {
  try {
    if (!isNotificationSupported()) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const notifications = await registration.getNotifications({ tag: PERSISTENT_NOTIFICATION_TAG });
    notifications.forEach(n => n.close());
    
    console.log('📌 Persistent notification cleared');
  } catch (error) {
    console.error('Error clearing persistent notification:', error);
  }
}

