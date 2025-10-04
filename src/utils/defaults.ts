import { Category, Template, TimeBlock, Settings, ModeState } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Default category colors
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  'Deep Work': '#3b82f6',      // Blue
  'Admin': '#8b5cf6',          // Purple  
  'Meals/Hygiene': '#10b981',  // Green
  'Exercise': '#f59e0b',       // Orange
  'Leisure': '#ec4899',        // Pink
  'Errands/Chores': '#6b7280', // Gray
  'Buffer': '#14b8a6'          // Teal
};

/**
 * Create default categories
 */
export function createDefaultCategories(): Category[] {
  return [
    { id: uuidv4(), name: 'Deep Work', color: DEFAULT_CATEGORY_COLORS['Deep Work'] },
    { id: uuidv4(), name: 'Admin', color: DEFAULT_CATEGORY_COLORS['Admin'] },
    { id: uuidv4(), name: 'Meals/Hygiene', color: DEFAULT_CATEGORY_COLORS['Meals/Hygiene'] },
    { id: uuidv4(), name: 'Exercise', color: DEFAULT_CATEGORY_COLORS['Exercise'] },
    { id: uuidv4(), name: 'Leisure', color: DEFAULT_CATEGORY_COLORS['Leisure'] },
    { id: uuidv4(), name: 'Errands/Chores', color: DEFAULT_CATEGORY_COLORS['Errands/Chores'] },
    { id: uuidv4(), name: 'Buffer', color: DEFAULT_CATEGORY_COLORS['Buffer'] }
  ];
}

/**
 * Create the default Challenge Weekday template
 */
export function createChallengeWeekdayTemplate(categories: Category[]): Template {
  const getCategoryId = (name: string) => 
    categories.find(cat => cat.name === name)?.id || '';

  const blocks: TimeBlock[] = [
    { id: uuidv4(), title: 'Sunlight walk (outside)', categoryId: getCategoryId('Exercise'), startTime: '07:30', endTime: '07:40' },
    { id: uuidv4(), title: 'Bathroom + water + quick tidy', categoryId: getCategoryId('Meals/Hygiene'), startTime: '07:40', endTime: '08:00' },
    { id: uuidv4(), title: 'Breakfast — protein + carbs', categoryId: getCategoryId('Meals/Hygiene'), startTime: '08:00', endTime: '08:30' },
    { id: uuidv4(), title: 'Plan day + “Parking Lot” ready', categoryId: getCategoryId('Admin'), startTime: '08:30', endTime: '08:45' },
  
    { id: uuidv4(), title: 'Focus Block 1 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '08:45', endTime: '09:35' },
    { id: uuidv4(), title: 'Micro break — stretch/outside', categoryId: getCategoryId('Leisure'), startTime: '09:35', endTime: '09:45' },
    { id: uuidv4(), title: 'Focus Block 2 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '09:45', endTime: '10:35' },
  
    { id: uuidv4(), title: 'Mobility/walk — hips/hamstrings/back', categoryId: getCategoryId('Exercise'), startTime: '10:35', endTime: '10:50' },
    { id: uuidv4(), title: 'Email triage — today’s must-dos', categoryId: getCategoryId('Admin'), startTime: '10:50', endTime: '11:10' },
    { id: uuidv4(), title: 'Messages + quick chores', categoryId: getCategoryId('Admin'), startTime: '11:10', endTime: '11:40' },
    { id: uuidv4(), title: 'Leisure — book/Kindle/puzzle', categoryId: getCategoryId('Leisure'), startTime: '11:40', endTime: '12:00' },
  
    { id: uuidv4(), title: 'Lunch — no scrolling', categoryId: getCategoryId('Meals/Hygiene'), startTime: '12:00', endTime: '12:40' },
    { id: uuidv4(), title: 'Quiet rest — eyes-closed music', categoryId: getCategoryId('Leisure'), startTime: '12:40', endTime: '13:00' },
  
    { id: uuidv4(), title: 'Focus Block 3 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '13:00', endTime: '13:50' },
    { id: uuidv4(), title: 'Micro break', categoryId: getCategoryId('Leisure'), startTime: '13:50', endTime: '14:00' },
    { id: uuidv4(), title: 'Focus Block 4 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '14:00', endTime: '14:50' },
  
    { id: uuidv4(), title: 'Walk reset + water', categoryId: getCategoryId('Exercise'), startTime: '14:50', endTime: '15:10' },
    { id: uuidv4(), title: 'Errands/Chores — dishes/groceries/laundry', categoryId: getCategoryId('Errands/Chores'), startTime: '15:10', endTime: '16:00' },
  
    { id: uuidv4(), title: 'Overflow work / creative tinkering (no YT)', categoryId: getCategoryId('Buffer'), startTime: '16:00', endTime: '16:50' },
    { id: uuidv4(), title: 'Strength snack — pushups/plank/rows', categoryId: getCategoryId('Exercise'), startTime: '16:50', endTime: '17:10' },
    { id: uuidv4(), title: 'Quick shower', categoryId: getCategoryId('Meals/Hygiene'), startTime: '17:10', endTime: '17:30' },
    { id: uuidv4(), title: 'Dinner + kitchen reset', categoryId: getCategoryId('Meals/Hygiene'), startTime: '17:30', endTime: '18:10' },
  
    { id: uuidv4(), title: 'Call/voice note a friend / balcony', categoryId: getCategoryId('Leisure'), startTime: '18:10', endTime: '18:30' },
    { id: uuidv4(), title: 'Hobby sprint — sketch/music/puzzle', categoryId: getCategoryId('Leisure'), startTime: '18:30', endTime: '19:10' },
  
    { id: uuidv4(), title: 'Light admin — DMs/bill/one email', categoryId: getCategoryId('Admin'), startTime: '19:10', endTime: '19:40' },
    { id: uuidv4(), title: '30-min tidy / prep trash / quick mop', categoryId: getCategoryId('Errands/Chores'), startTime: '19:40', endTime: '20:10' },
  
    { id: uuidv4(), title: 'Free choice — reading/analog/extra focus', categoryId: getCategoryId('Buffer'), startTime: '20:10', endTime: '21:00' },
    { id: uuidv4(), title: 'Plan tomorrow — top 3 + blockers', categoryId: getCategoryId('Admin'), startTime: '21:00', endTime: '21:20' },
    { id: uuidv4(), title: 'Wind-down — stretch/breathing, dim lights', categoryId: getCategoryId('Buffer'), startTime: '21:20', endTime: '22:00' },
    { id: uuidv4(), title: 'Teeth/face + lay out clothes', categoryId: getCategoryId('Meals/Hygiene'), startTime: '22:00', endTime: '22:20' },
    { id: uuidv4(), title: 'Paper book/Kindle/audiobook — low light', categoryId: getCategoryId('Buffer'), startTime: '22:20', endTime: '23:30' }
  ];  

  return {
    id: uuidv4(),
    name: 'Challenge Weekday',
    blocks,
    isDefault: true
  };
}

/**
 * Create default settings
 */
export function createDefaultSettings(): Settings {
  return {
    notificationsEnabled: false,
    earlyWarningMinutes: 0,
    soundProfile: 'default',
    categoryColors: DEFAULT_CATEGORY_COLORS,
    computeCategoryPoints: true,
    correctionMode: false,
    darkMode: false
  };
}

/**
 * Create default mode state
 */
export function createDefaultModeState(): ModeState {
  return {
    activeMode: 'challenge',
    historyRetained: true
  };
}


