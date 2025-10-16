import { ChecklistDefinition } from '@/types';

/**
 * Default checklist: "Charlie's Goals! 🎯"
 * Matches the original hardcoded checklist behavior
 */
export const DEFAULT_CHECKLIST: ChecklistDefinition = {
  id: 'default-charlies-goals',
  name: "Charlie's Goals! 🎯",
  items: [
    {
      id: 'wake0730',
      name: 'Wake up at 7:30',
      type: 'boolean'
    },
    {
      id: 'focusBlocksCompleted',
      name: 'Deep Focus',
      type: 'count',
      target: 4,
      rule: {
        titleContains: 'Focus' // Matches any block with "Focus" in title
      }
    },
    {
      id: 'noWeekdayYTGames',
      name: 'No Weekday YT/Games',
      type: 'boolean'
    },
    {
      id: 'lightsOut2330',
      name: 'Lights Out at 23:30',
      type: 'boolean'
    }
  ]
};
