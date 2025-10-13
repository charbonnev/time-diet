import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Category,
  Template,
  DaySchedule,
  Checklist,
  Settings,
  ModeState,
  TimeBlockInstance,
  NotificationQueue,
  CategoryPoints,
  StreakData
} from '@/types';
import {
  getCategories,
  saveCategories,
  getTemplates,
  saveTemplate,
  deleteTemplate,
  getSchedule,
  saveSchedule,
  getChecklist,
  saveChecklist,
  getSettings,
  saveSettings,
  getModeState,
  saveModeState,
  getNotificationQueue,
  saveNotification,
  clearNotificationQueue,
  getAllChecklists,
  getChecklistsInRange,
  getDB
} from '@/utils/storage';
import {
  createDefaultCategories,
  createChallengeWeekdayTemplate,
  createDefaultSettings,
  createDefaultModeState
} from '@/utils/defaults';
import { calculateCategoryPoints } from '@/utils/points';
import { autoPopulateChecklist } from '@/utils/checklist';
import { getCurrentDateString, isWeekday, formatDateString } from '@/utils/time';

interface AppState {
  // Data
  categories: Category[];
  templates: Template[];
  currentSchedule: DaySchedule | null;
  currentChecklist: Checklist | null;
  settings: Settings;
  modeState: ModeState;
  notificationQueue: NotificationQueue[];

  // UI State
  isLoading: boolean;
  error: string | null;

  // Computed data
  categoryPoints: CategoryPoints[];
  streakData: StreakData;

  // Actions
  initializeApp: () => Promise<void>;
  
  // Categories
  updateCategories: (categories: Category[]) => Promise<void>;
  
  // Templates
  addTemplate: (template: Template) => Promise<void>;
  updateTemplate: (template: Template) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  applyTemplateToDate: (templateId: string, date: string) => Promise<void>;
  resetTemplatesToDefault: () => Promise<void>;
  
  // Schedules
  loadScheduleForDate: (date: string) => Promise<void>;
  updateSchedule: (schedule: DaySchedule) => Promise<void>;
  updateBlockStatus: (blockId: string, status: 'completed' | 'skipped') => Promise<void>;
  updateBlockTitle: (blockId: string, newTitle: string) => Promise<void>;
  updateBlockDescription: (blockId: string, newDescription: string) => Promise<void>;
  resetBlockStatus: (blockId: string) => Promise<void>;
  snoozeBlock: (blockId: string, minutes: number) => Promise<void>;
  clearDaySchedule: (date: string) => Promise<void>;
  
  // Checklists
  loadChecklistForDate: (date: string) => Promise<void>;
  updateChecklistItem: (date: string, updates: Partial<Checklist>) => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  
  // Mode
  switchMode: (mode: 'challenge' | 'longterm') => Promise<void>;
  startChallenge: () => Promise<void>;
  
  // Notifications
  saveNotification: (notification: NotificationQueue) => Promise<void>;
  scheduleNotifications: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  // Data export
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
  exportCSV: (startDate: string, endDate: string) => Promise<string>;
  
  // Utility
  setError: (error: string | null) => void;
  calculateStreaks: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        categories: [],
        templates: [],
        currentSchedule: null,
        currentChecklist: null,
        settings: createDefaultSettings(),
        modeState: createDefaultModeState(),
        notificationQueue: [],
        isLoading: false,
        error: null,
        categoryPoints: [],
        streakData: {
          currentStreak: 0,
          bestStreak: 0,
          weekdayStreak: 0
        },

        // Initialize app with default data
        initializeApp: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // Load or create categories
            let categories = await getCategories();
            if (categories.length === 0) {
              categories = createDefaultCategories();
              await saveCategories(categories);
            }

            // Load or create templates
            let templates = await getTemplates();
            if (templates.length === 0) {
              const challengeTemplate = createChallengeWeekdayTemplate(categories);
              templates = [challengeTemplate];
              await saveTemplate(challengeTemplate);
            }

            // Load or create settings
            let settings = await getSettings();
            if (!settings) {
              settings = createDefaultSettings();
              await saveSettings(settings);
            }

            // Load or create mode state
            let modeState = await getModeState();
            if (!modeState) {
              modeState = createDefaultModeState();
              await saveModeState(modeState);
            }

            // Load notification queue
            const notificationQueue = await getNotificationQueue();

