import { Checklist } from '@/types';
import { parseDateString, formatDateString } from './time';

export interface ChallengeStats {
  currentStreak: number;
  longestStreak: number;
  currentStreakStart: string | null;
  longestStreakStart: string | null;
  longestStreakEnd: string | null;
  totalSuccessfulDays: number;
  lastCalculated: string;
}

export interface ChallengeConfig {
  successThreshold: number; // Percentage (e.g., 75 means 75%)
  name: string; // e.g., "30-Day Challenge", "Consistency Quest"
}

/**
 * Calculate challenge streaks from checklist history
 * A day counts toward the streak if successRate >= threshold
 */
export function calculateChallengeStats(
  checklists: Checklist[],
  threshold: number = 75
): ChallengeStats {
  // Sort checklists by date (oldest first)
  const sorted = [...checklists].sort((a, b) => 
    parseDateString(a.date).getTime() - parseDateString(b.date).getTime()
  );

  let currentStreak = 0;
  let currentStreakStart: string | null = null;
  let longestStreak = 0;
  let longestStreakStart: string | null = null;
  let longestStreakEnd: string | null = null;
  let tempStreakStart: string | null = null;
  let totalSuccessfulDays = 0;

  // Track if we're currently in a streak
  let inStreak = false;
  let tempStreak = 0;

  for (const checklist of sorted) {
    const meetsThreshold = checklist.successRate >= threshold;

    if (meetsThreshold) {
      totalSuccessfulDays++;

      if (!inStreak) {
        // Starting a new streak
        inStreak = true;
        tempStreak = 1;
        tempStreakStart = checklist.date;
      } else {
        // Continuing streak
        tempStreak++;
      }

      // Check if this is the longest streak so far
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakStart = tempStreakStart;
        longestStreakEnd = checklist.date;
      }
    } else {
      // Streak broken
      inStreak = false;
      tempStreak = 0;
      tempStreakStart = null;
    }
  }

  // If we ended in a streak, that's our current streak
  if (inStreak) {
    currentStreak = tempStreak;
    currentStreakStart = tempStreakStart;
  }

  return {
    currentStreak,
    longestStreak,
    currentStreakStart,
    longestStreakStart,
    longestStreakEnd,
    totalSuccessfulDays,
    lastCalculated: formatDateString(new Date())
  };
}

/**
 * Get challenge display text
 */
export function getChallengeDisplayText(stats: ChallengeStats): string {
  if (stats.currentStreak === 0) {
    return "Start your challenge! 🎯";
  }
  
  if (stats.currentStreak === 1) {
    return "🔥 1 Day Challenge!";
  }

  return `🔥 ${stats.currentStreak} Day Challenge!`;
}

/**
 * Get motivational message based on streak
 */
export function getMotivationalMessage(stats: ChallengeStats): string {
  const { currentStreak, longestStreak } = stats;

  if (currentStreak === 0) {
    if (longestStreak > 0) {
      return `You've done ${longestStreak} days before - you can do it again! 💪`;
    }
    return "Every journey starts with a single day. Let's go! 🚀";
  }

  if (currentStreak === longestStreak && currentStreak > 1) {
    return "🎉 Personal record! Keep it going!";
  }

  if (currentStreak >= 7) {
    return "🔥 A full week! You're unstoppable!";
  }

  if (currentStreak >= 3) {
    return "💪 Building momentum! Don't break the chain!";
  }

  return "Great start! Keep going! 🌟";
}

/**
 * Check if today's checklist meets the challenge threshold
 */
export function meetsChallengeToday(
  todayChecklist: Checklist | undefined,
  threshold: number = 75
): boolean {
  if (!todayChecklist) return false;
  return todayChecklist.successRate >= threshold;
}
