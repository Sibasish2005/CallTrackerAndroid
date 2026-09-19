import { useCallback, useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import { CallRecord, EmployeeMetrics } from '../../types';
import { apiClient } from '../../services/apiClient';
import { assignedLeadsService } from '../../services/assignedLeadsService';

const { CallTracker } = NativeModules;
const CACHED_METRICS_KEY = 'heeyaku_cached_analytics';

interface RawCallData {
  id?: string | number;
  employeeId?: string;
  phoneNumber?: string;
  number?: string;
  contactName?: string;
  name?: string;
  callType?: 'OUTGOING' | 'INCOMING' | 'MISSED' | 'REJECTED';
  startedAt?: number | string;
  date?: number | string;
  endedAt?: number | string;
  durationSeconds?: number | string;
  duration?: number | string;
  connected?: boolean;
  outcomeId?: string;
  outcomeLabel?: string;
  notes?: string;
  createdAt?: number | string;
  type?: number | string;
}

export interface UseCallHistoryReturn {
  callHistory: CallRecord[];
  setCallHistory: React.Dispatch<React.SetStateAction<CallRecord[]>>;
  appCalls: CallRecord[];
  setAppCalls: React.Dispatch<React.SetStateAction<CallRecord[]>>;
  todayCalls: CallRecord[];
  todayMetrics: EmployeeMetrics | null;
  lifetimeMetrics: EmployeeMetrics | null;
  isLoadingHistory: boolean;
  loadAppCalls: () => Promise<void>;
  loadCallHistory: (showIndicator?: boolean) => Promise<void>;
}

function mapRawCallData(item: RawCallData): CallRecord {
  const duration = Number(item.durationSeconds ?? item.duration) || 0;
  const startedAt = Number(item.startedAt || item.date) || Date.now();
  const endedAt = Number(item.endedAt) || (startedAt + duration * 1000);
  const phone = item.phoneNumber || item.number || 'Unknown';
  const name = item.contactName || item.name || '';

  return {
    id: String(item.id),
    employeeId: item.employeeId || 'EMP-1001',
    phoneNumber: phone,
    contactName: name,
    callType: item.callType || 'OUTGOING',
    startedAt,
    endedAt,
    durationSeconds: duration,
    connected: Boolean(item.connected),
    outcomeId: item.outcomeId,
    outcomeLabel: item.outcomeLabel,
    notes: item.notes,
    createdAt: Number(item.createdAt || startedAt),
    number: phone,
    name,
    duration,
    date: startedAt,
    type: 2,
    isAppInitiated: true,
    synced: true,
  };
}

export function useCallHistory(
  getOutcomeForCall?: (callId: string) => { outcomeId: string; outcomeLabel: string; notes?: string } | undefined,
  onLatestCallFound?: (call: CallRecord) => void
): UseCallHistoryReturn {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [appCalls, setAppCalls] = useState<CallRecord[]>([]);
  const [todayCalls, setTodayCalls] = useState<CallRecord[]>([]);
  const [todayMetrics, setTodayMetrics] = useState<EmployeeMetrics | null>(null);
  const [lifetimeMetrics, setLifetimeMetrics] = useState<EmployeeMetrics | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Hydrate cached backend metrics on mount
  useEffect(() => {
    async function hydrateCache() {
      try {
        if (CallTracker?.getItem) {
          const raw = await CallTracker.getItem(CACHED_METRICS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.todayMetrics) setTodayMetrics(parsed.todayMetrics);
            if (parsed.lifetimeMetrics) setLifetimeMetrics(parsed.lifetimeMetrics);
            if (Array.isArray(parsed.todayCalls)) setTodayCalls(parsed.todayCalls);
          }
        }
      } catch (e) {
        console.log('Error hydrating cached analytics:', e);
      }
    }
    hydrateCache();
  }, []);

  // Fetch HEEYAKU app-initiated call history & authoritative metrics directly from backend PostgreSQL DB
  const loadAppCalls = useCallback(async () => {
    try {
      // Sync assigned leads list alongside analytics
      assignedLeadsService.refreshAssignedLeads().catch(() => {});

      const res = await apiClient.getAnalytics();
      if (res.success) {
        if (res.todayMetrics) setTodayMetrics(res.todayMetrics);
        if (res.lifetimeMetrics) setLifetimeMetrics(res.lifetimeMetrics);

        let mappedToday: CallRecord[] = [];
        if (Array.isArray(res.todayCalls)) {
          mappedToday = (res.todayCalls as RawCallData[]).map(mapRawCallData);
          setTodayCalls(mappedToday);
        }

        if (Array.isArray(res.allCalls)) {
          const mappedAll: CallRecord[] = (res.allCalls as RawCallData[]).map(mapRawCallData);
          setAppCalls(mappedAll);

          // Keep local native storage in lockstep with the backend DB
          if (CallTracker?.setItem) {
            CallTracker.setItem('calls_list', JSON.stringify(mappedAll)).catch(() => {});
            CallTracker.setItem(
              CACHED_METRICS_KEY,
              JSON.stringify({
                todayMetrics: res.todayMetrics,
                lifetimeMetrics: res.lifetimeMetrics,
                todayCalls: mappedToday,
              })
            ).catch(() => {});
          }
          return;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('Backend sync in loadAppCalls failed, falling back to local:', message);
    }

    // Fallback: Read local device cache if offline
    try {
      if (CallTracker?.getAppCalls) {
        const rawAppCalls = (await CallTracker.getAppCalls()) as RawCallData[];
        if (Array.isArray(rawAppCalls)) {
          const mapped: CallRecord[] = rawAppCalls.map((item, index) => {
            const id = String(item.id || `app_${item.date || Date.now()}_${index}`);
            const durationSecs = Number(item.duration) || 0;
            const isConnected = item.connected === true || durationSecs > 0;
            const savedOutcome = getOutcomeForCall?.(id);
            const outcomeId = item.outcomeId || savedOutcome?.outcomeId;
            const outcomeLabel = item.outcomeLabel || savedOutcome?.outcomeLabel;
            const notes = item.notes || savedOutcome?.notes;
            return {
              id,
              employeeId: 'EMP-1001',
              phoneNumber: item.number || 'Unknown',
              contactName: item.name || '',
              callType: 'OUTGOING',
              startedAt: Number(item.date) || Date.now(),
              endedAt: Number(item.date) + durationSecs * 1000,
              durationSeconds: durationSecs,
              connected: isConnected,
              outcomeId,
              outcomeLabel,
              notes,
              createdAt: Number(item.date) || Date.now(),
              number: item.number || 'Unknown',
              name: item.name || '',
              duration: durationSecs,
              date: Number(item.date) || Date.now(),
              type: 2,
              isAppInitiated: true,
            };
          });
          setAppCalls(mapped);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log('Error loading app calls fallback:', message);
    }
  }, [getOutcomeForCall]);

  // Fetch call history from native CallLog (up to 200 records)
  const loadCallHistory = useCallback(
    async (showIndicator = false) => {
      try {
        if (showIndicator) {
          setIsLoadingHistory(true);
        }

        // When showing indicator (e.g. refresh), enforce a smooth minimum delay
        // to prevent instant flickering and accommodate future server latency
        const minDelay = showIndicator
          ? new Promise<void>(resolve => setTimeout(() => resolve(), 500))
          : Promise.resolve();

        let rawHistoryPromise: Promise<RawCallData[]> = Promise.resolve([]);
        if (CallTracker?.getCallHistory) {
          rawHistoryPromise = CallTracker.getCallHistory(200);
        }

        // Authoritative sync: Await both backend DB calls (appCalls) and native device history
        const [, rawHistory] = await Promise.all([
          loadAppCalls(),
          rawHistoryPromise,
          minDelay,
        ]);
        if (Array.isArray(rawHistory)) {
          const mapped: CallRecord[] = rawHistory.map((item, index) => {
            const rawType = Number(item.type) || 2;
            const callType =
              rawType === 1
                ? 'INCOMING'
                : rawType === 3
                ? 'MISSED'
                : rawType === 5
                ? 'REJECTED'
                : 'OUTGOING';

            const durationSecs = Number(item.duration) || 0;
            const isConnected = durationSecs > 0 && rawType !== 3 && rawType !== 5;
            const id = String(item.id || `${item.date || Date.now()}_${index}`);
            const savedOutcome = getOutcomeForCall?.(id);

            return {
              id,
              employeeId: 'EMP-1082',
              phoneNumber: item.number || 'Unknown',
              contactName: item.name || '',
              callType,
              startedAt: Number(item.date) || Date.now(),
              endedAt: Number(item.date) + durationSecs * 1000,
              durationSeconds: durationSecs,
              connected: isConnected,
              outcomeId: savedOutcome?.outcomeId,
              outcomeLabel: savedOutcome?.outcomeLabel,
              notes: savedOutcome?.notes,
              createdAt: Number(item.date) || Date.now(),
              number: item.number || 'Unknown',
              name: item.name || '',
              duration: durationSecs,
              date: Number(item.date) || Date.now(),
              type: rawType,
            };
          });

          // Strictly filter device history to only show assigned lead calls
          const assignedHistory = mapped.filter(item => {
            const phone = item.phoneNumber || item.number || '';
            return assignedLeadsService.isAssignedLeadNumber(phone);
          });

          setCallHistory(assignedHistory);
          if (assignedHistory.length > 0) {
            onLatestCallFound?.(assignedHistory[0]);
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.log('Error fetching call history:', message);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [getOutcomeForCall, loadAppCalls, onLatestCallFound]
  );

  return {
    callHistory,
    setCallHistory,
    appCalls,
    setAppCalls,
    todayCalls,
    todayMetrics,
    lifetimeMetrics,
    isLoadingHistory,
    loadAppCalls,
    loadCallHistory,
  };
}