            set({
              categories,
              templates,
              settings,
              modeState,
              notificationQueue,
              isLoading: false
            });

            // Load today's schedule and checklist
            const today = getCurrentDateString();
            await get().loadScheduleForDate(today);
            await get().loadChecklistForDate(today);
            await get().calculateStreaks();

          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize app',
              isLoading: false 
            });
          }
        },

        // Categories
        updateCategories: async (categories: Category[]) => {
          try {
            await saveCategories(categories);
            set({ categories });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update categories' });
          }
        },

        // Templates
        addTemplate: async (template: Template) => {
          try {
            await saveTemplate(template);
            set(state => ({ templates: [...state.templates, template] }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to add template' });
          }
        },

        updateTemplate: async (template: Template) => {
          try {
            await saveTemplate(template);
            set(state => ({
              templates: state.templates.map(t => t.id === template.id ? template : t)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update template' });
          }
        },

        removeTemplate: async (id: string) => {
          try {
            await deleteTemplate(id);
            set(state => ({
              templates: state.templates.filter(t => t.id !== id)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to remove template' });
          }
        },

        resetTemplatesToDefault: async () => {
          try {
            const { categories, templates } = get();
            
            // Delete all existing templates
            await Promise.all(templates.map(t => deleteTemplate(t.id)));
            
            // Create default template
            const challengeTemplate = createChallengeWeekdayTemplate(categories);
            await saveTemplate(challengeTemplate);
            
            set({ templates: [challengeTemplate] });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to reset templates' });
          }
        },

        applyTemplateToDate: async (templateId: string, date: string) => {
          try {
            const { templates } = get();
            const template = templates.find(t => t.id === templateId);
            if (!template) throw new Error('Template not found');

            // Create schedule from template
            const schedule: DaySchedule = {
              id: `schedule-${date}`,
              date,
              templateId,
              blocks: template.blocks.map(block => ({
                id: `${block.id}-${date}`,
                blockRefId: block.id,
                title: block.title,
                categoryId: block.categoryId,
                start: new Date(`${date}T${block.startTime}:00`),
                end: new Date(`${date}T${block.endTime}:00`),
                status: 'planned' as const,
                description: block.description // Copy description from template
              }))
            };

            await saveSchedule(schedule);
            
            const today = getCurrentDateString();
            if (date === today) {
              // Ensure categories are fresh from storage
              const freshCategories = await getCategories();
              set({ 
                currentSchedule: schedule,
                categories: freshCategories
              });
              // Update category points with fresh categories
              const categoryPoints = calculateCategoryPoints(schedule.blocks, freshCategories);
              set({ categoryPoints });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to apply template' });
          }
        },

        // Schedules
        loadScheduleForDate: async (date: string) => {
          try {
            const schedule = await getSchedule(date);
            const { categories } = get();
            
            set({ currentSchedule: schedule || null });
            
            if (schedule) {
              const categoryPoints = calculateCategoryPoints(schedule.blocks, categories);
              set({ categoryPoints });
            } else {
              set({ categoryPoints: [] });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load schedule' });
          }
        },

        updateSchedule: async (schedule: DaySchedule) => {
          try {
            await saveSchedule(schedule);
            const { categories, currentSchedule } = get();
            
            // Update store if this is the currently loaded schedule (for correction mode)
            if (currentSchedule && schedule.date === currentSchedule.date) {
              set({ currentSchedule: schedule });
              const categoryPoints = calculateCategoryPoints(schedule.blocks, categories);
              set({ categoryPoints });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update schedule' });
          }
        },

        updateBlockStatus: async (blockId: string, status: 'completed' | 'skipped') => {
          try {
            const { currentSchedule, categories } = get();
            if (!currentSchedule) return;

            const updatedBlocks = currentSchedule.blocks.map(block =>
              block.id === blockId
                ? { ...block, status, completedAt: status === 'completed' ? new Date() : undefined }
                : block
            );

            const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks };
            await get().updateSchedule(updatedSchedule);

            // Auto-update checklist if it's a focus block
            const updatedBlock = updatedBlocks.find(b => b.id === blockId);
            if (updatedBlock && updatedBlock.title.includes('Focus Block')) {
              await get().loadChecklistForDate(currentSchedule.date);
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update block status' });
          }
        },

        updateBlockTitle: async (blockId: string, newTitle: string) => {
          try {
            const { currentSchedule } = get();
            if (!currentSchedule) return;

            const updatedBlocks = currentSchedule.blocks.map(block =>
              block.id === blockId
                ? { ...block, title: newTitle }
                : block
            );

            const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks };
            await get().updateSchedule(updatedSchedule);
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update block title' });
          }
        },

        updateBlockDescription: async (blockId: string, newDescription: string) => {
          try {
            const { currentSchedule } = get();
            if (!currentSchedule) return;

            const updatedBlocks = currentSchedule.blocks.map(block =>
              block.id === blockId
                ? { ...block, description: newDescription }
                : block
            );

            const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks };
            await get().updateSchedule(updatedSchedule);
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update block description' });
          }
        },

        resetBlockStatus: async (blockId: string) => {
          try {
            const { currentSchedule } = get();
            if (!currentSchedule) return;

            const updatedBlocks = currentSchedule.blocks.map(block =>
              block.id === blockId
                ? { ...block, status: 'planned' as const, completedAt: undefined }
                : block
            );

            const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks };
            await get().updateSchedule(updatedSchedule);

            // Auto-update checklist if it's a focus block
            const updatedBlock = updatedBlocks.find(b => b.id === blockId);
            if (updatedBlock && updatedBlock.title.includes('Focus Block')) {
              await get().loadChecklistForDate(currentSchedule.date);
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to reset block status' });
          }
        },

        snoozeBlock: async (blockId: string, minutes: number) => {
          try {
            const { currentSchedule } = get();
            if (!currentSchedule) return;

            const updatedBlocks = currentSchedule.blocks.map(block => {
              if (block.id === blockId) {
                const newStart = new Date(block.start.getTime() + minutes * 60000);
                const newEnd = new Date(block.end.getTime() + minutes * 60000);
                return { ...block, start: newStart, end: newEnd };
              }
              return block;
            });

            const updatedSchedule = { ...currentSchedule, blocks: updatedBlocks };
            await get().updateSchedule(updatedSchedule);
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to snooze block' });
          }
        },

        clearDaySchedule: async (date: string) => {
          try {
            const { currentSchedule } = get();
            
            // Delete the schedule from storage
            const db = await getDB();
            
            // Find and delete the schedule by date
            const schedule = await db.getFromIndex('schedules', 'by-date', date);
            if (schedule) {
              await db.delete('schedules', schedule.id);
            }
            
            // Also clear the checklist for this date
            await db.delete('checklists', date);
            
            // Update store if this is the currently loaded schedule
            if (currentSchedule && date === currentSchedule.date) {
              set({ 
                currentSchedule: null,
                currentChecklist: null,
                categoryPoints: []
              });
            }
            
            // Recalculate streaks since we removed data
            await get().calculateStreaks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to clear day schedule' });
          }
        },

        // Checklists
        loadChecklistForDate: async (date: string) => {
          try {
            const { currentSchedule, categories } = get();
            let checklist = await getChecklist(date);
            
            if (!checklist && currentSchedule) {
              // Auto-populate checklist
              checklist = autoPopulateChecklist(date, currentSchedule.blocks, categories);
              await saveChecklist(checklist);
            }
            
            set({ currentChecklist: checklist || null });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load checklist' });
          }
        },

        updateChecklistItem: async (date: string, updates: Partial<Checklist>) => {
          try {
            const { currentSchedule, categories } = get();
            if (!currentSchedule) return;

            let checklist = await getChecklist(date);
            if (!checklist) {
              checklist = autoPopulateChecklist(date, currentSchedule.blocks, categories);
            }

            const updatedChecklist = { ...checklist, ...updates };
            // Recalculate success
            const checkmarks = [
              updatedChecklist.wake0730,
              updatedChecklist.focusBlocksCompleted >= 3,
              updatedChecklist.noWeekdayYTGames,
              updatedChecklist.lightsOut2330
            ].filter(Boolean).length;
            
            updatedChecklist.success = checkmarks >= 3;

            await saveChecklist(updatedChecklist);
            
            // Update store if this is the currently loaded checklist (for correction mode)
            if (currentSchedule && date === currentSchedule.date) {
              set({ currentChecklist: updatedChecklist });
            }

            // Recalculate streaks
            await get().calculateStreaks();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update checklist' });
          }
        },

        // Settings
        updateSettings: async (settingsUpdate: Partial<Settings>) => {
          try {
            const { settings } = get();
            const updatedSettings = { ...settings, ...settingsUpdate };
            await saveSettings(updatedSettings);
            set({ settings: updatedSettings });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
          }
        },

        // Mode
        switchMode: async (mode: 'challenge' | 'longterm') => {
          try {
            const { modeState } = get();
            const updatedModeState = { ...modeState, activeMode: mode };
            await saveModeState(updatedModeState);
            set({ modeState: updatedModeState });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to switch mode' });
          }
        },

        startChallenge: async () => {
          try {
            const { modeState } = get();
            const updatedModeState = {
              ...modeState,
              activeMode: 'challenge' as const,
              challengeStartDate: getCurrentDateString()
            };
            await saveModeState(updatedModeState);
            set({ modeState: updatedModeState });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to start challenge' });
          }
        },

        // Notifications
        saveNotification: async (notification: NotificationQueue) => {
          try {
            await saveNotification(notification);
            const currentQueue = get().notificationQueue;
            set({ notificationQueue: [...currentQueue, notification] });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to save notification' });
          }
        },

        scheduleNotifications: async () => {
          try {
            const { currentSchedule, settings } = get();
            if (!settings.notificationsEnabled || !currentSchedule) {
              return;
            }

            // Clear existing notifications first
            await get().clearNotifications();

            // This function is called by the useNotifications hook
            // The actual scheduling is handled there with setTimeout
            // This is just a placeholder for any additional scheduling logic
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to schedule notifications' });
          }
        },

        clearNotifications: async () => {
          try {
            await clearNotificationQueue();
            set({ notificationQueue: [] });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to clear notifications' });
          }
        },

        // Data export (placeholder - will be implemented in Phase 5)
        exportData: async () => {
          // TODO: Implement data export
          return '';
        },

        importData: async (jsonData: string) => {
          // TODO: Implement data import
        },

        exportCSV: async (startDate: string, endDate: string) => {
          // TODO: Implement CSV export
          return '';
        },

        // Calculate streaks
        calculateStreaks: async () => {
          try {
            const checklists = await getAllChecklists();
            const sortedChecklists = checklists
              .filter(c => c.success)
              .sort((a, b) => a.date.localeCompare(b.date));

            let currentStreak = 0;
            let bestStreak = 0;
            let weekdayStreak = 0;
            let tempStreak = 0;
            let tempWeekdayStreak = 0;

            const today = getCurrentDateString();

            // Calculate streaks
            for (let i = sortedChecklists.length - 1; i >= 0; i--) {
              const checklist = sortedChecklists[i];
              const date = new Date(checklist.date);
              
              if (i === sortedChecklists.length - 1) {
                tempStreak = 1;
                if (isWeekday(date)) tempWeekdayStreak = 1;
              } else {
                const prevDate = new Date(sortedChecklists[i + 1].date);
                const daysDiff = Math.floor((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                  tempStreak++;
                  if (isWeekday(date)) tempWeekdayStreak++;
                } else {
                  break;
                }
              }
            }

            currentStreak = tempStreak;
            weekdayStreak = tempWeekdayStreak;
            bestStreak = Math.max(...checklists.map((_, i) => {
              let streak = 0;
              for (let j = i; j < checklists.length; j++) {
                if (checklists[j].success) streak++;
                else break;
              }
              return streak;
            }));

            // Calculate challenge progress if in challenge mode
            const { modeState } = get();
            let challengeProgress;
            if (modeState.activeMode === 'challenge' && modeState.challengeStartDate) {
              const challengeChecklists = checklists.filter(c => c.date >= modeState.challengeStartDate!);
              const successes = challengeChecklists.filter(c => c.success).length;
              const daysSinceStart = Math.floor(
                (new Date(today).getTime() - new Date(modeState.challengeStartDate).getTime()) / (1000 * 60 * 60 * 24)
              );
              challengeProgress = {
                successes,
                target: 9,
                daysRemaining: Math.max(0, 14 - daysSinceStart)
              };
            }

            set({
              streakData: {
                currentStreak,
                bestStreak,
                weekdayStreak,
                challengeProgress
              }
            });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to calculate streaks' });
          }
        },

        // Utility
        setError: (error: string | null) => {
          set({ error });
        }
      }),
      {
        name: 'time-diet-store',
        partialize: (state) => ({
          settings: state.settings
        })
      }
    ),
    { name: 'time-diet-store' }
  )
);

