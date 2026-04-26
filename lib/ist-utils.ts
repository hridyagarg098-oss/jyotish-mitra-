// IST-first: all times are India Standard Time (UTC+5:30) — this IS the source
// /lib/ist-utils.ts
// Single source of truth for all IST time operations in Jyotish Mitra.
// NEVER use `new Date()` directly anywhere in this codebase.
// Always import from this file.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19800000ms = 5h30m

/**
 * Get current IST date-time as a Date object.
 * The returned Date's UTC fields give the correct IST wall-clock values.
 */
export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/**
 * Convert any UTC Date to IST Date.
 * Use for display — never for storage.
 */
export function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET_MS);
}

/**
 * Convert IST Date to UTC for storage.
 * Supabase always stores UTC — always call this before writing timestamps.
 */
export function istToUTC(istDate: Date): Date {
  return new Date(istDate.getTime() - IST_OFFSET_MS);
}

/**
 * Get today's date string in IST as YYYY-MM-DD.
 * Used for rashifal cache keys and daily resets.
 * Rolls over at IST midnight (18:30 UTC previous day), NOT UTC midnight (05:30 IST).
 */
export function todayIST(): string {
  const ist = nowIST();
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get current IST hour (0-23).
 * Used for muhurat checks and time-based UI logic.
 */
export function currentHourIST(): number {
  return nowIST().getUTCHours();
}

/**
 * Convert birth time (IST) + date to Julian Day Number (UT).
 * CRITICAL: birth time entered by user is ALWAYS IST.
 * Astronomical math requires UT — this function does the conversion.
 *
 * @param dateStr — "YYYY-MM-DD" (birth date in IST calendar)
 * @param timeStr — "HH:MM" (birth time in IST, 24-hour)
 * @returns Julian Day Number in Universal Time
 */
export function birthTimeISTtoJD(dateStr: string, timeStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Convert IST → UT: subtract 5h 30m
  let utHour   = hour - 5;
  let utMinute = minute - 30;
  let utDay    = day;
  let utMonth  = month;
  let utYear   = year;

  if (utMinute < 0) {
    utMinute += 60;
    utHour   -= 1;
  }
  if (utHour < 0) {
    utHour += 24;
    utDay  -= 1;
    if (utDay < 1) {
      utMonth -= 1;
      if (utMonth < 1) { utMonth = 12; utYear -= 1; }
      utDay = daysInMonth(utMonth, utYear);
    }
  }

  // Julian Day Number (Meeus, "Astronomical Algorithms" Ch.7)
  let Y = utYear;
  let M = utMonth;
  const D = utDay + (utHour + utMinute / 60) / 24;

  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

/**
 * Get IST midnight as UTC Date — for Supabase range queries.
 * "Today's data since IST midnight" = since 18:30 UTC of previous day.
 */
export function istMidnightAsUTC(): Date {
  // Parse today's IST date string and create midnight IST
  const todayStr = todayIST(); // "YYYY-MM-DD"
  return new Date(`${todayStr}T00:00:00+05:30`);
}

/**
 * Format a UTC Date for display to Indian users (Hindi locale).
 * Always shows IST, regardless of server/browser timezone.
 * Example: "15 अक्टूबर 2024, 3:45 PM"
 */
export function formatISTDisplay(utcDate: Date): string {
  return utcDate.toLocaleString('hi-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a UTC Date for display in English with IST.
 * Example: "15 October 2024, 03:45 PM"
 */
export function formatISTDisplayEN(utcDate: Date): string {
  return utcDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format just the date portion in IST for display.
 * Example: "15 October 2024"
 */
export function formatISTDateEN(utcDate: Date): string {
  return utcDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get IST-based day-of-week name (for rashifal, muhurat etc.)
 */
export function dayNameIST(): string {
  return nowIST().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  });
}

/**
 * Rate-limit key using IST date — resets at IST midnight, not UTC midnight.
 */
export function rateLimitKeyIST(prefix: string, id: string): string {
  return `${prefix}_${id}_${todayIST()}`;
}

// ── Internal helper ──────────────────────────────────────────────────────────
function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
