import { ChecklistDefinition, ChecklistItemDefinition, ChecklistItemRule, TimeBlockInstance, Settings } from '@/types';
import { DEFAULT_CHECKLIST } from './defaultChecklist';

/**
 * Get the active checklist definition from settings, or use default
 */
export function getActiveChecklistDefinition(settings: Settings): ChecklistDefinition {
  return settings.customChecklist || DEFAULT_CHECKLIST;
}

/**
 * Evaluate a rule against a time block instance
 * Returns true if the block matches the rule criteria
 */
export function evaluateRule(block: TimeBlockInstance, rule: ChecklistItemRule): boolean {
  // Check title contains (case-insensitive)
  if (rule.titleContains) {
    const titleMatch = block.title.toLowerCase().includes(rule.titleContains.toLowerCase());
    if (!titleMatch) return false;
  }

  // Check category
  if (rule.category) {
    if (block.categoryId !== rule.category) return false;
  }

  return true;
}

/**
 * Count blocks that match a rule
 * Only counts completed blocks
 */
export function countMatchingBlocks(blocks: TimeBlockInstance[], rule?: ChecklistItemRule): number {
  if (!rule) {
    // No rule = count all completed blocks
    return blocks.filter(b => b.status === 'completed').length;
  }

  return blocks.filter(block => {
    // Must be completed
    if (block.status !== 'completed') return false;
    
    // Must match rule
    return evaluateRule(block, rule);
  }).length;
}

/**
 * Evaluate a checklist item against a day's time blocks
 * Returns the current value (boolean for boolean items, number for count items)
 */
export function evaluateChecklistItem(
  item: ChecklistItemDefinition,
  blocks: TimeBlockInstance[],
  existingValue?: boolean
): boolean | number {
  if (item.type === 'boolean') {
    // Boolean items use the existing value (manually toggled by user)
    return existingValue ?? false;
  }

  // Count type: count matching blocks
  const count = countMatchingBlocks(blocks, item.rule);
  return count;
}

/**
 * Check if a count-type checklist item is completed
 */
export function isCountItemCompleted(item: ChecklistItemDefinition, count: number): boolean {
  if (item.type !== 'count' || !item.target) return false;
  return count >= item.target;
}

/**
 * Calculate checklist success based on custom checklist definition
 * Success = 75% or more items completed (rounded up)
 */
export function calculateCustomChecklistSuccess(
  definition: ChecklistDefinition,
  itemValues: Record<string, boolean | number>
): boolean {
  const totalItems = definition.items.length;
  if (totalItems === 0) return false;

  let completedItems = 0;

  for (const item of definition.items) {
    const value = itemValues[item.id];
    
    if (item.type === 'boolean') {
      if (value === true) completedItems++;
    } else if (item.type === 'count') {
      const count = typeof value === 'number' ? value : 0;
      if (isCountItemCompleted(item, count)) {
        completedItems++;
      }
    }
  }

  // Success = 75% or more (rounds up, so 3/4 = success)
  const successThreshold = Math.ceil(totalItems * 0.75);
  return completedItems >= successThreshold;
}
