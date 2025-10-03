import React from 'react';
import { useAppStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { pushNotificationManager } from '@/utils/pushNotifications';
import { Bell, Clock, Download, Check, Server, RefreshCw } from 'lucide-react';
import packageJson from '../../package.json';

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const { requestPermission } = useNotifications();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

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
      // First unsubscribe from any existing subscription
      const unsubscribed = await pushNotificationManager.unsubscribe();
      console.log('🔄 Unsubscribed from existing subscription:', unsubscribed);
      
      // Wait a moment for the unsubscription to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a fresh subscription
      const subscriptionData = await pushNotificationManager.subscribe();
      
      if (subscriptionData) {
        console.log('🔄 Fresh subscription created successfully!');
        alert('✅ Push subscription refreshed successfully! Try the push server test now.');
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

  const handleInstallClick = async () => {
    const success = await installApp();
    if (!success && isInstallable) {
      alert('Installation failed. Please try again.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>
      
      {/* Notifications Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications
        </h3>
        
        {/* Enable/Disable Notifications */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-700">Enable Notifications</p>
            <p className="text-sm text-gray-500">Get notified when time blocks start</p>
          </div>
          <button
            onClick={handleNotificationToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Test Notification */}
        {settings.notificationsEnabled && (
          <div className="mb-4">
            <div className="flex gap-2 mb-2 flex-wrap">
              <button
                onClick={handleTestNotification}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Test Now
              </button>
              <button
                onClick={handleDelayedTestNotification}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Test in 10s
              </button>
              <button
                onClick={handlePushServerTest}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors"
              >
                <Server className="w-4 h-4" />
                Test Push Server
              </button>
              <button
                onClick={handleRefreshSubscription}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Subscription
              </button>
            </div>
            <p className="text-xs text-gray-500">
              "Test Now" = Local notification • "Test in 10s" = Background test • "Test Push Server" = Railway server (works when app is closed) • "Refresh Subscription" = Fix stale push subscriptions
            </p>
          </div>
        )}

        {/* Early Warning */}
        {settings.notificationsEnabled && (
          <div className="mb-4">
            <p className="font-medium text-gray-700 mb-2 flex items-center">
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
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
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
          <div>
            <p className="font-medium text-gray-700 mb-2">Sound Profile</p>
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
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PWA Installation */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Install App</h3>
        <p className="text-sm text-gray-600 mb-3">
          Install Time Diet as a PWA for the best experience. You can access it from your home screen and use it offline.
        </p>
        {isInstalled ? (
          <div className="flex items-center text-green-600">
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
          <p className="text-sm text-gray-500">
            Installation not available. Try opening this app in Chrome or Edge.
          </p>
        )}
      </div>

      {/* About */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">About</h3>
        <p className="text-sm text-gray-600 mb-2">
          Time Diet v{packageJson.version}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          A structured routine manager with time blocks and ADHD-friendly features.
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>✅ PWA with offline support</p>
          <p>🔔 Push notifications via Railway</p>
          <p>📱 Mobile-optimized interface</p>
          <p>🚀 Deployed on Vercel</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

