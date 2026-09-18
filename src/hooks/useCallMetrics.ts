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

  // Sort chronologically (oldest first)
  const sortedCalls = [...calls].sort((a, b) => {
    const timeA = Number(a.startedAt || a.date || 0);
    const timeB = Number(b.startedAt || b.date || 0);
    return timeA - timeB;
  });

  // Group calls by lead
  const callsByLead = new Map<string, CallRecord[]>();
  for (const call of sortedCalls) {
    const cleanPhone = (call.phoneNumber || call.number || '').replace(/[^0-9]/g, '').slice(-10);
    const leadKey = call.leadId
      ? `lead_${call.leadId}`
      : cleanPhone
      ? `phone_${cleanPhone}`
      : `call_${call.id}`;

    if (!callsByLead.has(leadKey)) {
      callsByLead.set(leadKey, []);
    }
    callsByLead.get(leadKey)!.push(call);
  }

  let attempts = 0;
  let connectedCount = 0;
  let unconnectedCount = 0;
  let totalDuration = 0;
  let connectedDuration = 0;
  const outcomeCounts: Record<string, number> = {};

  for (const [, leadCalls] of callsByLead.entries()) {
    // Check if ANY call to this lead was connected
    const connectedCall = leadCalls.find((call) => {
      const duration = call.durationSeconds ?? call.duration ?? 0;
      return call.connected !== undefined
        ? Boolean(call.connected)
        : duration > 0 && call.type !== 3 && call.type !== 5;
    });

    if (connectedCall) {
      // RULE: Once a lead is connected, more than one call will not be counted as more than one call on one lead.
      // A connected lead counts as exactly 1 call (1 attempt, 1 connected).
      attempts += 1;
      connectedCount += 1;

      for (const call of leadCalls) {
        const duration = call.durationSeconds ?? call.duration ?? 0;
        totalDuration += duration;
      }
      const connDur = connectedCall.durationSeconds ?? connectedCall.duration ?? 0;
      connectedDuration += connDur > 0 ? connDur : (leadCalls[0].durationSeconds ?? leadCalls[0].duration ?? 0);

      const outcome = connectedCall.outcomeId || leadCalls[leadCalls.length - 1].outcomeId;
      if (outcome) {
        const outcomeKey = outcome.toLowerCase();
        outcomeCounts[outcomeKey] = (outcomeCounts[outcomeKey] || 0) + 1;
      }
    } else {
      // For leads that were NEVER connected, count each individual attempt
      for (const call of leadCalls) {
        attempts += 1;
        unconnectedCount += 1;
        const duration = call.durationSeconds ?? call.duration ?? 0;
        totalDuration += duration;

        if (call.outcomeId) {
          const outcomeKey = call.outcomeId.toLowerCase();
          outcomeCounts[outcomeKey] = (outcomeCounts[outcomeKey] || 0) + 1;
        }
      }
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
