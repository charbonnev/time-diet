import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import {
  requestNotificationPermission,
  scheduleBlockNotifications,
  scheduleNotificationsPush,
  scheduleNotification,
  clearScheduledNotifications,
  clearScheduledPushNotifications,
  shouldShowChecklistReminder,
  shouldShowLightsOutReminder,
  showChecklistReminder,
  showLightsOutReminder,
  updatePersistentCurrentBlock,
  clearPersistentCurrentBlock
} from '@/utils/notifications';
import { pushNotificationManager } from '@/utils/pushNotifications';
import { getCurrentDateString } from '@/utils/time';
import { differenceInMinutes } from 'date-fns';

export function useNotifications() {
  const timeoutIds = useRef<number[]>([]);
  const checklistReminderShown = useRef(false);
  const lightsOutReminderShown = useRef(false);
  const lastScheduledDate = useRef<string | null>(null);
  const schedulingInProgress = useRef(false);
  const lastScheduleTime = useRef<number>(0);
  
  const { 
    currentSchedule, 
    settings
  } = useAppStore();

  // Request permission and initialize push notifications on mount
  useEffect(() => {
    if (settings.notificationsEnabled) {
      const initializeNotifications = async () => {
        await requestNotificationPermission();
        
        // Initialize push notification manager
        const initialized = await pushNotificationManager.initialize();
        if (initialized) {
          console.log('🔔 Push notification manager initialized');
          
          // Ensure we have a push subscription
          const isSubscribed = await pushNotificationManager.isSubscribed();
          if (!isSubscribed) {
            console.log('🔔 Creating push subscription...');
            await pushNotificationManager.subscribe();
          }
        }
      };
      
      initializeNotifications();
    }
  }, [settings.notificationsEnabled]);

  // Schedule notifications when schedule changes
  useEffect(() => {
    if (!settings.notificationsEnabled || !currentSchedule) {
      return;
    }

    // CRITICAL: Only schedule notifications for today's schedule
    // This prevents the bug where browsing other dates clears today's notifications
    const today = getCurrentDateString();
    if (currentSchedule.date !== today) {
      console.log('🔔 Skipping notification scheduling - not today\'s schedule:', currentSchedule.date);
      return;
    }

    // Prevent duplicate scheduling - check BEFORE async function
    if (schedulingInProgress.current) {
      console.log('🔔 Scheduling already in progress, skipping...');
      return;
    }

    // Create a unique key for this schedule state
    const scheduleKey = `${currentSchedule.date}-${currentSchedule.blocks.length}-${settings.earlyWarningMinutes}`;
    if (lastScheduledDate.current === scheduleKey) {
      console.log('🔔 Already scheduled for this exact schedule state, skipping...');
      return;
    }

    // Time-based debounce: prevent scheduling within 1 second of last schedule
    const now = Date.now();
    if (now - lastScheduleTime.current < 1000) {
      console.log('🔔 Scheduling too soon after last schedule, skipping...');
      return;
    }

    // Mark as in progress IMMEDIATELY
    schedulingInProgress.current = true;
    lastScheduledDate.current = scheduleKey;
    lastScheduleTime.current = now;

    const scheduleNotificationsAsync = async () => {
      console.log('🔔 Starting notification scheduling for:', currentSchedule.date);
      // Clear existing notifications (both local and push)
      clearScheduledNotifications(timeoutIds.current);
      timeoutIds.current = [];
      await clearScheduledPushNotifications();
      
      // Get store functions
      const { clearNotifications, saveNotification } = useAppStore.getState();
      await clearNotifications();

      // Schedule new notifications
      const notifications = scheduleBlockNotifications(
        currentSchedule.blocks,
        settings.earlyWarningMinutes,
        currentSchedule.date
      );

      // Save notifications to store
      for (const notification of notifications) {
        await saveNotification(notification);
      }

      console.log('🔔 Attempting to schedule via push system...');
      
      // Try to schedule via push notification system first
      const pushSuccess = await scheduleNotificationsPush(notifications);
      
      if (pushSuccess) {
        console.log('🔔 Successfully scheduled all notifications via push system');
      } else {
        console.log('🔔 Push scheduling failed, falling back to local setTimeout');
        
        // Fallback to local setTimeout scheduling
        const ids = notifications.map(notification => 
          scheduleNotification(notification)
        ).filter(id => id !== -1);

        timeoutIds.current = ids;
      }
      
      schedulingInProgress.current = false;
      console.log('🔔 Notification scheduling complete!');
    };

    scheduleNotificationsAsync();

    return () => {
      clearScheduledNotifications(timeoutIds.current);
      clearScheduledPushNotifications();
      const { clearNotifications } = useAppStore.getState();
      clearNotifications();
      lastScheduledDate.current = null; // Reset so we can reschedule
      schedulingInProgress.current = false;
    };
  }, [currentSchedule, settings.notificationsEnabled, settings.earlyWarningMinutes]);

  // Check for daily reminders
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkReminders = async () => {
      // Checklist reminder at 21:00
      const shouldShowChecklist = await shouldShowChecklistReminder();
      if (shouldShowChecklist && !checklistReminderShown.current) {
        showChecklistReminder();
        checklistReminderShown.current = true;
      }

      // Lights out reminder at 23:30
      if (shouldShowLightsOutReminder() && !lightsOutReminderShown.current) {
        showLightsOutReminder();
        lightsOutReminderShown.current = true;
      }
    };

    // Check immediately
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [settings.notificationsEnabled]);

  // Reset daily reminder flags at midnight
  useEffect(() => {
    const resetFlags = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        checklistReminderShown.current = false;
        lightsOutReminderShown.current = false;
      }
    };

    const interval = setInterval(resetFlags, 60000);
    return () => clearInterval(interval);
  }, []);

  // Manage persistent current block notification
  useEffect(() => {
    if (!settings.notificationsEnabled || !settings.persistentCurrentBlock || !currentSchedule) {
      // Clear persistent notification if feature is disabled
      clearPersistentCurrentBlock();
      return;
    }

    const today = getCurrentDateString();
    if (currentSchedule.date !== today) {
      // Only show for today's schedule
      return;
    }

    const updatePersistent = () => {
      const now = new Date();
      
      // Find current active block
      const currentBlock = currentSchedule.blocks.find(block => 
        now >= block.start && now <= block.end
      );

      if (currentBlock) {
        // Calculate time remaining
        const minutesRemaining = differenceInMinutes(currentBlock.end, now);
        const timeRemaining = minutesRemaining >= 60 
          ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`
          : `${minutesRemaining}m`;
        
        // Show/update persistent notification
        updatePersistentCurrentBlock(currentBlock, timeRemaining);
      } else {
        // No active block, clear persistent notification
        clearPersistentCurrentBlock();
      }
    };

    // Update immediately
    updatePersistent();

    // Update every minute
    const interval = setInterval(updatePersistent, 60000);

    return () => {
      clearInterval(interval);
      clearPersistentCurrentBlock();
    };
  }, [currentSchedule, settings.notificationsEnabled, settings.persistentCurrentBlock]);

  return {
    requestPermission: requestNotificationPermission,
    clearAll: async () => {
      clearScheduledNotifications(timeoutIds.current);
      await clearScheduledPushNotifications();
      const { clearNotifications } = useAppStore.getState();
      clearNotifications();
      await clearPersistentCurrentBlock();
    }
  };
}

