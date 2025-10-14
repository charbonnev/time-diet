import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2 } from 'lucide-react';
import './App.css';
import MainLayout from '@/components/layout/MainLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import TodayView from '@/views/TodayView';
import CalendarView from '@/views/CalendarView';
import ChecklistView from '@/views/ChecklistView';
import SettingsView from '@/views/SettingsView';

function App() {
  const {
    isLoading,
    error,
    initializeApp
  } = useAppStore();

  // Initialize notifications
  useNotifications();

  useEffect(() => {
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading Time Diet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h2 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<TodayView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/checklist" element={<ChecklistView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;

