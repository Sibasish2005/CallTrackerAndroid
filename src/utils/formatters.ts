import { CallRecord, CallType, CallTypeMeta } from '../types';

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

export function formatStopwatch(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTalkTime(seconds: number): string {
  return formatVerboseDuration(seconds);
}

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

export function formatCallTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  
  const diffDays = Math.floor((now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
}

export function formatCallDate(timestamp: number): string {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isToday = now.toDateString() === date.toDateString();
  if (isToday) return `Today, ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();
  if (isYesterday) return `Yesterday, ${timeStr}`;

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export function getCallTypeMeta(type?: CallType | number, connected: boolean = true): CallTypeMeta {
  // Numeric mapping from Android CallLog.Calls: 1=incoming, 2=outgoing, 3=missed, 5=rejected
  if (type === 1 || type === 'INCOMING') {
    return {
      label: 'Incoming',
      icon: '↙',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.15)',
    };
  }

  if (type === 3 || type === 5 || type === 'MISSED' || type === 'REJECTED' || !connected) {
    return {
      label: 'Unconnected',
      icon: '↙',
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.15)',
    };
  }

  return {
    label: 'Outgoing',
    icon: '↗',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
  };
}

export function computeDashboardStats(history: CallRecord[]) {
  const totalCalls = history.length;
  let connectedCalls = 0;
  let missedCalls = 0;
  let outgoingCount = 0;
  let incomingCount = 0;
  let totalTalkTimeSeconds = 0;
  let longestCallSeconds = 0;

  for (const item of history) {
    const dur = item.durationSeconds ?? item.duration ?? 0;
    const type = item.type ?? item.callType;
    const isMissed = type === 3 || type === 5 || type === 'MISSED' || type === 'REJECTED';

    if (isMissed || dur === 0) {
      missedCalls++;
    } else {
      connectedCalls++;
      totalTalkTimeSeconds += dur;
      if (dur > longestCallSeconds) {
        longestCallSeconds = dur;
      }
    }

    if (type === 1 || type === 'INCOMING') incomingCount++;
    else if (isMissed) {}
    else outgoingCount++;
  }

  const avgDurationSeconds =
    connectedCalls > 0 ? Math.round(totalTalkTimeSeconds / connectedCalls) : 0;

  return {
    totalCalls,
    connectedCalls,
    missedCalls,
    outgoingCount,
    incomingCount,
    totalDuration: totalTalkTimeSeconds,
    totalTalkTimeSeconds,
    avgDurationSeconds,
    longestCallSeconds,
  };
}
