# Time Diet - Structured Routine Manager

**Version 1.2.2** | **Live at**: [time-diet.vercel.app](https://time-diet.vercel.app)

A comprehensive Progressive Web App (PWA) for managing time blocks, tracking daily routines, and building productive habits with ADHD-friendly features.

## 🌟 Features

### Core Functionality
- **Time Blocking**: Structured 15-minute time blocks from 07:30 to 23:30
- **Daily Templates**: Pre-built Challenge Weekday template with 31 optimized time blocks
- **Smart Notifications**: Automatic reminders for time blocks with optional early warnings
- **Progress Tracking**: Daily checklist with success rate calculation (96 points/day target)
- **Category System**: Color-coded categories for different types of activities

### PWA Features
- **Offline Support**: Full functionality without internet connection
- **Installable**: Add to home screen on mobile devices
- **Web Push Notifications**: Server-side push notifications that work even when app is closed
- **Local Notifications**: Immediate notifications for active sessions
- **Responsive Design**: Optimized for mobile and desktop
- **Production Ready**: Deployed on Vercel with Railway push server

### Data Visualization
- **Calendar View**: Month calendar with success rate indicators
- **Progress Charts**: Pie charts and bar charts for daily and weekly progress
- **Category Breakdown**: Visual breakdown of time spent per category
- **Streak Tracking**: 7-day progress visualization

### ADHD-Friendly Design
- **Clear Visual Hierarchy**: Easy-to-scan interface with color coding
- **Large Touch Targets**: Accessible buttons and controls
- **Immediate Feedback**: Visual confirmation for completed tasks
- **Structured Routine**: Consistent daily schedule to build habits

## 📋 Changelog

### Version 1.2.1 (2025-01-03)
**🐛 Bug Fixes & Architecture Improvements**
- **Fixed critical notification bug**: Notifications now only schedule for today's schedule, preventing them from being cleared when browsing other dates
- **New Day Detail Modal**: Double-tap calendar dates to view detailed statistics and time blocks for past/future days
- **Improved app architecture**: "Today" tab now always shows today only, with separate modal for historical review
- **Fixed SPA routing**: Added Vercel configuration to prevent 404 errors on page refresh
- **Cleaner state management**: Removed global `currentDate` state in favor of local date handling

### Version 1.2.0 (2025-01-03)
**🚀 MAJOR ENHANCEMENT: Bulletproof Push Notifications**
- **All notifications now use push notification system** that works even when app is closed
- **Enhanced notification reliability** for time blocks, early warnings, checklist reminders, and lights out notifications
- **Improved subscription management** with proper cleanup and rescheduling when refreshing push subscriptions
- **New bulk scheduling system** on the push server for better performance and reliability
- **Added test functionality** for bulk scheduling system in Settings
- **Server-side notification management** with proper cleanup and error handling

### Version 1.1.0 (Previous)
- Initial PWA implementation with basic push notifications
- Core time blocking and scheduling functionality
- Daily checklist and progress tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-diet
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
pnpm run build
pnpm run preview
```

## 📱 Usage

### First Time Setup
1. Open the app in your browser
2. Click "Apply Default Template" to load the Challenge Weekday schedule
3. Navigate to Settings to enable notifications
4. Install the PWA for the best experience

### Daily Workflow
1. **Morning**: Check today's schedule in the Today view
2. **Throughout Day**: Receive notifications for each time block
3. **Evening**: Complete the daily checklist in the Checklist view
4. **Review**: Check progress in the Calendar view

### Navigation
- **Today**: Current day's schedule with timeline view
- **Calendar**: Month view with success indicators
- **Checklist**: Daily task completion and progress charts
- **Settings**: Notification controls and PWA installation

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Storage**: IndexedDB (via idb)
- **Charts**: Recharts
- **PWA**: Vite PWA Plugin
- **Icons**: Lucide React

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components
│   └── Timeline.tsx    # Timeline component
├── hooks/              # Custom React hooks
│   ├── useNotifications.ts
│   └── usePWAInstall.ts
├── store/              # Zustand store
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── checklist.ts    # Checklist calculations
│   ├── defaults.ts     # Default data
│   ├── notifications.ts # Notification utilities
│   ├── points.ts       # Points calculations
│   ├── storage.ts      # IndexedDB operations
│   └── time.ts         # Time utilities
└── views/              # Main view components
    ├── CalendarView.tsx
    ├── ChecklistView.tsx
    ├── SettingsView.tsx
    └── TodayView.tsx
```

### Data Models
- **TimeBlock**: Individual time block definition
- **TimeBlockInstance**: Scheduled time block with dates
- **Schedule**: Collection of time blocks for a day
- **Template**: Reusable schedule template
- **Checklist**: Daily task completion tracking
- **Category**: Activity categorization with colors

## 🔧 Configuration

### Notification Settings
- **Enable/Disable**: Toggle notifications in Settings
- **Early Warning**: 0 or 5-minute advance notifications
- **Sound Profile**: Default, Silent, or Vibrate

### PWA Installation
- **Chrome/Edge**: Install button appears automatically
- **iOS Safari**: Use "Add to Home Screen" from share menu
- **Android Chrome**: Install prompt or "Add to Home Screen"

## 📊 Data Management

### Storage
- **Local Storage**: App settings and preferences
- **IndexedDB**: Schedules, checklists, and templates
- **Offline First**: All data stored locally for offline access

### Data Export
- **CSV Export**: Daily and weekly progress data
- **JSON Export**: Complete app data backup
- **Import**: Restore from JSON backup

## 🎯 Challenge Weekday Template

The default template includes 31 time blocks optimized for productivity:

- **07:30-07:40**: Exercise (10 min)
- **07:40-08:30**: Meals/Hygiene (50 min)
- **08:30-08:45**: Admin (15 min)
- **08:45-09:35**: Deep Work — Focus Block 1 (50 min)
- **09:35-09:45**: Leisure (10 min)
- **09:45-10:35**: Deep Work — Focus Block 2 (50 min)
- **10:35-10:50**: Exercise (15 min)
- **10:50-11:40**: Admin (50 min)
- **11:40-12:00**: Leisure (20 min)
- **12:00-12:40**: Meals/Hygiene (40 min)
- **12:40-13:00**: Leisure (20 min)
- **13:00-13:50**: Deep Work — Focus Block 3 (50 min)
- **13:50-14:00**: Leisure (10 min)
- **14:00-14:50**: Deep Work — Focus Block 4 (50 min)
- **14:50-15:10**: Exercise (20 min)
- **15:10-16:00**: Errands/Chores (50 min)
- **16:00-16:50**: Buffer (50 min)
- **16:50-17:10**: Exercise (20 min)
- **17:10-18:10**: Meals/Hygiene (60 min)
- **18:10-19:10**: Leisure (60 min)
- **19:10-19:40**: Admin (30 min)
- **19:40-20:10**: Errands/Chores (30 min)
- **20:10-21:00**: Buffer (50 min)
- **21:00-21:20**: Admin (20 min)
- **21:20-22:00**: Buffer (40 min)
- **22:00-22:20**: Meals/Hygiene (20 min)
- **22:20-23:30**: Buffer (70 min)

## 🧪 Testing

### Manual Testing Checklist
- [ ] PWA installation works on mobile
- [ ] Notifications appear at correct times
- [ ] Offline functionality works
- [ ] Data persists between sessions
- [ ] All views render correctly
- [ ] Touch targets are accessible

### Performance
- **Lighthouse Score**: 90+ for all metrics
- **Bundle Size**: ~750KB (gzipped ~216KB)
- **Load Time**: <2s on 3G connection

## 🚀 Deployment

### Static Hosting
The app can be deployed to any static hosting service:

```bash
pnpm run build
# Deploy the dist/ folder
```

### Recommended Platforms
- **Vercel**: Automatic deployments from Git
- **Netlify**: Easy drag-and-drop deployment
- **GitHub Pages**: Free hosting for public repos
- **Firebase Hosting**: Google's hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **ADHD Community**: For feedback on time management needs
- **React Team**: For the excellent React framework
- **Vite Team**: For the fast build tool
- **Tailwind CSS**: For the utility-first CSS framework

---

**Time Diet** - Take control of your time, one block at a time. 🕐

