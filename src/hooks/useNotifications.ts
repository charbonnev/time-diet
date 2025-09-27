import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import {
  requestNotificationPermission,
  scheduleBlockNotifications,
  scheduleNotification,
  clearScheduledNotifications,
  shouldShowChecklistReminder,
  shouldShowLightsOutReminder,
  showChecklistReminder,
  showLightsOutReminder
} from '@/utils/notifications';

export function useNotifications() {
  const timeoutIds = useRef<number[]>([]);
  const checklistReminderShown = useRef(false);
  const lightsOutReminderShown = useRef(false);
  
  const { 
    currentSchedule, 
    settings, 
    saveNotification,
    scheduleNotifications,
    clearNotifications
  } = useAppStore();

  // Request permission on mount
  useEffect(() => {
    if (settings.notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [settings.notificationsEnabled]);

  // Schedule notifications when schedule changes
  useEffect(() => {
    if (!settings.notificationsEnabled || !currentSchedule) {
      return;
    }

    const scheduleNotificationsAsync = async () => {
      // Clear existing notifications
      clearScheduledNotifications(timeoutIds.current);
      timeoutIds.current = [];
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

      // Use the store's scheduleNotifications function if it exists
      if (scheduleNotifications) {
        await scheduleNotifications();
      }

      // Schedule with setTimeout
      const ids = notifications.map(notification => 
        scheduleNotification(notification)
      ).filter(id => id !== -1);

      timeoutIds.current = ids;
    };

    scheduleNotificationsAsync();

    return () => {
      clearScheduledNotifications(timeoutIds.current);
      clearNotifications();
    };
  }, [currentSchedule, settings.notificationsEnabled, settings.earlyWarningMinutes, saveNotification, scheduleNotifications, clearNotifications]);

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
    clearAll: () => {
      clearScheduledNotifications(timeoutIds.current);
      clearNotifications();
    }
  };
}

