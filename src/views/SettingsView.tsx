import React from 'react';
import { useAppStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Bell, BellOff, Clock, Download, Check } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const { requestPermission } = useNotifications();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      const permission = await requestPermission();
      if (permission === 'granted') {
        await updateSettings({ notificationsEnabled: true });
      } else {
        alert('Notification permission is required to enable notifications.');
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
          Time Diet v1.0.0
        </p>
        <p className="text-sm text-gray-600">
          A structured routine manager with time blocks and ADHD-friendly features.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;

