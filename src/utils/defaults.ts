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
    { id: uuidv4(), title: 'Exercise', categoryId: getCategoryId('Exercise'), startTime: '07:30', endTime: '07:40' },
    { id: uuidv4(), title: 'Meals/Hygiene', categoryId: getCategoryId('Meals/Hygiene'), startTime: '07:40', endTime: '08:00' },
    { id: uuidv4(), title: 'Meals/Hygiene', categoryId: getCategoryId('Meals/Hygiene'), startTime: '08:00', endTime: '08:30' },
    { id: uuidv4(), title: 'Admin', categoryId: getCategoryId('Admin'), startTime: '08:30', endTime: '08:45' },
    { id: uuidv4(), title: 'Deep Work — Focus Block 1', categoryId: getCategoryId('Deep Work'), startTime: '08:45', endTime: '09:35' },
    { id: uuidv4(), title: 'Leisure', categoryId: getCategoryId('Leisure'), startTime: '09:35', endTime: '09:45' },
    { id: uuidv4(), title: 'Deep Work — Focus Block 2', categoryId: getCategoryId('Deep Work'), startTime: '09:45', endTime: '10:35' },
    { id: uuidv4(), title: 'Exercise', categoryId: getCategoryId('Exercise'), startTime: '10:35', endTime: '10:50' },
    { id: uuidv4(), title: 'Admin', categoryId: getCategoryId('Admin'), startTime: '10:50', endTime: '11:10' },
    { id: uuidv4(), title: 'Admin', categoryId: getCategoryId('Admin'), startTime: '11:10', endTime: '11:40' },
    { id: uuidv4(), title: 'Leisure', categoryId: getCategoryId('Leisure'), startTime: '11:40', endTime: '12:00' },
    { id: uuidv4(), title: 'Meals/Hygiene', categoryId: getCategoryId('Meals/Hygiene'), startTime: '12:00', endTime: '12:40' },
    { id: uuidv4(), title: 'Leisure', categoryId: getCategoryId('Leisure'), startTime: '12:40', endTime: '13:00' },
    { id: uuidv4(), title: 'Deep Work — Focus Block 3', categoryId: getCategoryId('Deep Work'), startTime: '13:00', endTime: '13:50' },
    { id: uuidv4(), title: 'Leisure', categoryId: getCategoryId('Leisure'), startTime: '13:50', endTime: '14:00' },
    { id: uuidv4(), title: 'Deep Work — Focus Block 4', categoryId: getCategoryId('Deep Work'), startTime: '14:00', endTime: '14:50' },
    { id: uuidv4(), title: 'Exercise', categoryId: getCategoryId('Exercise'), startTime: '14:50', endTime: '15:10' },
    { id: uuidv4(), title: 'Errands/Chores', categoryId: getCategoryId('Errands/Chores'), startTime: '15:10', endTime: '16:00' },
    { id: uuidv4(), title: 'Buffer', categoryId: getCategoryId('Buffer'), startTime: '16:00', endTime: '16:50' },
    { id: uuidv4(), title: 'Exercise', categoryId: getCategoryId('Exercise'), startTime: '16:50', endTime: '17:10' },
    { id: uuidv4(), title: 'Meals/Hygiene', categoryId: getCategoryId('Meals/Hygiene'), startTime: '17:10', endTime: '17:30' },
    { id: uuidv4(), title: 'Meals/Hygiene', categoryId: getCategoryId('Meals/Hygiene'), startTime: '17:30', endTime: '18:10' },
    { id: uuidv4(), title: 'Leisure', categoryId: getCategoryId('Leisure'), startTime: '18:10', endTime: '18:30' },
    { id: uuidv4(), title: 'Leisure', categoryId: getCategoryId('Leisure'), startTime: '18:30', endTime: '19:10' },
    { id: uuidv4(), title: 'Admin', categoryId: getCategoryId('Admin'), startTime: '19:10', endTime: '19:40' },
    { id: uuidv4(), title: 'Errands/Chores', categoryId: getCategoryId('Errands/Chores'), startTime: '19:40', endTime: '20:10' },
    { id: uuidv4(), title: 'Buffer', categoryId: getCategoryId('Buffer'), startTime: '20:10', endTime: '21:00' },
    { id: uuidv4(), title: 'Admin', categoryId: getCategoryId('Admin'), startTime: '21:00', endTime: '21:20' },
    { id: uuidv4(), title: 'Buffer', categoryId: getCategoryId('Buffer'), startTime: '21:20', endTime: '22:00' },
    { id: uuidv4(), title: 'Meals/Hygiene', categoryId: getCategoryId('Meals/Hygiene'), startTime: '22:00', endTime: '22:20' },
    { id: uuidv4(), title: 'Buffer', categoryId: getCategoryId('Buffer'), startTime: '22:20', endTime: '23:30' }
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
    computeCategoryPoints: true
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

// UUID generation fallback for environments without crypto
function generateUUID(): string {
  try {
    return uuidv4();
  } catch {
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

