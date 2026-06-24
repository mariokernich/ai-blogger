import type { DateRange } from '../types.js';

/**
 * Computes the previous full week (Monday 00:00:00 .. Sunday 23:59:59)
 * relative to "now", interpreted in Europe/Berlin time.
 *
 * The cron runs Monday 08:00 Berlin time, so "previous week" is the
 * Monday–Sunday block that ended the day before.
 */
export function getPreviousWeek(now: Date = new Date()): DateRange {
  // Work in Berlin local time by computing the offset.
  const berlinNow = toBerlin(now);

  // JS: 0 = Sunday ... 6 = Saturday. Convert to ISO (Mon=1..Sun=7).
  const isoDay = berlinNow.getUTCDay() === 0 ? 7 : berlinNow.getUTCDay();

  // Monday of the current week (Berlin), at 00:00.
  const thisMonday = new Date(berlinNow);
  thisMonday.setUTCDate(berlinNow.getUTCDate() - (isoDay - 1));
  thisMonday.setUTCHours(0, 0, 0, 0);

  // Previous week's Monday and Sunday.
  const prevMonday = new Date(thisMonday);
  prevMonday.setUTCDate(thisMonday.getUTCDate() - 7);

  const prevSunday = new Date(thisMonday);
  prevSunday.setUTCDate(thisMonday.getUTCDate() - 1);
  prevSunday.setUTCHours(23, 59, 59, 999);

  return {
    start: fromBerlin(prevMonday).toISOString(),
    end: fromBerlin(prevSunday).toISOString(),
    label: isoWeekLabel(prevMonday),
  };
}

/** Returns true if the ISO timestamp falls within [start, end]. */
export function isWithin(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= new Date(range.start).getTime() && t <= new Date(range.end).getTime();
}

/** Approximate Berlin offset (CET/CEST). Uses Intl for DST correctness. */
function berlinOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUTC - date.getTime()) / 60000;
}

function toBerlin(date: Date): Date {
  return new Date(date.getTime() + berlinOffsetMinutes(date) * 60000);
}

function fromBerlin(berlinDate: Date): Date {
  // berlinDate carries Berlin wall-clock in its UTC fields.
  const offset = berlinOffsetMinutes(berlinDate);
  return new Date(berlinDate.getTime() - offset * 60000);
}

function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
