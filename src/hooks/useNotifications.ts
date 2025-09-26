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
    notificationQueue,
    saveNotification,
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

    // Clear existing notifications
    clearScheduledNotifications(timeoutIds.current);
    timeoutIds.current = [];

    // Schedule new notifications
    const notifications = scheduleBlockNotifications(
      currentSchedule.blocks,
      settings.earlyWarningMinutes
    );

    // Save to store
    notifications.forEach(notification => {
      saveNotification(notification);
    });

    // Schedule with setTimeout
    const ids = notifications.map(notification => 
      scheduleNotification(notification)
    ).filter(id => id !== -1);

    timeoutIds.current = ids;

    return () => {
      clearScheduledNotifications(timeoutIds.current);
    };
  }, [currentSchedule, settings.notificationsEnabled, settings.earlyWarningMinutes, saveNotification]);

  // Check for daily reminders
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkReminders = () => {
      // Checklist reminder at 21:00
      if (shouldShowChecklistReminder() && !checklistReminderShown.current) {
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

