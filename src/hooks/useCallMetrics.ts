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

  // Sort chronologically (oldest first) so only the first connected call for a lead counts
  const sortedCalls = [...calls].sort((a, b) => {
    const timeA = Number(a.startedAt || a.date || 0);
    const timeB = Number(b.startedAt || b.date || 0);
    return timeA - timeB;
  });

  let attempts = 0;
  let connectedCount = 0;
  let unconnectedCount = 0;
  let totalDuration = 0;
  let connectedDuration = 0;
  const outcomeCounts: Record<string, number> = {};
  const seenConnectedLeads = new Set<string>();

  for (const call of sortedCalls) {
    const duration = call.durationSeconds ?? call.duration ?? 0;
    attempts++;
    totalDuration += duration;

    const leadKey = call.leadId
      ? `lead_${call.leadId}`
      : `phone_${(call.phoneNumber || call.number || '').replace(/[^0-9]/g, '').slice(-10)}`;

    // Authoritative connection check:
    // If call.connected is explicitly provided, adhere to it (backend DB source of truth)
    // Otherwise fallback to duration > 0 and non-missed/rejected
    const isRawConnected =
      call.connected !== undefined
        ? Boolean(call.connected)
        : duration > 0 && call.type !== 3 && call.type !== 5;

    // Enforce rule: only the first connected call for the same lead counts as connected
    if (isRawConnected && !seenConnectedLeads.has(leadKey)) {
      seenConnectedLeads.add(leadKey);
      connectedCount++;
      connectedDuration += duration;
    } else {
      unconnectedCount++;
    }

    if (call.outcomeId) {
      const outcomeKey = call.outcomeId.toLowerCase();
      outcomeCounts[outcomeKey] = (outcomeCounts[outcomeKey] || 0) + 1;
    }
  }

  const connectionRate =
    attempts > 0 ? Math.round((connectedCount / attempts) * 100) : 0;

  const avgDuration =
    connectedCount > 0 ? Math.round(connectedDuration / connectedCount) : 0;

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
    // 1. Sort all lifetime calls chronologically (oldest first)
    const lifetimeSource = appOnlyCalls !== undefined ? appOnlyCalls : (allCalls || []);
    const sortedLifetime = [...lifetimeSource].sort((a, b) => {
      const timeA = Number(a.startedAt || a.date || 0);
      const timeB = Number(b.startedAt || b.date || 0);
      return timeA - timeB;
    });

    // 2. Identify authoritative first connected call for each lead across all time
    const seenLifetimeLeads = new Set<string>();
    const firstConnectedCallIds = new Set<string>();

    for (const call of sortedLifetime) {
      const duration = call.durationSeconds ?? call.duration ?? 0;
      const isConnected =
        call.connected !== undefined
          ? Boolean(call.connected)
          : duration > 0 && call.type !== 3 && call.type !== 5;

      if (isConnected) {
        const leadKey = call.leadId
          ? `lead_${call.leadId}`
          : `phone_${(call.phoneNumber || call.number || '').replace(/[^0-9]/g, '').slice(-10)}`;

        if (leadKey && !seenLifetimeLeads.has(leadKey)) {
          seenLifetimeLeads.add(leadKey);
          firstConnectedCallIds.add(call.id);
        }
      }
    }

    // 3. Mark all calls with authoritative connected status
    const normalizedAllCalls = sortedLifetime.map((call) => ({
      ...call,
      connected: firstConnectedCallIds.has(call.id),
    }));

    // 4. Filter strictly for local calendar day (Today 00:00 -> now)
    const todayCalls = normalizedAllCalls
      .filter((call) => {
        const timestamp = Number(call.startedAt || call.date || 0);
        return isTimestampToday(timestamp);
      })
      .reverse(); // Most recent first for recent activity list

    // 5. Compute today and lifetime metrics
    const todayMetrics = calculateMetrics(todayCalls);
    const lifetimeMetrics = calculateMetrics(normalizedAllCalls);

    return {
      todayCalls,
      todayMetrics,
      lifetimeMetrics,
    };
  }, [allCalls, appOnlyCalls]);
}
