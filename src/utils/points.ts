import { CategoryPoints, TimeBlockInstance, Category, CategoryType } from '@/types';
import { calculateInstancePoints } from './time';

/**
 * Calculate points for each category from a list of time block instances
 */
export function calculateCategoryPoints(
  blocks: TimeBlockInstance[],
  categories: Category[]
): CategoryPoints[] {
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  const pointsMap = new Map<string, { planned: number; completed: number }>();

  // Initialize all categories
  categories.forEach(category => {
    pointsMap.set(category.id, { planned: 0, completed: 0 });
  });

  // Calculate points for each block
  blocks.forEach(block => {
    const category = categoryMap.get(block.categoryId);
    if (!category) return;

    const points = calculateInstancePoints(block.start, block.end);
    const current = pointsMap.get(block.categoryId)!;

    // Add to planned points
    current.planned += points;

    // Add to completed points if block is completed
    if (block.status === 'completed') {
      current.completed += points;
    }

    pointsMap.set(block.categoryId, current);
  });

  // Convert to CategoryPoints array
  return categories.map(category => {
    const points = pointsMap.get(category.id)!;
    return {
      categoryId: category.id,
      planned: points.planned,
      completed: points.completed,
      remaining: points.planned - points.completed
    };
  });
}

/**
 * Calculate total planned points for a day
 */
export function calculateTotalPlannedPoints(blocks: TimeBlockInstance[]): number {
  return blocks.reduce((total, block) => {
    return total + calculateInstancePoints(block.start, block.end);
  }, 0);
}

/**
 * Calculate total completed points for a day
 */
export function calculateTotalCompletedPoints(blocks: TimeBlockInstance[]): number {
  return blocks
    .filter(block => block.status === 'completed')
    .reduce((total, block) => {
      return total + calculateInstancePoints(block.start, block.end);
    }, 0);
}

/**
 * Get points for a specific category
 */
export function getCategoryPoints(
  blocks: TimeBlockInstance[],
  categoryId: string
): { planned: number; completed: number; remaining: number } {
  const categoryBlocks = blocks.filter(block => block.categoryId === categoryId);
  
  const planned = categoryBlocks.reduce((total, block) => {
    return total + calculateInstancePoints(block.start, block.end);
  }, 0);

  const completed = categoryBlocks
    .filter(block => block.status === 'completed')
    .reduce((total, block) => {
      return total + calculateInstancePoints(block.start, block.end);
    }, 0);

  return {
    planned,
    completed,
    remaining: planned - completed
  };
}

/**
 * Check if daily points target is met (96 points)
 */
export function isDailyTargetMet(blocks: TimeBlockInstance[]): boolean {
  const totalPlanned = calculateTotalPlannedPoints(blocks);
  return totalPlanned === 96;
}

/**
 * Get points breakdown by category name for export
 */
export function getPointsBreakdownForExport(
  blocks: TimeBlockInstance[],
  categories: Category[]
): Record<string, { planned: number; completed: number }> {
  const categoryPoints = calculateCategoryPoints(blocks, categories);
  const breakdown: Record<string, { planned: number; completed: number }> = {};

  categoryPoints.forEach(cp => {
    const category = categories.find(cat => cat.id === cp.categoryId);
    if (category) {
      const key = category.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      breakdown[key] = {
        planned: cp.planned,
        completed: cp.completed
      };
    }
  });

  return breakdown;
}

