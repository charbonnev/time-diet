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
  showLightsOutReminder
} from '@/utils/notifications';
import { pushNotificationManager } from '@/utils/pushNotifications';

export function useNotifications() {
  const timeoutIds = useRef<number[]>([]);
  const checklistReminderShown = useRef(false);
  const lightsOutReminderShown = useRef(false);
  
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

    const scheduleNotificationsAsync = async () => {
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
        settings.earlyWarningMinutes
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
    };

    scheduleNotificationsAsync();

    return () => {
      clearScheduledNotifications(timeoutIds.current);
      clearScheduledPushNotifications();
      const { clearNotifications } = useAppStore.getState();
      clearNotifications();
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

  return {
    requestPermission: requestNotificationPermission,
    clearAll: async () => {
      clearScheduledNotifications(timeoutIds.current);
      await clearScheduledPushNotifications();
      const { clearNotifications } = useAppStore.getState();
      clearNotifications();
    }
  };
}

