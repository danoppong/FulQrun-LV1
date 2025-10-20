// src/lib/dashboard/timeperiod-utils.ts
// Utility functions for time period management and calculations
// Provides helpers for date range calculations and period formatting

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  label: string;
  days: number;
}

export interface PeriodComparison {
  current: TimeRange;
  previous: TimeRange;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'stable';
}

/**
 * Generate a time range for a given number of days from today
 */
export function generateTimeRange(days: number, label?: string): TimeRange {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return {
    startDate,
    endDate,
    label: label || `Last ${days} days`,
    days
  };
}

/**
 * Generate time range for current month
 */
export function getCurrentMonth(): TimeRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate,
    endDate,
    label: 'This Month',
    days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Generate time range for current quarter
 */
export function getCurrentQuarter(): TimeRange {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startDate = new Date(now.getFullYear(), quarter * 3, 1);
  const endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  
  return {
    startDate,
    endDate,
    label: `Q${quarter + 1} ${now.getFullYear()}`,
    days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Generate time range for current year
 */
export function getCurrentYear(): TimeRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1);
  const endDate = new Date(now.getFullYear(), 11, 31);
  
  return {
    startDate,
    endDate,
    label: now.getFullYear().toString(),
    days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Generate previous period for comparison
 */
export function getPreviousPeriod(currentRange: TimeRange): TimeRange {
  const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
  const previousEndDate = new Date(currentRange.startDate.getTime() - 1);
  const previousStartDate = new Date(previousEndDate.getTime() - duration);
  
  return {
    startDate: previousStartDate,
    endDate: previousEndDate,
    label: `Previous ${currentRange.days} days`,
    days: currentRange.days
  };
}

/**
 * Create period comparison data
 */
export function createPeriodComparison(
  currentRange: TimeRange,
  currentValue: number,
  previousValue: number
): PeriodComparison {
  const changePercent = previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100;
  
  let changeDirection: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) > 0.1) {
    changeDirection = changePercent > 0 ? 'up' : 'down';
  }
  
  return {
    current: currentRange,
    previous: getPreviousPeriod(currentRange),
    changePercent: Math.abs(changePercent),
    changeDirection
  };
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date, format: 'short' | 'long' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = format === 'short' 
    ? { month: 'short', day: 'numeric' }
    : { month: 'long', day: 'numeric', year: 'numeric' };
    
  const start = startDate.toLocaleDateString('en-US', options);
  const endOptions: Intl.DateTimeFormatOptions = format === 'short' && startDate.getFullYear() === endDate.getFullYear()
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : options;
    
  const end = endDate.toLocaleDateString('en-US', endOptions);
  
  return `${start} - ${end}`;
}

/**
 * Check if a date range is valid
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate && startDate <= new Date() && endDate <= new Date();
}

/**
 * Get relative time period labels
 */
export function getRelativeTimeLabel(days: number): string {
  if (days === 1) return 'Yesterday';
  if (days === 7) return 'Last Week';
  if (days === 14) return 'Last 2 Weeks';
  if (days === 30) return 'Last Month';
  if (days === 60) return 'Last 2 Months';
  if (days === 90) return 'Last Quarter';
  if (days === 180) return 'Last 6 Months';
  if (days === 365) return 'Last Year';
  
  if (days < 30) return `Last ${days} Days`;
  if (days < 365) return `Last ${Math.round(days / 30)} Months`;
  return `Last ${Math.round(days / 365)} Years`;
}

/**
 * Calculate business days between two dates (excluding weekends)
 */
export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let businessDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}

/**
 * Get common pharmaceutical reporting periods
 */
export function getPharmaPeriods(): Array<{ id: string; label: string; range: TimeRange }> {
  return [
    { id: 'last_7_days', label: 'Last 7 Days', range: generateTimeRange(7) },
    { id: 'last_14_days', label: 'Last 14 Days', range: generateTimeRange(14) },
    { id: 'last_30_days', label: 'Last 30 Days', range: generateTimeRange(30) },
    { id: 'last_60_days', label: 'Last 60 Days', range: generateTimeRange(60) },
    { id: 'last_90_days', label: 'Last 90 Days', range: generateTimeRange(90) },
    { id: 'this_month', label: 'This Month', range: getCurrentMonth() },
    { id: 'this_quarter', label: 'This Quarter', range: getCurrentQuarter() },
    { id: 'this_year', label: 'This Year', range: getCurrentYear() },
  ];
}

/**
 * Adjust time range for timezone
 */
export function adjustForTimezone(date: Date, timezone?: string): Date {
  if (!timezone) return date;
  
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const targetTime = new Date(utcTime);
  
  return targetTime;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(days: number): string {
  if (days < 1) return 'Less than a day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
  if (days < 365) return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
  return `${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? '' : 's'}`;
}