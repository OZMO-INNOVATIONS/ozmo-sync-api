/**
 * Central date formatting utilities for OZMO SYNC API.
 * All dates/times in API responses must go through these helpers
 * to ensure a consistent, human-readable format across all endpoints.
 *
 * Output format examples:
 *   formatDateTime  → "06 Jun 2026, 01:29 PM"
 *   formatDate      → "06 Jun 2026"
 *   formatTime      → "01:29 PM"
 *   formatDuration  → "2h 30m"  or  "45m"
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * "06 Jun 2026, 01:29 PM"
 */
export function formatDateTime(value: string | Date | null | undefined): string | null {
  const d = toDate(value);
  if (!d) return null;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[d.getUTCMonth()];
  const yyyy = d.getUTCFullYear();
  const hh24 = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const period = hh24 >= 12 ? 'PM' : 'AM';
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
  return `${dd} ${mon} ${yyyy}, ${String(hh12).padStart(2, '0')}:${mm} ${period}`;
}

/**
 * "06 Jun 2026"
 */
export function formatDate(value: string | Date | null | undefined): string | null {
  const d = toDate(value);
  if (!d) return null;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[d.getUTCMonth()];
  const yyyy = d.getUTCFullYear();
  return `${dd} ${mon} ${yyyy}`;
}

/**
 * "01:29 PM"
 */
export function formatTime(value: string | Date | null | undefined): string | null {
  const d = toDate(value);
  if (!d) return null;
  const hh24 = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const period = hh24 >= 12 ? 'PM' : 'AM';
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
  return `${String(hh12).padStart(2, '0')}:${mm} ${period}`;
}

/**
 * Formats a duration in minutes as "2h 30m" or "45m".
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Formats summary duration in minutes strictly as "Xh Ym" (e.g., "5h 0m").
 */
export function formatSummaryDuration(totalMinutes: number): string {
  const h = Math.floor(Math.max(0, totalMinutes) / 60);
  const m = Math.max(0, totalMinutes) % 60;
  return `${h}h ${m}m`;
}

