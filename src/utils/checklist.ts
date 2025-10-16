import { Checklist, TimeBlockInstance, Category, Settings } from '@/types';
import { isWeekday, parseDateString } from './time';
import { getActiveChecklistDefinition, evaluateChecklistItem, calculateCustomChecklistSuccess } from './customChecklist';

/**
 * Count completed focus blocks for a day
 * Focus blocks are Deep Work blocks that contain "Focus Block" in title or are in Deep Work category
 */
export function countCompletedFocusBlocks(
  blocks: TimeBlockInstance[],
  categories: Category[]
): number {
  const deepWorkCategory = categories.find(cat => cat.name === 'Deep Work');
  if (!deepWorkCategory) return 0;

  const focusBlocks = blocks.filter(block => {
    // Must be completed
    if (block.status !== 'completed') return false;

    // Must be Deep Work category
    if (block.categoryId !== deepWorkCategory.id) return false;

    // Must contain "Focus Block" in title or be in Deep Work category
    return block.title.includes('Focus Block') || block.categoryId === deepWorkCategory.id;
  });

  // Cap at 4 focus blocks per day
  return Math.min(focusBlocks.length, 4);
}

/**
 * Calculate checklist success based on checkmarks
 * Success = 3 or more checkmarks out of 4
 */
export function calculateChecklistSuccess(checklist: Partial<Checklist>): boolean {
  let checkmarks = 0;

  if (checklist.wake0730) checkmarks++;
  if ((checklist.focusBlocksCompleted ?? 0) >= 3) checkmarks++;
  if (checklist.noWeekdayYTGames) checkmarks++;
  if (checklist.lightsOut2330) checkmarks++;

  return checkmarks >= 3;
}

/**
 * Auto-populate checklist with computed values
 */
export function autoPopulateChecklist(
  date: string,
  blocks: TimeBlockInstance[],
  categories: Category[],
  existingChecklist?: Partial<Checklist>,
  settings?: Settings
): Checklist {
  const focusBlocksCompleted = countCompletedFocusBlocks(blocks, categories);
  const dateObj = parseDateString(date);
  const isWeekdayDate = isWeekday(dateObj);

  // Build customValues using the new custom checklist system if settings provided
  let customValues: Record<string, boolean | number> = existingChecklist?.customValues || {};
  
  if (settings) {
    const checklistDefinition = getActiveChecklistDefinition(settings);
    customValues = {};
    
    for (const item of checklistDefinition.items) {
      const storedValue = existingChecklist?.customValues?.[item.id];
      const value = evaluateChecklistItem(item, blocks, storedValue as boolean | undefined);
      customValues[item.id] = value;
    }
  }

  const checklist: Checklist = {
    id: date, // Use date as ID
    date,
    wake0730: existingChecklist?.wake0730 ?? false,
    focusBlocksCompleted,
    noWeekdayYTGames: existingChecklist?.noWeekdayYTGames ?? false,
    lightsOut2330: existingChecklist?.lightsOut2330 ?? false,
    success: false,
    successRate: 0,
    customValues
  };

  // For weekends, noWeekdayYTGames is always true (not applicable)
  if (!isWeekdayDate) {
    checklist.noWeekdayYTGames = true;
  }

  // Calculate success (use custom if settings provided)
  if (settings) {
    const checklistDefinition = getActiveChecklistDefinition(settings);
    checklist.success = calculateCustomChecklistSuccess(checklistDefinition, customValues);
  } else {
    checklist.success = calculateChecklistSuccess(checklist);
  }
  
  // Calculate success rate
  const checkmarks = settings 
    ? Object.keys(customValues).filter(key => {
        const item = getActiveChecklistDefinition(settings).items.find(i => i.id === key);
        if (!item) return false;
        const value = customValues[key];
        if (item.type === 'boolean') return value === true;
        if (item.type === 'count' && typeof value === 'number') {
          return value >= (item.target || 1);
        }
        return false;
      }).length
    : [checklist.wake0730, checklist.focusBlocksCompleted >= 3, checklist.noWeekdayYTGames, checklist.lightsOut2330].filter(Boolean).length;
  
  const totalItems = settings ? getActiveChecklistDefinition(settings).items.length : 4;
  checklist.successRate = Math.round((checkmarks / totalItems) * 100);

  return checklist;
}

/**
 * Update checklist and recalculate success
 */
export function updateChecklist(
  checklist: Checklist,
  updates: Partial<Pick<Checklist, 'wake0730' | 'noWeekdayYTGames' | 'lightsOut2330'>>
): Checklist {
  const updated = { ...checklist, ...updates };
  updated.success = calculateChecklistSuccess(updated);
  return updated;
}

/**
 * Get checklist summary for display
 */
export function getChecklistSummary(checklist: Checklist): {
  checkmarks: number;
  total: number;
  items: Array<{ label: string; checked: boolean; auto?: boolean }>;
} {
  const items = [
    { label: 'Wake 07:30?', checked: checklist.wake0730 },
    { label: 'Focus blocks (≥3)', checked: checklist.focusBlocksCompleted >= 3, auto: true },
    { label: 'No weekday YT/games?', checked: checklist.noWeekdayYTGames },
    { label: 'Lights out 23:30?', checked: checklist.lightsOut2330 }
  ];

  const checkmarks = items.filter(item => item.checked).length;

  return {
    checkmarks,
    total: 4,
    items
  };
}

