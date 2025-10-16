// Core data types for Time Diet PWA

export type CategoryType = 'Deep Work' | 'Admin' | 'Meals/Hygiene' | 'Exercise' | 'Leisure' | 'Errands/Chores' | 'Buffer';

export type BlockStatus = 'planned' | 'completed' | 'skipped';

export type AppMode = 'challenge' | 'longterm';

export type SoundProfile = 'default' | 'silent' | 'vibrate';

export interface Category {
  id: string;
  name: CategoryType;
  color: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  categoryId: string;
  startTime: string; // HH:mm format for templates
  endTime: string;   // HH:mm format for templates
  description?: string; // Optional multiline description/instructions
}

export interface TimeBlockInstance {
  id: string;
  blockRefId?: string; // Reference to template block
  title: string;
  categoryId: string;
  start: Date; // Actual UTC timestamp
  end: Date;   // Actual UTC timestamp
  status: BlockStatus;
  completedAt?: Date;
  description?: string; // Optional multiline description/instructions
}

export interface DaySchedule {
  id: string;
  date: string; // YYYY-MM-DD format
  blocks: TimeBlockInstance[];
  templateId?: string;
}

export interface Template {
  id: string;
  name: string;
  blocks: TimeBlock[];
  isDefault?: boolean;
}

export interface Checklist {
  id: string;
  date: string; // YYYY-MM-DD format
  wake0730: boolean;
  focusBlocksCompleted: number; // 0-4
  noWeekdayYTGames: boolean;
  lightsOut2330: boolean;
  success: boolean;
  successRate: number; // Calculated percentage
}

// Custom Checklist Types (New!)
export interface ChecklistItemRule {
  titleContains?: string;  // Optional: filter by title substring (case-insensitive)
  category?: string;       // Optional: filter by category ID
}

export interface ChecklistItemDefinition {
  id: string;
  name: string;
  type: 'boolean' | 'count';
  target?: number;         // For count type: how many to achieve (e.g., 4 for "4 focus blocks")
  rule?: ChecklistItemRule; // For count type: how to count matching blocks
}

export interface ChecklistDefinition {
  id: string;
  name: string;            // e.g., "Charlie's Goals! 🎯"
  items: ChecklistItemDefinition[];
}

export interface Settings {
  notificationsEnabled: boolean;
  earlyWarningMinutes: number; // 0 or 5
  soundProfile: SoundProfile;
  categoryColors: Record<string, string>;
  computeCategoryPoints: boolean;
  correctionMode: boolean; // Allows browsing/editing past dates
  darkMode: boolean; // Dark mode toggle
  debugMode: boolean; // Show debug test buttons for notifications
  persistentCurrentBlock: boolean; // Show persistent notification for current active block
  customChecklist?: ChecklistDefinition; // Custom checklist goals (optional, uses default if not set)
}

export interface ModeState {
  activeMode: AppMode;
  challengeStartDate?: string; // YYYY-MM-DD format
  historyRetained: boolean;
}

export interface NotificationQueue {
  id: string;
  blockId: string;
  scheduledTime: Date;
  title: string;
  body: string;
  isEarlyWarning?: boolean;
  date?: string; // Date string for the schedule (YYYY-MM-DD)
  notificationType?: 'early-warning' | 'block-start' | 'block-end' | 'default';
}

// Computed data types
export interface CategoryPoints {
  categoryId: string;
  planned: number;
  completed: number;
  remaining: number;
}

export interface DayStats {
  date: string;
  totalPlanned: number;
  totalCompleted: number;
  categoryPoints: CategoryPoints[];
  blocksPlanned: number;
  blocksCompleted: number;
  blocksSkipped: number;
  success: boolean;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  weekdayStreak: number;
  challengeProgress?: {
    successes: number;
    target: number;
    daysRemaining: number;
  };
}

// Utility types
export interface TimeRange {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// Export data types
export interface CSVExportRow {
  date: string;
  mode: AppMode;
  success: boolean;
  wake_0730: boolean;
  focus_blocks_completed: number;
  no_weekday_yt_games: boolean;
  lights_out_2330: boolean;
  planned_points_total: number;
  planned_points_deep_work: number;
  planned_points_admin: number;
  planned_points_meals_hygiene: number;
  planned_points_exercise: number;
  planned_points_leisure: number;
  planned_points_errands_chores: number;
  planned_points_buffer: number;
  completed_points_deep_work: number;
  completed_points_admin: number;
  completed_points_meals_hygiene: number;
  completed_points_exercise: number;
  completed_points_leisure: number;
  completed_points_errands_chores: number;
  completed_points_buffer: number;
  blocks_planned: number;
  blocks_completed: number;
  blocks_skipped: number;
}

export interface BackupData {
  version: string;
  exportDate: string;
  categories: Category[];
  templates: Template[];
  schedules: DaySchedule[];
  checklists: Checklist[];
  settings: Settings;
  modeState: ModeState;
}

