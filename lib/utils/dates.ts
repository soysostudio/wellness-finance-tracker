import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';

export const DEFAULT_TIMEZONE = 'America/Bogota';

export function nowInBogota(): Date {
  return toZonedTime(new Date(), DEFAULT_TIMEZONE);
}

export function toUTC(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return date.toISOString();
}

export function formatDateDisplay(
  isoDate: string,
  timezone = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(new Date(isoDate), timezone, "d 'de' MMMM", {});
}

export function formatDateTimeDisplay(
  isoDate: string,
  timezone = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(new Date(isoDate), timezone, "d MMM, h:mm a", {});
}

export function getCurrentMonthRange(timezone = DEFAULT_TIMEZONE) {
  const now = toZonedTime(new Date(), timezone);
  return {
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  };
}

export function getLastMonthRange(timezone = DEFAULT_TIMEZONE) {
  const now = toZonedTime(new Date(), timezone);
  const lastMonth = subMonths(now, 1);
  return {
    start: startOfMonth(lastMonth).toISOString(),
    end: endOfMonth(lastMonth).toISOString(),
  };
}

/** Returns start/end for a specific "YYYY-MM" string, in Bogota timezone. */
export function getMonthRange(yearMonth: string, timezone = DEFAULT_TIMEZONE) {
  const [year, month] = yearMonth.split("-").map(Number);
  // Use the 15th in UTC — converting to Bogota (UTC-5) can never push the
  // 15th into a different month, so startOfMonth/endOfMonth land correctly.
  const midMonth = toZonedTime(new Date(Date.UTC(year, month - 1, 15)), timezone);
  return {
    start: startOfMonth(midMonth).toISOString(),
    end:   endOfMonth(midMonth).toISOString(),
  };
}

export function getCurrentWeekRange(timezone = DEFAULT_TIMEZONE) {
  const now = toZonedTime(new Date(), timezone);
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    end: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
  };
}
