import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, NativeEventEmitter, NativeModules } from 'react-native';
import { CallRecord, CallState, CallTrackerEvents, FilterTab } from '../types';
import { getOutcomeById } from '../config/outcomes';

const { CallTracker } = NativeModules;

const callTrackerEmitter = new NativeEventEmitter<CallTrackerEvents>(
  CallTracker,
);

export function useCallTracker() {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeNumber, setActiveNumber] = useState('');
  const [activeContactName, setActiveContactName] = useState('');
  const [currentDuration, setCurrentDuration] = useState(0);
  const [lastCall, setLastCall] = useState<CallRecord | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [appCalls, setAppCalls] = useState<CallRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');

  // Outcome Engine state
  const [pendingOutcomeCall, setPendingOutcomeCall] = useState<CallRecord | null>(null);
  // Persistent map of callId -> { outcomeId, notes }
  const outcomeMapRef = useRef<Record<string, { outcomeId: string; outcomeLabel: string; notes?: string }>>({});

  const callStartRef = useRef<number | null>(null);
  const offhookTimestampRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeNumberRef = useRef<string>('');
  const reachedOffhookRef = useRef<boolean>(false);
  const lastDialedNumberRef = useRef<string>('');

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
  const loadCallHistory = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) {
        setIsLoadingHistory(true);
      }
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
            const savedOutcome = outcomeMapRef.current[id];

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
            setLastCall(mapped[0]);
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
  }, []);

  // Start telephony callback listener
  const startCallListener = useCallback(async () => {
    try {
      if (CallTracker?.startCallStateListener) {
        const res = await CallTracker.startCallStateListener();
        setIsListening(true);
        setStatusMessage(`Listener: ${res}`);
      }
    } catch (error: any) {
      console.log('Start listener error:', error?.message);
      setStatusMessage(`Listener error: ${error?.message || error}`);
    }
  }, []);

  // Request all permissions
  const requestPermissions = useCallback(async () => {
    try {
      setStatusMessage('Requesting permissions...');
      if (CallTracker?.requestPhoneStatePermission) {
        const result = await CallTracker.requestPhoneStatePermission();
        setStatusMessage(`Permissions: ${result}`);
        if (result === 'granted') {
          setPermissionGranted(true);
          startCallListener();
          loadCallHistory(true);
        }
        return result;
      }
      return 'unavailable';
    } catch (error: any) {
      setStatusMessage(`Permission error: ${error?.message || error}`);
      return 'error';
    }
  }, [loadCallHistory, startCallListener]);

  // Initial mount: check permissions and start listener
  useEffect(() => {
    const init = async () => {
      try {
        if (CallTracker?.checkPermissions) {
          const status = await CallTracker.checkPermissions();
          if (status === 'granted') {
            setPermissionGranted(true);
            await startCallListener();
            await loadCallHistory(true);
            setStatusMessage('System active & tracking');
          } else {
            await requestPermissions();
          }
        } else {
          await startCallListener();
          await loadCallHistory(true);
        }
      } catch (err: any) {
        setStatusMessage(`Init warning: ${err?.message}`);
      }
    };

    init();
  }, [loadCallHistory, requestPermissions, startCallListener]);

  // Monitor AppState: Re-sync call history on return
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          console.log('App resumed, syncing latest call history...');
          loadCallHistory(false);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [loadCallHistory]);

  // Listen to Telephony state changes & CallEnded events
  useEffect(() => {
    const stateSub = callTrackerEmitter.addListener(
      'CallStateChanged',
      (stateStr: string) => {
        const state = stateStr as CallState;
        console.log('CallStateChanged:', state);
        setCallState(state);

        if (state === 'OFFHOOK') {
          // Authoritative call connection: Start the timer strictly at OFFHOOK
          reachedOffhookRef.current = true;
          offhookTimestampRef.current = Date.now();
          callStartRef.current = Date.now();
          setCurrentDuration(0);

          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }

          timerIntervalRef.current = setInterval(() => {
            if (offhookTimestampRef.current) {
              const elapsed = Math.floor(
                (Date.now() - offhookTimestampRef.current) / 1000,
              );
              setCurrentDuration(elapsed);
            }
          }, 1000);
        } else if (state === 'IDLE') {
          // Call ended
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          callStartRef.current = null;
          offhookTimestampRef.current = null;
          setCurrentDuration(0);

          // Give native system 800ms to commit call log, then refresh
          setTimeout(() => {
            loadCallHistory(false);
          }, 800);
        }
      },
    );

    const endedSub = callTrackerEmitter.addListener(
      'CallEnded',
      data => {
        console.log('CallEnded event received:', data);
        const { duration = 0, number = '', name = '', date = Date.now(), id } = data;
        const callDuration = Number(duration) || 0;
        const wasConnected = reachedOffhookRef.current || callDuration > 0;

        const recordId = id ? String(id) : `${date}_${Date.now()}`;
        const finalNumber = number || activeNumberRef.current || 'Outgoing Call';

        const completedRecord: CallRecord = {
          id: recordId,
          employeeId: 'EMP-1082',
          phoneNumber: finalNumber,
          contactName: name || '',
          callType: 'OUTGOING',
          startedAt: date,
          endedAt: date + callDuration * 1000,
          durationSeconds: callDuration,
          connected: wasConnected,
          createdAt: date,
          number: finalNumber,
          name: name || '',
          duration: callDuration,
          date,
          type: 2,
        };

        setLastCall(completedRecord);
        setCallHistory(prev => {
          const filtered = prev.filter(c => c.id !== recordId);
          return [completedRecord, ...filtered.slice(0, 199)];
        });

        // Trigger Outcome Modal for the completed call!
        setPendingOutcomeCall(completedRecord);

        // Reset state
        reachedOffhookRef.current = false;
        activeNumberRef.current = '';
        setActiveNumber('');
        setActiveContactName('');

        // Re-sync with actual CallLog
        setTimeout(() => {
          loadCallHistory(false);
        }, 600);
      },
    );

    return () => {
      stateSub.remove();
      endedSub.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [loadCallHistory]);

  // Initiate an outgoing call
  const makeCall = async (numToCall?: string, contactName?: string) => {
    const target = (numToCall ?? phoneNumber).trim();
    if (!target) {
      setStatusMessage('Please enter a phone number');
      return;
    }

    try {
      activeNumberRef.current = target;
      reachedOffhookRef.current = false;
      setActiveNumber(target);
      setActiveContactName(contactName || '');
      setStatusMessage(`Dialing ${target}...`);

      if (CallTracker?.startCall) {
        const res = await CallTracker.startCall(target);
        setStatusMessage(`Call initiated: ${res}`);
      }
    } catch (error: any) {
      console.error('Call failed:', error);
      setStatusMessage(`Call error: ${error?.message || error}`);
    }
  };

  // Outcome Engine: Save outcome
  const saveCallOutcome = (callId: string, outcomeId: string, notes?: string) => {
    const config = getOutcomeById(outcomeId);
    const outcomeLabel = config?.label || outcomeId;

    outcomeMapRef.current[callId] = {
      outcomeId,
      outcomeLabel,
      notes,
    };

    // Update in native app persistent storage
    try {
      if (CallTracker?.updateAppCallOutcome) {
        CallTracker.updateAppCallOutcome(callId, outcomeId, outcomeLabel, notes || null);
      }
    } catch (e) {
      console.log('Error persisting outcome to native storage:', e);
    }

    setAppCalls(prev =>
      prev.map(item => {
        if (item.id === callId) {
          return {
            ...item,
            outcomeId,
            outcomeLabel,
            notes,
          };
        }
        return item;
      }),
    );

    setCallHistory(prev =>
      prev.map(item => {
        if (item.id === callId) {
          return {
            ...item,
            outcomeId,
            outcomeLabel,
            notes,
          };
        }
        return item;
      }),
    );

    if (lastCall?.id === callId) {
      setLastCall(prev => (prev ? { ...prev, outcomeId, outcomeLabel, notes } : null));
    }

    setPendingOutcomeCall(null);
  };

  const dismissOutcomeModal = () => {
    setPendingOutcomeCall(null);
  };

  const isCallActive = callState === 'OFFHOOK';

  // Filtered call history based on tab and search
  const filteredHistory = useMemo(() => {
    return callHistory.filter(item => {
      // Tab filter
      if (selectedFilter === 'OUTGOING' && item.callType !== 'OUTGOING' && item.type !== 2) {
        return false;
      }
      if (selectedFilter === 'INCOMING' && item.callType !== 'INCOMING' && item.type !== 1) {
        return false;
      }
      if (selectedFilter === 'MISSED' && item.callType !== 'MISSED' && item.type !== 3 && item.type !== 5) {
        return false;
      }
      if (selectedFilter === 'CONNECTED' && !item.connected) {
        return false;
      }
      if (selectedFilter === 'NOT_CONNECTED' && item.connected) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = (item.phoneNumber || item.number)?.toLowerCase().includes(query);
        const matchesName = (item.contactName || item.name)?.toLowerCase().includes(query);
        return matchesNumber || matchesName;
      }

      return true;
    });
  }, [callHistory, selectedFilter, searchQuery]);

  return {
    callState,
    phoneNumber,
    setPhoneNumber,
    activeNumber: activeNumber || activeNumberRef.current,
    activeContactName,
    currentDuration,
    lastCall,
    callHistory,
    appCalls,
    isLoadingHistory,
    statusMessage,
    permissionGranted,
    isListening,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filteredHistory,
    isCallActive,
    pendingOutcomeCall,
    setPendingOutcomeCall,
    saveCallOutcome,
    dismissOutcomeModal,
    loadCallHistory,
    loadAppCalls,
    requestPermissions,
    startCallListener,
    makeCall,
  };
}
