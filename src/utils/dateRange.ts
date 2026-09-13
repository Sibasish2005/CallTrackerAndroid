/**
 * Authoritative Date-Range Service for HEEYAKU Call Tracker
 * Handles local calendar day calculations for Daily (Today), Monthly, and Lifetime
 */

export interface DateRange {
  startMs: number;
  endMs: number;
  label: string;
}

export interface DayBucket {
  dayNumber: number;        // 1 to 31
  dateString: string;       // e.g. "Sep 12"
  dayTimestamp: number;     // start of day epoch ms
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Returns epoch timestamp for the exact start of today in the device's local time (00:00:00.000)
 */
export function getTodayStartTimestamp(): number {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, 0, 0, 0
  );
  return startOfToday.getTime();
}


/**
 * Checks if a given timestamp occurred strictly today (local calendar day)
 */
export function isTimestampToday(timestamp: number): boolean {
  return timestamp >= getTodayStartTimestamp() && timestamp <= Date.now();
}

/**
 * Returns the Monthly range and valid day buckets for a selected year and month (0-indexed).
 * For the CURRENT month: strictly limits to Day 1 -> TODAY. Never includes future fake dates.
 * For a COMPLETED month: Day 1 -> last day of that month.
 */
export function getMonthRange(year: number, monthIndex: number): {
  range: DateRange;
  days: DayBucket[];
  monthLabel: string;
  isCurrentMonth: boolean;
} {
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === monthIndex;

  const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const totalDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // For current month, last valid day is TODAY. For completed months, it's the last day of month.
  const maxDay = isCurrentMonth ? now.getDate() : totalDaysInMonth;

  const endOfMonth = isCurrentMonth
    ? now
    : new Date(year, monthIndex, totalDaysInMonth, 23, 59, 59, 999);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const monthLabel = `${monthNames[monthIndex]} ${year}`;
  const shortMonth = shortMonths[monthIndex];

  const days: DayBucket[] = [];
  for (let d = 1; d <= maxDay; d++) {
    const dayDate = new Date(year, monthIndex, d, 0, 0, 0, 0);
    const dayFormatted = `${shortMonth} ${d < 10 ? '0' + d : d}`;
    days.push({
      dayNumber: d,
      dateString: dayFormatted,
      dayTimestamp: dayDate.getTime(),
      isToday: isCurrentMonth && d === now.getDate(),
      isFuture: false,
    });
  }

  return {
    range: {
      startMs: startOfMonth.getTime(),
      endMs: endOfMonth.getTime(),
      label: monthLabel,
    },
    days,
    monthLabel,
    isCurrentMonth,
  };
}
