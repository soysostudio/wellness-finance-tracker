import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';

export const DEFAULT_TIMEZONE = 'America/Bogota';

/**
 * Given a Date already shifted to the target tz wall-clock (via toZonedTime),
 * turn a wall-clock boundary back into the correct UTC instant.
 * Ej: medianoche Bogotá del 1 → 05:00Z, no 00:00Z.
 */
function utcBoundary(wallClock: Date, timezone: string): string {
  return fromZonedTime(wallClock, timezone).toISOString();
}

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
    start: utcBoundary(startOfMonth(now), timezone),
    end:   utcBoundary(endOfMonth(now), timezone),
  };
}

export function getLastMonthRange(timezone = DEFAULT_TIMEZONE) {
  const now = toZonedTime(new Date(), timezone);
  const lastMonth = subMonths(now, 1);
  return {
    start: utcBoundary(startOfMonth(lastMonth), timezone),
    end:   utcBoundary(endOfMonth(lastMonth), timezone),
  };
}

/** Returns start/end for a specific "YYYY-MM" string, in Bogota timezone. */
export function getMonthRange(yearMonth: string, timezone = DEFAULT_TIMEZONE) {
  const [year, month] = yearMonth.split("-").map(Number);
  // Use the 15th in UTC — converting to Bogota (UTC-5) can never push the
  // 15th into a different month, so startOfMonth/endOfMonth land correctly.
  const midMonth = toZonedTime(new Date(Date.UTC(year, month - 1, 15)), timezone);
  return {
    start: utcBoundary(startOfMonth(midMonth), timezone),
    end:   utcBoundary(endOfMonth(midMonth), timezone),
  };
}

export function getCurrentWeekRange(timezone = DEFAULT_TIMEZONE) {
  const now = toZonedTime(new Date(), timezone);
  return {
    start: utcBoundary(startOfWeek(now, { weekStartsOn: 1 }), timezone),
    end:   utcBoundary(endOfWeek(now, { weekStartsOn: 1 }), timezone),
  };
}

/**
 * period_start / period_end (YYYY-MM-DD) para un presupuesto, según la fecha
 * ACTUAL en Bogotá (no la UTC del servidor). Solo usa partes de calendario, así
 * que el string de fecha es correcto sin importar la tz del runtime.
 */
export function getBudgetPeriodDates(
  period: string,
  timezone = DEFAULT_TIMEZONE,
): { period_start: string; period_end: string } {
  const now = toZonedTime(new Date(), timezone); // wall-clock Bogotá
  const y = now.getFullYear();
  const m = now.getMonth();
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  if (period === 'weekly') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(y, m, now.getDate() + diffToMonday);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { period_start: iso(monday), period_end: iso(sunday) };
  }
  if (period === 'yearly') {
    return { period_start: `${y}-01-01`, period_end: `${y}-12-31` };
  }
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { period_start: iso(start), period_end: iso(end) };
}
