import { Timestamp } from 'firebase/firestore';

/**
 * Converts a Date or Timestamp to a Date object
 */
export function toDate(date: Date | Timestamp): Date {
  return date instanceof Date ? date : date.toDate();
}

/**
 * Converts a Date or Timestamp to a local date string
 */
export function toLocaleDateString(date: Date | Timestamp): string {
  return toDate(date).toLocaleDateString();
}

/**
 * Converts a Date or Timestamp to a local time string
 */
export function toLocaleTimeString(date: Date | Timestamp): string {
  return toDate(date).toLocaleTimeString();
}

/**
 * Converts a Date or Timestamp to an ISO string
 */
export function toISOString(date: Date | Timestamp): string {
  return toDate(date).toISOString();
}

/**
 * Gets the time from a Date or Timestamp
 */
export function getTime(date: Date | Timestamp): number {
  return toDate(date).getTime();
}
