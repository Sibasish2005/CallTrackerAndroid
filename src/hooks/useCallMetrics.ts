import { useMemo } from 'react';
import { CallRecord, EmployeeMetrics } from '../types';
import { isTimestampToday } from '../utils/dateRange';

export function calculateMetrics(calls: CallRecord[]): EmployeeMetrics {
  if (!calls || calls.length === 0) {
    return {
      totalAttempts: 0,
      totalConnected: 0,
      totalUnconnected: 0,
      connectionRatePercent: 0,
      totalDurationSeconds: 0,
      averageDurationSeconds: 0,
      outcomeDistribution: {},
    };
  }

  let attempts = 0;
  let connectedCount = 0;
  let unconnectedCount = 0;
  let totalDuration = 0;
  const outcomeCounts: Record<string, number> = {};

  for (const call of calls) {
    const duration = call.durationSeconds ?? call.duration ?? 0;
    attempts++;

    // Authoritative connection check (OFFHOOK reached or valid talk time)
    const isConnected =
      call.connected === true ||
      (duration > 0 && call.type !== 3 && call.type !== 5);

    if (isConnected) {
      connectedCount++;
      totalDuration += duration;
    } else {
      unconnectedCount++;
    }

    if (call.outcomeId) {
      outcomeCounts[call.outcomeId] = (outcomeCounts[call.outcomeId] || 0) + 1;
    }
  }

  const connectionRate =
    attempts > 0 ? Math.round((connectedCount / attempts) * 100) : 0;

  const avgDuration =
    connectedCount > 0 ? Math.round(totalDuration / connectedCount) : 0;

  return {
    totalAttempts: attempts,
    totalConnected: connectedCount,
    totalUnconnected: unconnectedCount,
    connectionRatePercent: connectionRate,
    totalDurationSeconds: totalDuration,
    averageDurationSeconds: avgDuration,
    outcomeDistribution: outcomeCounts,
  };
}

export interface CallMetricsResult {
  todayCalls: CallRecord[];
  todayMetrics: EmployeeMetrics;
  lifetimeMetrics: EmployeeMetrics;
}

export function useCallMetrics(
  allCalls: CallRecord[],
  appOnlyCalls?: CallRecord[]
): CallMetricsResult {
  return useMemo(() => {
    // 1. Filter strictly for local calendar day (Today 00:00 -> now)
    const todayCalls = (allCalls || []).filter(call => {
      const timestamp = Number(call.startedAt || call.date || 0);
      return isTimestampToday(timestamp);
    });

    // 2. Today-only metrics (for Dashboard and Daily Analytics)
    const todayMetrics = calculateMetrics(todayCalls);

    // 3. Lifetime metrics: Strictly calculated from calls initiated within HEEYAKU app
    // If appOnlyCalls is provided, use it directly (unlimited, app-only history)
    // Otherwise fallback to filtering allCalls by isAppInitiated
    const lifetimeSource = appOnlyCalls !== undefined
      ? appOnlyCalls
      : (allCalls || []).filter(c => c.isAppInitiated === true);

    const lifetimeMetrics = calculateMetrics(lifetimeSource);

    return {
      todayCalls,
      todayMetrics,
      lifetimeMetrics,
    };
  }, [allCalls, appOnlyCalls]);
}
