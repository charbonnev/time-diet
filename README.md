# Time Diet - Structured Routine Manager

**Version 1.9.0** | **Live at**: [time-diet.vercel.app](https://time-diet.vercel.app)

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

### Version 1.9.0 (2025-10-17)
**🔥 NEW FEATURE: Challenge/Streak System**

**Track Your Consistency:**
- 🔥 **Streak tracking** - see your current streak and longest streak
- 📊 **Visual Challenge card** - compact display in Calendar view
- 🎯 **Configurable threshold** - set your own success rate (default 75%)
- 💪 **Motivational messages** - dynamic encouragement based on your progress
- 📱 **Mobile-optimized** - compact layout fits perfectly on phone screens

**What It Shows:**
- Current streak (consecutive days meeting your threshold)
- Longest streak (your personal record!)
- Total successful days
- Motivational message to keep you going

**Technical Details:**
- Smart streak calculation from checklist history
- Configurable success threshold in Settings
- Efficient async loading from IndexedDB
- Beautiful gradient card with fire emoji 🔥

**Result:** Visual motivation to maintain your daily routine and build lasting habits!

### Version 1.8.0 (2025-01-16)
**🎯 GROUNDBREAKING FEATURE: Custom Checklist System**

**Define Your Own Goals:**
- ✨ **Fully customizable checklists** - create goals that match YOUR life
- 📊 **Boolean goals** - simple yes/no checkmarks (e.g., "Did exercise", "Meditated")
- 🎯 **Count-based goals** - track how many times you completed something (e.g., "Deep Focus (3/4)")
- 🔧 **Smart rules** - filter by title contains + category (e.g., count all "Focus" blocks in Deep Work category)
- 💾 **Persistent** - your custom checklist is saved and synced across all views
- 🎨 **Beautiful UI** - intuitive checklist editor with live rule preview

**Why This Changes Everything:**
- No longer locked to Charlie's specific goals!
- Adapt Time Diet to ANY routine, ANY lifestyle
- Track exercise sessions, reading time, meditation, calls with friends - anything!
- Mix boolean and count goals for maximum flexibility
- Success rate automatically adjusts to your goal count

**Technical Excellence:**
- Dynamic evaluation engine for rule-based counting
- Backward compatible with existing checklists
- Fully integrated with calendar, streaks, and success tracking

### Version 1.6.0 (2025-01-14)
**🎯 MAJOR ADHD FEATURE: Persistent Current Block Notification**

**The Ultimate Doomscroll Defense:**
- 📢 **Sticky notification** showing your current active timeblock
- ⏰ **Time remaining** updates every minute
- 🔒 **Always visible** - can't be swiped away (Android)
- 📱 **Lock screen display** - see it even when phone is locked
- 🧠 **External working memory** - constant reminder of your intention

**Perfect for ADHD:**
- Pull down notifications → see "Deep Work - 35m left" → snap back to focus!
- No need to remember what you should be doing
- Visual anchor to prevent doomscrolling blackholes
- Maintains time awareness throughout the day

**How It Works:**
- Enable in Settings: "Persistent Current Block"
- Automatically shows when a block starts
- Updates time remaining every minute
- Clears when block ends or is completed
- Action buttons: Complete or Open App

**Platform Support:**
- ✅ **Android**: Perfect! Shows on lock screen + notification shade
- ✅ **Desktop**: Shows in notification center/system tray
- ⚠️ **iOS**: Limited (Apple restrictions)

**Technical Implementation:**
- Uses `requireInteraction: true` for persistence
- Silent updates (no sound/vibration)
- Unique tag prevents duplicates
- Integrates with existing notification actions

**Result:** A game-changing ADHD tool that keeps you anchored to your schedule!

### Version 1.5.4 (2025-01-14)
**🎯 MAJOR IMPROVEMENT: Smart Debug Test Buttons**

**Test Buttons Now Use REAL Smart-Merge Logic:**
- Debug test buttons now call the actual `scheduleBlockNotifications()` logic!
- Early Warning button correctly shows:
  - "Wrap up: [Current Block]" + "Next: [Next Block]" for contiguous blocks
  - "Coming up: [Block]" for non-contiguous blocks
- Tests the EXACT same code path as production notifications
- Always stays in sync with production behavior

**Technical Implementation:**
- Test function receives full blocks array and settings
- Analyzes block relationships (contiguous vs non-contiguous)
- Generates notifications using Smart-Merge decision tree
- True end-to-end testing of notification system

**Benefits:**
- ✅ Accurate testing of Smart-Merge behavior
- ✅ Catches bugs before they reach production
- ✅ Tests automatically update when logic changes
- ✅ No more confusion about what notifications will look like

**Result:** Debug buttons are now a reliable testing tool!

### Version 1.5.3 (2025-01-14)
**🐛 BUG FIXES: Snooze & UI Cleanup**

**Fixed Snooze from Notifications:**
- Snooze button in notifications now actually snoozes the block!
- Previously only logged the action, now calls `snoozeBlock()` properly
- Loads the correct date schedule before snoozing
- Notifications automatically reschedule after snooze

**UI Cleanup:**
- Removed "Refresh Subscription" button from Settings
- Toggling notifications off/on has the same effect (cleaner UX)
- Updated help text to reflect this
- Removed unused code and imports

**Result:** Notification actions work perfectly end-to-end!

### Version 1.5.2 (2025-01-13)
**✨ UX IMPROVEMENT: Smart Auto-Scroll for Gaps**

**Enhanced Auto-Scroll Logic:**
- **Case 1**: Before first block → Stay at top (no scroll)
- **Case 2**: After last block → Scroll to last block (shows what you just finished)
- **Case 3**: In a gap between blocks → Scroll to previous block (shows what you just did)
- **Case 4**: During a block → Scroll to current block (existing behavior)

**User Experience:**
- Always oriented in time, even during gaps between blocks
- See what you just completed when in a gap
- Natural and intuitive scrolling behavior
- Works seamlessly with non-contiguous schedules

**Result:** The app keeps you oriented no matter where you are in your schedule!

### Version 1.5.1 (2025-01-13)
**🔧 DEBUG FEATURE: Test Notification Buttons**

**Debug Mode:**
- New toggle in Settings: "Debug Mode"
- When enabled, shows test buttons in each timeblock card
- Three test buttons per block:
  - **📅 Early Warning (30s)**: Test wrap-up notification with Complete/Skip buttons
  - **🔔 Block Start (30s)**: Test block start notification with Snooze/Open buttons
  - **✅ Block End (30s)**: Test block end notification with Complete/Skip buttons

**Fully Wired Testing:**
- Uses REAL notification system (Railway push server)
- Action buttons are fully functional
- Clicking "Complete" actually completes the block
- Clicking "Snooze" actually snoozes the block
- Perfect for testing Smart-Merge notification system

**Developer Experience:**
- Easy testing without waiting for real notifications
- Verify all three notification types work correctly
- Test action button functionality end-to-end

### Version 1.5.0 (2025-01-13)
**🧠 MAJOR UX IMPROVEMENT: Smart-Merge Notification System**

**ADHD-Optimized Notification Strategy:**
- **Contiguous blocks**: Smart-merge reduces cognitive load
  - Early warning (5-min before): "Wrap up: [Current Block]" + "Next: [Next Block] in 5 minutes"
  - Buttons: "✓ Complete" / "⏭ Skip" (for current block)
  - Block start: "Time for: [Next Block]" with "⏰ Snooze" / "Open App"
  - **Result**: Ask for completion during natural "winding down" phase, not at high-pressure "start now!" moment

- **Non-contiguous blocks** (with gaps): Full notification set
  - Block end: "How did it go?" with Complete/Skip buttons
  - Early warning: "Coming up: [Next Block] in 5 minutes"
  - Block start: "Time for: [Next Block]" with Snooze/Open

**Technical Implementation:**
- Smart detection of contiguous vs non-contiguous blocks
- Context-aware notification scheduling based on block relationships
- Automatic notification rescheduling when blocks are snoozed
- Support for flexible scheduling patterns (gaps between blocks)

**UX Benefits:**
- ✅ Reduces notification fatigue (no simultaneous notifications)
- ✅ Supports executive function instead of challenging it
- ✅ Contextual actions at the right moment
- ✅ Works with any scheduling pattern

**Inspired by UX research for ADHD users** - this is a defining feature of Time Diet!

### Version 1.4.0 (2025-01-13)
**🚀 MAJOR FEATURE: Interactive Notification Actions**

**Notification Action Buttons:**
- **Complete from notification**: Early warning notifications (5-min) have "✓ Complete" and "⏭ Skip" buttons
- **Snooze from notification**: Block start notifications have "⏰ Snooze 5min" and "Open App" buttons
- **Works on Android & Desktop**: Full support for notification action buttons
- **Background actions**: Complete or skip timeblocks without opening the app
- **Smart handling**: Actions update the schedule and checklist automatically

**Technical Implementation:**
- Service Worker notification actions with proper event handling
- Message passing between Service Worker and app
- Notification type detection (early-warning vs block-start)
- Block ID and date tracking in notification payload
- Automatic schedule updates from notification actions

**Result:** Manage your schedule directly from notifications - perfect for quick completions or snoozing blocks when you're busy!

### Version 1.3.1 (2025-01-13)
**✨ NEW FEATURE: CSV Template Management**

**Template Management:**
- **Export templates to CSV**: Download any template as a CSV file for backup or editing
- **Import templates from CSV**: Create new templates by importing CSV files
- **Reset to default**: Restore the default Challenge Weekday template with one click
- **Developer-friendly**: Edit templates in Excel/Sheets/VS Code and import them back
- **Version control ready**: CSV format allows committing templates to git

### Version 1.3.0 (2025-01-13)
**✨ NEW FEATURES: Clear Day & UX Improvements**

**Clear Day Schedule:**
- **Clear Day button**: Remove all timeblocks and checklist data for a specific day
- **Confirmation dialog**: Prevents accidental deletion with clear warning message
- **Smart cleanup**: Automatically recalculates streaks after clearing a day
- **Available in both modes**: Works in normal view (today only) and correction mode (any day)
- **Use cases**: Fix wrong template applications, start fresh after mistakes, or reset a day completely

**UX Improvements:**
- **Calendar dark mode**: Better contrast for scheduled vs unscheduled days
- **Smart notification handling**: Clicking notifications refreshes and scrolls to current block
- **Auto-scroll on refresh**: Pull-to-refresh also scrolls to current timeblock

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

