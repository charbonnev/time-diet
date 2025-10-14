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
  { id: uuidv4(), title: 'Sunlight walk (outside)', categoryId: getCategoryId('Exercise'), startTime: '07:30', endTime: '07:40', description: 'Step outside within the first hour of waking. Eyes toward the horizon, slow breathing, no phone. Repeat the cue: “Reset now.” Then hydrate.' },
  { id: uuidv4(), title: 'Bathroom + water + quick tidy', categoryId: getCategoryId('Meals/Hygiene'), startTime: '07:40', endTime: '08:00', description: 'Bathroom, wash face/teeth, big glass of water. Do a 5–10 min surface tidy so work area starts clear. Keep it brisk; do not start new tasks.' },
  { id: uuidv4(), title: 'Breakfast — protein + carbs', categoryId: getCategoryId('Meals/Hygiene'), startTime: '08:00', endTime: '08:30', description: 'Simple protein + carb (eggs + toast, yogurt + oats). No scrolling. If using caffeine, finish by late morning and pair with water.' },
  { id: uuidv4(), title: 'Plan day + “Parking Lot” ready', categoryId: getCategoryId('Admin'), startTime: '08:30', endTime: '08:45', description: 'Write top 3 tasks for Focus Blocks 1–2. Open a “Parking Lot” page for random thoughts. Confirm blockers for YouTube/games are active.' },

  { id: uuidv4(), title: 'Focus Block 1 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '08:45', endTime: '09:35', description: 'Commitment script: “For the next 50 minutes, I only do X.” Timer on. Phone away. Any stray thought goes to the Parking Lot, then continue.' },
  { id: uuidv4(), title: 'Micro break — stretch/outside', categoryId: getCategoryId('Leisure'), startTime: '09:35', endTime: '09:45', description: 'Stand, water, look far away, light stretch. No phone. Keep it truly 10 minutes to protect the next block.' },
  { id: uuidv4(), title: 'Focus Block 2 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '09:45', endTime: '10:35', description: 'Same script and rules. If you slip, say “Reset now,” walk 2–3 minutes, and restart. No self-critique; resume the plan.' },

  { id: uuidv4(), title: 'Mobility/walk — hips/hamstrings/back', categoryId: getCategoryId('Exercise'), startTime: '10:35', endTime: '10:50', description: 'Loosen hips/hamstrings/upper back or take a brisk mini-walk. Hydrate. Keep screens away.' },
  { id: uuidv4(), title: 'Email triage — today’s must-dos', categoryId: getCategoryId('Admin'), startTime: '10:50', endTime: '11:10', description: 'Process only items that affect today. Archive/snooze the rest. Add follow-ups to the Parking Lot. Close inbox at the bell.' },
  { id: uuidv4(), title: 'Messages + quick chores', categoryId: getCategoryId('Admin'), startTime: '11:10', endTime: '11:40', description: 'Reply to a few DMs/texts and knock out 1–2 tiny chores. Use 10-minute timer loops to avoid drifting.' },
  { id: uuidv4(), title: 'Leisure — book/Kindle/puzzle', categoryId: getCategoryId('Leisure'), startTime: '11:40', endTime: '12:00', description: 'Guilt-free leisure, offline if possible. Choose low-dopamine options (book, puzzle) to keep energy steady.' },

  { id: uuidv4(), title: 'Lunch — no scrolling', categoryId: getCategoryId('Meals/Hygiene'), startTime: '12:00', endTime: '12:40', description: 'Eat calmly with protein + carbs. No doomscrolling. A short post-meal stroll can help afternoon focus.' },
  { id: uuidv4(), title: 'Quiet rest — eyes-closed music', categoryId: getCategoryId('Leisure'), startTime: '12:40', endTime: '13:00', description: 'Rest, not nap: sit or recline (not in bed), eyes closed with calm music. Finish refreshed, not groggy.' },

  { id: uuidv4(), title: 'Focus Block 3 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '13:00', endTime: '13:50', description: 'Commitment script; timer on. If energy dips, do a 2-minute brisk reset (walk + water), then begin.' },
  { id: uuidv4(), title: 'Micro break', categoryId: getCategoryId('Leisure'), startTime: '13:50', endTime: '14:00', description: 'Stand up, stretch, breathe. Keep it screen-free so re-entry is easy.' },
  { id: uuidv4(), title: 'Focus Block 4 — 50m (Deep Work)', categoryId: getCategoryId('Deep Work'), startTime: '14:00', endTime: '14:50', description: 'Final deep block. Protect it with the script and Parking Lot. Hitting 3+ completed focus blocks helps the day “count.”' },

  { id: uuidv4(), title: 'Walk reset + water', categoryId: getCategoryId('Exercise'), startTime: '14:50', endTime: '15:10', description: 'Common trough window: quick walk, hydrate, light mobility. Avoid caffeine now to protect sleep.' },
  { id: uuidv4(), title: 'Errands/Chores — dishes/groceries/laundry', categoryId: getCategoryId('Errands/Chores'), startTime: '15:10', endTime: '16:00', description: 'Pick the next actionable chore. Run 10-minute sprints and chain them. Done > perfect; stop at the bell.' },

  { id: uuidv4(), title: 'Overflow work / creative tinkering (no YT)', categoryId: getCategoryId('Buffer'), startTime: '16:00', endTime: '16:50', description: 'Use as buffer: wrap overflow tasks or explore a low-stakes creative idea. Keep YouTube/games blocked.' },
  { id: uuidv4(), title: 'Strength snack — pushups/plank/rows', categoryId: getCategoryId('Exercise'), startTime: '16:50', endTime: '17:10', description: 'Short strength set: choose 2–3 moves and do easy ladders (e.g., 5–7–9 reps). Stop while it still feels good.' },
  { id: uuidv4(), title: 'Quick shower', categoryId: getCategoryId('Meals/Hygiene'), startTime: '17:10', endTime: '17:30', description: 'Fast rinse to mark the shift from day to evening. No phone in the bathroom.' },
  { id: uuidv4(), title: 'Dinner + kitchen reset', categoryId: getCategoryId('Meals/Hygiene'), startTime: '17:30', endTime: '18:10', description: 'Simple dinner. Then 5-minute kitchen reset so tomorrow starts clean. Avoid screens during the meal.' },

  { id: uuidv4(), title: 'Call/voice note a friend / balcony', categoryId: getCategoryId('Leisure'), startTime: '18:10', endTime: '18:30', description: 'Brief human connection or quiet balcony time. Prefer analog or audio-only to avoid app rabbit holes.' },
  { id: uuidv4(), title: 'Hobby sprint — sketch/music/puzzle', categoryId: getCategoryId('Leisure'), startTime: '18:30', endTime: '19:10', description: 'Hands-on hobby for 30–40 minutes. Lay out materials in advance so you can start immediately.' },

  { id: uuidv4(), title: 'Light admin — DMs/bill/one email', categoryId: getCategoryId('Admin'), startTime: '19:10', endTime: '19:40', description: 'Tie up light tasks only: one bill, one email, a couple of DMs. Avoid opening deep work here.' },
  { id: uuidv4(), title: '30-min tidy / prep trash / quick mop', categoryId: getCategoryId('Errands/Chores'), startTime: '19:40', endTime: '20:10', description: 'Timer on. Do obvious wins: surfaces, trash, floor. Future-you benefits at bedtime.' },

  { id: uuidv4(), title: 'Free choice — reading/analog/extra focus', categoryId: getCategoryId('Buffer'), startTime: '20:10', endTime: '21:00', description: 'Choose reading, an analog project, or a bonus focus block if energy is high. Keep screens intentional.' },
  { id: uuidv4(), title: 'Plan tomorrow — top 3 + blockers', categoryId: getCategoryId('Admin'), startTime: '21:00', endTime: '21:20', description: 'Write tomorrow’s top 3, confirm blockers, and stage any materials needed for the morning start.' },
  { id: uuidv4(), title: 'Wind-down — stretch/breathing, dim lights', categoryId: getCategoryId('Buffer'), startTime: '21:20', endTime: '22:00', description: 'Shift to warm/dim screens after 21:30. Gentle stretching or breathing. Lower lights to cue sleep.' },
  { id: uuidv4(), title: 'Teeth/face + lay out clothes', categoryId: getCategoryId('Meals/Hygiene'), startTime: '22:00', endTime: '22:20', description: 'Night hygiene and lay out clothes by the door. Charge phone outside the bedroom; alarm clock on.' },
  { id: uuidv4(), title: 'Paper book/Kindle/audiobook — low light', categoryId: getCategoryId('Buffer'), startTime: '22:20', endTime: '23:30', description: 'Paper or e-ink Kindle only. Brightness 1–3, max warm, airplane mode. Low-adrenaline reading; if awake, read out of bed until sleepy.' }
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
    darkMode: false,
    debugMode: false,
    persistentCurrentBlock: false
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


