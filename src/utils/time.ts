import { format, parse, differenceInMinutes, isToday, startOfDay, addDays, isWeekend } from 'date-fns';

/**
 * Convert HH:mm time string to Date object for a specific date
 */
export function timeStringToDate(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Convert Date object to HH:mm time string
 */
export function dateToTimeString(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Calculate points for a time block (duration in minutes / 10)
 */
export function calculateBlockPoints(startTime: string, endTime: string): number {
  const today = new Date();
  const start = timeStringToDate(startTime, today);
  const end = timeStringToDate(endTime, today);
  
  // Handle blocks that cross midnight
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const durationMinutes = differenceInMinutes(end, start);
  return Math.round(durationMinutes / 10);
}

/**
 * Calculate points for a time block instance
 */
export function calculateInstancePoints(start: Date, end: Date): number {
  const durationMinutes = differenceInMinutes(end, start);
  return Math.round(durationMinutes / 10);
}

/**
 * Check if a time is within a time range
 */
export function isTimeInRange(time: Date, start: Date, end: Date): boolean {
  return time >= start && time <= end;
}

/**
 * Get current time as HH:mm string
 */
export function getCurrentTimeString(): string {
  return format(new Date(), 'HH:mm');
}

/**
 * Get current date as YYYY-MM-DD string in local timezone
 */
let lastDateResult: string | null = null;

export function getCurrentDateString(): string {
  const now = new Date();
  // Ensure we get the local date, not UTC
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const result = format(localDate, 'yyyy-MM-dd');
  // Only log if we haven't logged this result recently
  if (lastDateResult !== result) {
    console.log('📅 getCurrentDateString:', result);
    lastDateResult = result;
  }
  return result;
}

/**
 * Parse YYYY-MM-DD date string to Date object
 */
export function parseDateString(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

/**
 * Format Date object to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Check if a date is a weekday (Monday-Friday)
 */
export function isWeekday(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Get the next weekday from a given date
 */
export function getNextWeekday(date: Date): Date {
  let nextDay = addDays(date, 1);
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

/**
 * Get weekday dates for the current week
 */
export function getCurrentWeekdays(): Date[] {
  const today = new Date();
  const weekdays: Date[] = [];
  
  // Find Monday of current week
  const dayOfWeek = today.getDay();
  const monday = addDays(today, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Add Monday through Friday
  for (let i = 0; i < 5; i++) {
    weekdays.push(addDays(monday, i));
  }
  
  return weekdays;
}

/**
 * Check if it's after 21:00 (9 PM) - time for checklist
 */
export function isChecklistTime(): boolean {
  const now = new Date();
  const checklistTime = new Date(now);
  checklistTime.setHours(21, 0, 0, 0);
  return now >= checklistTime;
}

/**
 * Check if it's after 23:30 - time for lights out prompt
 */
export function isLightsOutTime(): boolean {
  const now = new Date();
  const lightsOutTime = new Date(now);
  lightsOutTime.setHours(23, 30, 0, 0);
  return now >= lightsOutTime;
}

