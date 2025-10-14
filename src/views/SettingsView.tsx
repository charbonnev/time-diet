import React from 'react';
import { useAppStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTheme } from '@/components/ThemeProvider';
import { pushNotificationManager } from '@/utils/pushNotifications';
import { Bell, Clock, Download, Check, Server, RefreshCw, Moon, Sun, FileText, Plus, Edit2, Trash2, Upload, FileDown, RotateCcw } from 'lucide-react';
import packageJson from '../../package.json';
import TemplateEditor from '@/components/TemplateEditor';

const SettingsView: React.FC = () => {
  const { settings, updateSettings, templates, removeTemplate, categories, addTemplate, updateTemplate, resetTemplatesToDefault } = useAppStore();
  const { requestPermission } = useNotifications();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const { theme, toggleTheme } = useTheme();
  const [showTemplateEditor, setShowTemplateEditor] = React.useState(false);
  const [editingTemplateId, setEditingTemplateId] = React.useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [importTemplateName, setImportTemplateName] = React.useState('');
  const [importErrors, setImportErrors] = React.useState<string[]>([]);
  const [showDebugNotifications, setShowDebugNotifications] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveTemplate = async (template: any) => {
    if (editingTemplateId) {
      await updateTemplate(template);
    } else {
      await addTemplate(template);
    }
  };

  const handleExportTemplate = async (templateId: string) => {
    const { exportTemplateToCSV, downloadCSV } = await import('@/utils/csv');
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const csvContent = exportTemplateToCSV(template, categories);
    const filename = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleImportClick = () => {
    setImportErrors([]);
    setImportTemplateName('');
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { readFileAsText } = await import('@/utils/csv');
      const csvContent = await readFileAsText(file);
      
      // Extract template name from filename (remove .csv extension)
      const defaultName = file.name.replace(/\.csv$/i, '').replace(/-/g, ' ');
      setImportTemplateName(defaultName);
      
      // Show dialog to confirm name
      setShowImportDialog(true);
      
      // Store the CSV content temporarily
      (window as any).__pendingCSV = csvContent;
    } catch (error) {
      alert('Failed to read file: ' + (error instanceof Error ? error.message : String(error)));
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    const csvContent = (window as any).__pendingCSV;
    if (!csvContent || !importTemplateName.trim()) return;

    try {
      const { importTemplateFromCSV } = await import('@/utils/csv');
      const { template, errors } = importTemplateFromCSV(csvContent, importTemplateName.trim(), categories);
      
      if (errors.length > 0) {
        setImportErrors(errors);
        return;
      }

      if (template) {
        await addTemplate(template);
        setShowImportDialog(false);
        setImportErrors([]);
        delete (window as any).__pendingCSV;
        alert(`✅ Template "${template.name}" imported successfully with ${template.blocks.length} time blocks!`);
      }
    } catch (error) {
      alert('Failed to import template: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleResetTemplates = async () => {
    if (!confirm('⚠️ This will delete ALL templates and restore only the default Challenge Weekday template. This action cannot be undone. Continue?')) {
      return;
    }

    try {
      await resetTemplatesToDefault();
      alert('✅ Templates reset to default successfully!');
    } catch (error) {
      alert('Failed to reset templates: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleNotificationToggle = async () => {
    // Optimistic update for immediate UI feedback
    const newValue = !settings.notificationsEnabled;
    
    if (newValue) {
      const permission = await requestPermission();
      if (permission === 'granted') {
        await updateSettings({ notificationsEnabled: true });
      } else {
        alert('Notification permission is required to enable notifications.');
        return; // Don't update if permission denied
      }
    } else {
      await updateSettings({ notificationsEnabled: false });
    }
  };

  const handleEarlyWarningChange = async (minutes: number) => {
    await updateSettings({ earlyWarningMinutes: minutes });
  };

  const handleSoundProfileChange = async (profile: 'default' | 'silent' | 'vibrate') => {
    await updateSettings({ soundProfile: profile });
  };

  const handleRefreshSubscription = async () => {
    console.log('🔄 Refreshing push subscription...');
    
    try {
      // First clear any scheduled notifications to avoid orphaned notifications
      console.log('🔄 Clearing scheduled notifications before refresh...');
      await pushNotificationManager.clearScheduledNotifications();
      
      // First unsubscribe from any existing subscription
      const unsubscribed = await pushNotificationManager.unsubscribe();
      console.log('🔄 Unsubscribed from existing subscription:', unsubscribed);
      
      // Wait a moment for the unsubscription to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a fresh subscription
      const subscriptionData = await pushNotificationManager.subscribe();
      
      if (subscriptionData) {
        console.log('🔄 Fresh subscription created successfully!');
        
        // Trigger a re-schedule of notifications with the new subscription
        console.log('🔄 Triggering notification rescheduling...');
        const { currentSchedule, settings } = useAppStore.getState();
        if (settings.notificationsEnabled && currentSchedule) {
          // Import the notification functions
          const { scheduleBlockNotifications, scheduleNotificationsPush } = await import('@/utils/notifications');
          
          // Generate and schedule notifications with the new subscription
          const notifications = scheduleBlockNotifications(
            currentSchedule.blocks,
            settings.earlyWarningMinutes
          );
          
          if (notifications.length > 0) {
            const success = await scheduleNotificationsPush(notifications);
            console.log('🔄 Rescheduled notifications with new subscription:', success);
          }
        }
        
        alert('✅ Push subscription refreshed successfully! All scheduled notifications have been updated with the new subscription.');
      } else {
        console.error('🔄 Failed to create fresh subscription');
        alert('❌ Failed to refresh push subscription. Check console for details.');
      }
    } catch (error) {
      console.error('🔄 Error refreshing subscription:', error);
      alert('❌ Error refreshing subscription: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleTestNotification = async () => {
    console.log('🔔 Testing notification...');
    
    if (!('Notification' in window)) {
      alert('❌ Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'denied') {
      alert('❌ Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('❌ Notification permission denied.');
        return;
      }
    }

    try {
      console.log('🔔 Creating notification...');
      
      // Try Service Worker approach first (required for mobile PWAs)
      if ('serviceWorker' in navigator) {
        console.log('🔔 Service Worker available');
        
        try {
          // Check for existing registrations
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('🔔 Existing registrations:', registrations.length);
          
          let registration;
          if (registrations.length > 0) {
            registration = registrations[0];
            console.log('🔔 Using existing registration');
          } else {
            console.log('🔔 Registering Service Worker...');
            registration = await navigator.serviceWorker.register('/sw-push.js');
            await navigator.serviceWorker.ready;
            console.log('🔔 Service Worker registered');
          }
          
          // Use Service Worker notification
          await registration.showNotification('🎯 Time Diet Test', {
            body: 'This is how your notifications will look and sound! 🔊',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'test-notification',
            requireInteraction: false,
            silent: false
          });
          
          console.log('🔔 Service Worker notification sent successfully!');
          
        } catch (swError) {
          console.error('🔔 Service Worker failed:', swError);
          console.log('🔔 Falling back to direct API...');
          
          // Fallback to direct notification
          new Notification('🎯 Time Diet Test', {
            body: 'This is how your notifications will look and sound! 🔊',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'test-notification',
            requireInteraction: false,
            silent: false
          });
          console.log('🔔 Direct notification created as fallback');
        }
        
      } else {
        console.log('🔔 Using direct Notification API');
        
        // Fallback to direct notification for non-PWA contexts
        const notification = new Notification('🎯 Time Diet Test', {
          body: 'This is how your notifications will look and sound! 🔊',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'test-notification',
          requireInteraction: false,
          silent: false // This ensures sound plays
        });

        console.log('🔔 Direct notification created:', notification);

        // Handle notification events
        notification.onclick = () => {
          console.log('🔔 Notification clicked');
          notification.close();
          window.focus(); // Bring the app to focus
        };

        notification.onshow = () => {
          console.log('🔔 Notification shown');
        };

        notification.onerror = (error) => {
          console.error('🔔 Notification error:', error);
        };

        // Auto-close after 8 seconds
        setTimeout(() => {
          console.log('🔔 Auto-closing notification');
          notification.close();
        }, 8000);
      }

      // Also try to play a system sound
      try {
        // Create an audio context to play a beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // 800Hz tone
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        console.log('🔊 Custom sound played');
      } catch (error) {
        console.log('🔊 Could not play custom sound:', error);
      }

      // Show a temporary in-app notification as well
      alert('🔔 Test notification sent! Check your system notifications (top-right corner on Windows/Linux, top-right on Mac).');
      
    } catch (error) {
      console.error('🔔 Error creating notification:', error);
      alert('❌ Error creating notification: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleDelayedTestNotification = async () => {
    console.log('⏰ Setting up delayed notification test...');
    
    if (!('Notification' in window)) {
      alert('❌ Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'denied') {
      alert('❌ Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('❌ Notification permission denied.');
        return;
      }
    }

    // Show confirmation and start countdown
    alert('⏰ Background notification test started! Put the app in the background now. Notification will appear in 10 seconds.');
    
    // Set up the delayed notification
    setTimeout(async () => {
      try {
        console.log('⏰ Sending delayed notification...');
        
        // Try Service Worker approach first (required for mobile PWAs)
        if ('serviceWorker' in navigator) {
          console.log('⏰ Service Worker available');
          
          try {
            // Check for existing registrations
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log('⏰ Existing registrations:', registrations.length);
            
            let registration;
            if (registrations.length > 0) {
              registration = registrations[0];
              console.log('⏰ Using existing registration');
            } else {
              console.log('⏰ Registering Service Worker...');
              registration = await navigator.serviceWorker.register('/sw-push.js');
              await navigator.serviceWorker.ready;
              console.log('⏰ Service Worker registered');
            }
            
            // Use Service Worker notification
            await registration.showNotification('🎯 Time Diet - Background Test', {
              body: 'This notification appeared while the app was in the background! 🚀',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: 'background-test-notification',
              requireInteraction: true, // Keep it visible longer for testing
              silent: false
            });
            
            console.log('⏰ Background Service Worker notification sent successfully!');
            
          } catch (swError) {
            console.error('⏰ Service Worker failed:', swError);
            console.log('⏰ Falling back to direct API...');
            
            // Fallback to direct notification
            new Notification('🎯 Time Diet - Background Test', {
              body: 'This notification appeared while the app was in the background! 🚀',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: 'background-test-notification',
              requireInteraction: true,
              silent: false
            });
            console.log('⏰ Direct background notification created as fallback');
          }
          
        } else {
          console.log('⏰ Using direct Notification API');
          
          // Fallback to direct notification for non-PWA contexts
          const notification = new Notification('🎯 Time Diet - Background Test', {
            body: 'This notification appeared while the app was in the background! 🚀',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'background-test-notification',
            requireInteraction: true,
            silent: false
          });

          console.log('⏰ Direct background notification created:', notification);

          // Handle notification events
          notification.onclick = () => {
            console.log('⏰ Background notification clicked');
            notification.close();
            window.focus(); // Bring the app to focus
          };

          notification.onshow = () => {
            console.log('⏰ Background notification shown');
          };

          notification.onerror = (error) => {
            console.error('⏰ Background notification error:', error);
          };
        }

        // Also try to play a system sound
        try {
          // Create an audio context to play a beep sound
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 1000; // 1000Hz tone (higher pitch for background test)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.7);
          
          console.log('🔊 Background test sound played');
        } catch (error) {
          console.log('🔊 Could not play background test sound:', error);
        }
        
      } catch (error) {
        console.error('⏰ Error creating background notification:', error);
      }
    }, 10000); // 10 seconds delay
  };

  const handlePushServerTest = async () => {
    console.log('🚀 Testing push server notification...');
    
    try {
      // Diagnostic information
      console.log('🔍 DIAGNOSTIC INFO:');
      console.log('🔍 User Agent:', navigator.userAgent);
      console.log('🔍 Platform:', navigator.platform);
      console.log('🔍 Service Worker support:', 'serviceWorker' in navigator);
      console.log('🔍 Push Manager support:', 'PushManager' in window);
      console.log('🔍 Notification support:', 'Notification' in window);
      console.log('🔍 Current permission:', Notification.permission);
      
      // First, ensure we're subscribed to push notifications
      const permission = await pushNotificationManager.requestPermission();
      if (permission !== 'granted') {
        alert('❌ Push notification permission denied. Please allow notifications to test the push server.');
        return;
      }

      // Initialize and subscribe to push notifications
      const initialized = await pushNotificationManager.initialize();
      if (!initialized) {
        alert('❌ Failed to initialize push notifications. Please check your connection.');
        return;
      }

      const subscription = await pushNotificationManager.subscribe();
      if (!subscription) {
        alert('❌ Failed to subscribe to push notifications. Please try again.');
        return;
      }

      console.log('🚀 Subscribed to push notifications, sending test...');

      // Give user time to close the app
      alert('🚀 Push server test will be sent in 10 seconds! Close the app now to test background notifications. Check browser console for detailed logs.');
      
      setTimeout(async () => {
        try {
          // Send test notification through the push server
          const success = await pushNotificationManager.sendTestNotification(
            '🚀 Push Server Test',
            'This notification came from your Railway server! It works even when the app is closed. 🎉'
          );

          if (success) {
            console.log('🚀 Push server test sent successfully!');
          } else {
            console.error('❌ Failed to send push server test.');
          }
        } catch (delayedError) {
          console.error('🚀 Delayed push server test error:', delayedError);
        }
      }, 10000);

    } catch (error) {
      console.error('🚀 Push server test error:', error);
      alert('❌ Push server test failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleBulkSchedulingTest = async () => {
    console.log('📅 Testing bulk scheduling system...');
    
    try {
      // Ensure we're subscribed to push notifications
      const permission = await pushNotificationManager.requestPermission();
      if (permission !== 'granted') {
        alert('❌ Push notification permission denied. Please allow notifications to test bulk scheduling.');
        return;
      }

      const initialized = await pushNotificationManager.initialize();
      if (!initialized) {
        alert('❌ Failed to initialize push notifications.');
        return;
      }

      const subscription = await pushNotificationManager.subscribe();
      if (!subscription) {
        alert('❌ Failed to subscribe to push notifications.');
        return;
      }

      // Create test notifications scheduled for the next few minutes
      const now = new Date();
      const testNotifications = [
        {
          id: 'test-1',
          title: '📅 Bulk Test 1',
          body: 'First test notification (30 seconds)',
          scheduledTime: new Date(now.getTime() + 30000), // 30 seconds
          blockId: 'test-block-1'
        },
        {
          id: 'test-2',
          title: '📅 Bulk Test 2',
          body: 'Second test notification (60 seconds)',
          scheduledTime: new Date(now.getTime() + 60000), // 60 seconds
          blockId: 'test-block-2'
        },
        {
          id: 'test-3',
          title: '📅 Early Warning Test',
          body: 'Early warning test (90 seconds)',
          scheduledTime: new Date(now.getTime() + 90000), // 90 seconds
          blockId: 'test-block-3',
          isEarlyWarning: true
        }
      ];

      console.log('📅 Scheduling test notifications:', testNotifications);
      
      const success = await pushNotificationManager.scheduleBulkNotifications(testNotifications);
      
      if (success) {
        alert('✅ Bulk scheduling test successful! You should receive 3 notifications in the next 90 seconds. Check console and server logs for details.');
        console.log('📅 Bulk scheduling test completed successfully');
      } else {
        alert('❌ Bulk scheduling test failed. Check console for details.');
        console.error('📅 Bulk scheduling test failed');
      }

    } catch (error) {
      console.error('📅 Bulk scheduling test error:', error);
      alert('❌ Bulk scheduling test failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleInstallClick = async () => {
    const success = await installApp();
    if (!success && isInstallable) {
      alert('Installation failed. Please try again.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h2>
      
      {/* Appearance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          {theme === 'dark' ? <Moon className="w-5 h-5 mr-2" /> : <Sun className="w-5 h-5 mr-2" />}
          Appearance
        </h3>
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h3>
        
        {/* Enable/Disable Notifications */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Enable Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when time blocks start</p>
          </div>
          <button
            onClick={handleNotificationToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Debug Notifications Section */}
        {settings.notificationsEnabled && (
          <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowDebugNotifications(!showDebugNotifications)}
              className="flex items-center justify-between w-full mb-3"
            >
              <div className="flex items-center">
                <Server className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Debug Notifications</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {showDebugNotifications ? '▼' : '▶'}
              </span>
            </button>
            
            {showDebugNotifications && (
              <div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <button
                    onClick={handleTestNotification}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Test Now
                  </button>
                  <button
                    onClick={handleDelayedTestNotification}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Test in 10s
                  </button>
                  <button
                    onClick={handlePushServerTest}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Server className="w-4 h-4" />
                    Test Push Server
                  </button>
                  <button
                    onClick={handleRefreshSubscription}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Subscription
                  </button>
                  <button
                    onClick={handleBulkSchedulingTest}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Test Bulk Scheduling
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  "Test Now" = Local notification • "Test in 10s" = Background test • "Test Push Server" = Railway server (works when app is closed) • "Refresh Subscription" = Fix stale push subscriptions • "Test Bulk Scheduling" = Test the new system that schedules multiple notifications
                </p>
              </div>
            )}
          </div>
        )}

        {/* Early Warning */}
        {settings.notificationsEnabled && (
          <div className="mb-4">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Early Warning
            </p>
            <div className="flex space-x-2">
              {[0, 5].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => handleEarlyWarningChange(minutes)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.earlyWarningMinutes === minutes
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {minutes === 0 ? 'None' : `${minutes} min`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sound Profile */}
        {settings.notificationsEnabled && (
          <div className="mb-4">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sound Profile</p>
            <div className="flex space-x-2">
              {[
                { value: 'default', label: 'Default' },
                { value: 'silent', label: 'Silent' },
                { value: 'vibrate', label: 'Vibrate' }
              ].map(profile => (
                <button
                  key={profile.value}
                  onClick={() => handleSoundProfileChange(profile.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.soundProfile === profile.value
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Correction Mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Correction Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Allow browsing and editing past dates in Today/Checklist tabs</p>
          </div>
          <button
            onClick={() => updateSettings({ correctionMode: !settings.correctionMode })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              settings.correctionMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.correctionMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Debug Mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Debug Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Show test notification buttons in timeblock cards</p>
          </div>
          <button
            onClick={() => updateSettings({ debugMode: !settings.debugMode })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              settings.debugMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.debugMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Templates Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Templates
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Manage your schedule templates. Create custom templates or edit existing ones.
        </p>
        
        {/* Template List */}
        <div className="space-y-2 mb-4">
          {templates.map(template => (
            <div 
              key={template.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-700"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {template.name}
                  {template.isDefault && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {template.blocks.length} time blocks
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportTemplate(template.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white text-sm rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  title="Export as CSV"
                >
                  <FileDown className="w-4 h-4" />
                  Export
                </button>
                
                <button
                  onClick={() => {
                    setEditingTemplateId(template.id);
                    setShowTemplateEditor(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                
                {!template.isDefault && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete template "${template.name}"?`)) {
                        await removeTemplate(template.id);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 dark:bg-red-700 text-white text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Template Management Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => {
              setEditingTemplateId(null);
              setShowTemplateEditor(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Template
          </button>
          
          <button
            onClick={handleImportClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Import from CSV
          </button>
          
          <button
            onClick={handleResetTemplates}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset to Default
          </button>
        </div>
        
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* PWA Installation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Install App</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Install Time Diet as a PWA for the best experience. You can access it from your home screen and use it offline.
        </p>
        {isInstalled ? (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <Check className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">App is installed</span>
          </div>
        ) : isInstallable ? (
          <button 
            onClick={handleInstallClick}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Install App
          </button>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Installation not available. Try opening this app in Chrome or Edge.
          </p>
        )}
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">About</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Time Diet v{packageJson.version}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          A structured routine manager with time blocks and ADHD-friendly features.
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>✅ PWA with offline support</p>
          <p>🔔 Push notifications via Railway</p>
          <p>📱 Mobile-optimized interface</p>
          <p>🚀 Deployed on Vercel</p>
        </div>
      </div>

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <TemplateEditor
          template={editingTemplateId ? templates.find(t => t.id === editingTemplateId) || null : null}
          categories={categories}
          onSave={handleSaveTemplate}
          onClose={() => {
            setShowTemplateEditor(false);
            setEditingTemplateId(null);
          }}
        />
      )}

      {/* Import Template Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              Import Template from CSV
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={importTemplateName}
                onChange={(e) => setImportTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="My Custom Template"
              />
            </div>

            {importErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Import Errors:
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                  {importErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportErrors([]);
                  delete (window as any).__pendingCSV;
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importTemplateName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

