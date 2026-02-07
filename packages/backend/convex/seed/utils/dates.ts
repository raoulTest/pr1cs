// ============================================================================
// DATE UTILITIES
// ============================================================================

export function getToday(): Date {
  return new Date();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  const isoString = date.toISOString();
  return isoString.split('T')[0] ?? isoString.substring(0, 10);
}

export function formatDateTime(date: Date): string {
  return date.toISOString();
}

export function getRandomDateInRange(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export function getRandomHour(): number {
  // Operating hours: 06:00 - 22:00
  return Math.floor(Math.random() * 16) + 6;
}

export function formatHour(hour: number): string {
  return hour.toString().padStart(2, '0') + ':00';
}

export function getDaysDifference(date1: Date, date2: Date): number {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  return Math.floor((time2 - time1) / (1000 * 60 * 60 * 24));
}

export function isDateInPast(date: Date, reference: Date = new Date()): boolean {
  return date < reference;
}

export function isDateInFuture(date: Date, reference: Date = new Date()): boolean {
  return date > reference;
}
