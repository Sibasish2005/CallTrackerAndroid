/**
 * Canonical formatters for HEEYAKU Call Tracker
 */

/**
 * Formats seconds into MM:SS (or HH:MM:SS / Xh Ym if > 60m) for active live call timers
 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats duration in human-readable conversational form (e.g., '1h 24m', '3m 12s', '45s', '0s')
 */
export function formatVerboseDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s === 0) return '0s';
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Formats timestamps into relative dates ('10:45 AM', 'Yesterday', 'Wed', 'MM/DD/YY')
 */
export function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);

  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  });
}
