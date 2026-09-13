import { useCallback, useState } from 'react';
import { NativeModules } from 'react-native';
import { CallRecord } from '../../types';

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

  // Fetch HEEYAKU app-initiated call history from native storage (unlimited lifetime calls)
  const loadAppCalls = useCallback(async () => {
    try {
      if (CallTracker?.getAppCalls) {
        const rawAppCalls: any[] = await CallTracker.getAppCalls();
        if (Array.isArray(rawAppCalls)) {
          const mapped: CallRecord[] = rawAppCalls.map((item, index) => {
            const id = String(item.id || `app_${item.date || Date.now()}_${index}`);
            const durationSecs = Number(item.duration) || 0;
            const isConnected = item.connected === true || durationSecs > 0;
            return {
              id,
              employeeId: 'EMP-1082',
              phoneNumber: item.number || 'Unknown',
              contactName: item.name || '',
              callType: 'OUTGOING',
              startedAt: Number(item.date) || Date.now(),
              endedAt: Number(item.date) + durationSecs * 1000,
              durationSeconds: durationSecs,
              connected: isConnected,
              outcomeId: item.outcomeId,
              outcomeLabel: item.outcomeLabel,
              notes: item.notes,
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
      console.log('Error loading app calls:', err?.message);
    }
  }, []);

  // Fetch call history from native CallLog (up to 200 records)
  const loadCallHistory = useCallback(
    async (showIndicator = false) => {
      try {
        if (showIndicator) {
          setIsLoadingHistory(true);
        }
        // Always sync app calls concurrently
        loadAppCalls();

        if (CallTracker?.getCallHistory) {
          const rawHistory: any[] = await CallTracker.getCallHistory(200);
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
        }
      } catch (error: any) {
        console.log('Error fetching call history:', error?.message);
      } finally {
        if (showIndicator) {
          setIsLoadingHistory(false);
        }
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
