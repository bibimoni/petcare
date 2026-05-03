import { APP_TIMEZONE_OFFSET_HOURS } from '../constants/constants';

export function appDateFromParts(
  year: number,
  month: number,
  day: number,
  offsetHours: number = APP_TIMEZONE_OFFSET_HOURS,
): Date {
  return new Date(Date.UTC(year, month, day) - offsetHours * 60 * 60 * 1000);
}

export function appNow(): Date {
  return new Date();
}

export function appDateParts(
  date: Date = new Date(),
  offsetHours: number = APP_TIMEZONE_OFFSET_HOURS,
): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

export function appStartOfDay(
  date: Date = new Date(),
  offsetHours: number = APP_TIMEZONE_OFFSET_HOURS,
): Date {
  const { year, month, day } = appDateParts(date, offsetHours);
  return appDateFromParts(year, month, day, offsetHours);
}

export function parseDateInAppTimezone(
  dateStr: string,
  offsetHours: number = APP_TIMEZONE_OFFSET_HOURS,
): Date {
  const dateOnly = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return appDateFromParts(
      parseInt(dateOnly[1]),
      parseInt(dateOnly[2]) - 1,
      parseInt(dateOnly[3]),
      offsetHours,
    );
  }
  return new Date(dateStr);
}

export function appPeriodKey(
  date: Date | string,
  offsetHours: number = APP_TIMEZONE_OFFSET_HOURS,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { year, month, day } = appDateParts(d, offsetHours);
  return new Date(Date.UTC(year, month, day)).toISOString();
}

export function tzInterval(
  offsetHours: number = APP_TIMEZONE_OFFSET_HOURS,
): string {
  return `${offsetHours} hours`;
}

