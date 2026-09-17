import { useCallback, useState } from 'react';
import { NativeModules } from 'react-native';
import { CallRecord } from '../../types';
import { apiClient } from '../../services/apiClient';

const { CallTracker } = NativeModules;

export interface UseCallHistoryReturn {
  callHistory: CallRecord[];
  setCallHistory: React.Dispatch<React.SetStateAction<CallRecord[]>>;
  appCalls: CallRecord[];
  setAppCalls: React.Dispatch<React.SetStateAction<CallRecord[]>>;
  isLoadingHistory: boolean;
  loadAppCalls: () => Promise<void>;
  loadCallHistory: (showIndicator?: boolean) => Promise<void>;
}

export function useCallHistory(
  getOutcomeForCall?: (callId: string) => { outcomeId: string; outcomeLabel: string; notes?: string } | undefined,
  onLatestCallFound?: (call: CallRecord) => void
): UseCallHistoryReturn {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [appCalls, setAppCalls] = useState<CallRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Fetch HEEYAKU app-initiated call history: Backend DB is the PRIMARY source of truth
  const loadAppCalls = useCallback(async () => {
    try {
      const res = await apiClient.getAnalytics();
      if (res.success && Array.isArray(res.allCalls)) {
        const mapped: CallRecord[] = res.allCalls.map((item: any) => ({
          id: String(item.id),
          employeeId: item.employeeId || 'EMP-1001',
          phoneNumber: item.phoneNumber || item.number || 'Unknown',
          contactName: item.contactName || item.name || '',
          callType: item.callType || 'OUTGOING',
          startedAt: Number(item.startedAt || item.date) || Date.now(),
          endedAt: Number(item.endedAt) || (Number(item.startedAt || item.date) + (Number(item.durationSeconds || item.duration) || 0) * 1000),
          durationSeconds: Number(item.durationSeconds ?? item.duration) || 0,
          connected: Boolean(item.connected),
          outcomeId: item.outcomeId,
          outcomeLabel: item.outcomeLabel,
          notes: item.notes,
          createdAt: Number(item.createdAt || item.startedAt || Date.now()),
          number: item.phoneNumber || item.number || 'Unknown',
          name: item.contactName || item.name || '',
          duration: Number(item.durationSeconds ?? item.duration) || 0,
          date: Number(item.startedAt || item.date) || Date.now(),
          type: 2,
          isAppInitiated: true,
          synced: true,
        }));

        setAppCalls(mapped);

        // Keep local native storage in lockstep with the backend DB
        if (CallTracker?.setItem) {
          CallTracker.setItem('calls_list', JSON.stringify(mapped)).catch(() => {});
        }
        return;
      }
    } catch (err: any) {
      console.log('Backend sync in loadAppCalls failed, falling back to local:', err?.message);
    }

    // Fallback: Read local device cache if offline
    try {
      if (CallTracker?.getAppCalls) {
        const rawAppCalls: any[] = await CallTracker.getAppCalls();
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
    } catch (err: any) {
      console.log('Error loading app calls fallback:', err?.message);
    }
  }, [getOutcomeForCall]);

  // Fetch call history from native CallLog (up to 200 records)
  const loadCallHistory = useCallback(
    async (showIndicator = false) => {
      try {
        if (showIndicator) {
          setIsLoadingHistory(true);
        }
        // Always sync app calls concurrently
        loadAppCalls();

        // When showing indicator (e.g. refresh), enforce a smooth minimum delay
        // to prevent instant flickering and accommodate future server latency
        const minDelay = showIndicator
          ? new Promise<void>(resolve => setTimeout(() => resolve(), 500))
          : Promise.resolve();

        let rawHistoryPromise: Promise<any[]> = Promise.resolve([]);
        if (CallTracker?.getCallHistory) {
          rawHistoryPromise = CallTracker.getCallHistory(200);
        }

        const [rawHistory] = await Promise.all([rawHistoryPromise, minDelay]);
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

          setCallHistory(mapped);
          if (mapped.length > 0) {
            onLatestCallFound?.(mapped[0]);
          }
        }
      } catch (error: any) {
        console.log('Error fetching call history:', error?.message);
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
    isLoadingHistory,
    loadAppCalls,
    loadCallHistory,
  };
}
