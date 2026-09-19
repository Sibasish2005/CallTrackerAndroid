import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { CallRecord, CallState, CallTrackerEvents } from '../../types';

const { CallTracker } = NativeModules;

const callTrackerEmitter = new NativeEventEmitter<CallTrackerEvents>(
  CallTracker,
);

export interface UseTelephonyStateParams {
  onCallEndedEvent: (completedRecord: CallRecord) => void;
  onCallEndedReloadHistory: () => void;
  onStatusMessage: (msg: string) => void;
}

export interface UseTelephonyStateReturn {
  callState: CallState;
  isCallActive: boolean;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  activeNumber: string;
  activeContactName: string;
  currentDuration: number;
  lastCall: CallRecord | null;
  setLastCall: React.Dispatch<React.SetStateAction<CallRecord | null>>;
  isListening: boolean;
  startCallListener: () => Promise<void>;
  makeCall: (numToCall?: string, contactName?: string) => Promise<void>;
}

export function useTelephonyState({
  onCallEndedEvent,
  onCallEndedReloadHistory,
  onStatusMessage,
}: UseTelephonyStateParams): UseTelephonyStateReturn {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeNumber, setActiveNumber] = useState('');
  const [activeContactName, setActiveContactName] = useState('');
  const [currentDuration, setCurrentDuration] = useState(0);
  const [lastCall, setLastCall] = useState<CallRecord | null>(null);
  const [isListening, setIsListening] = useState(false);

  const callStartRef = useRef<number | null>(null);
  const offhookTimestampRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeNumberRef = useRef<string>('');
  const reachedOffhookRef = useRef<boolean>(false);
  const isAppDialingRef = useRef<boolean>(false);

  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to schedule a single debounced reload of call records
  const scheduleHistoryReload = useCallback(() => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    reloadTimeoutRef.current = setTimeout(() => {
      onCallEndedReloadHistory();
      reloadTimeoutRef.current = null;
    }, 800);
  }, [onCallEndedReloadHistory]);

  // Start telephony callback listener
  const startCallListener = useCallback(async () => {
    try {
      if (CallTracker?.startCallStateListener) {
        const res = await CallTracker.startCallStateListener();
        console.log('Call state listener started:', res);
        setIsListening(true);
        onStatusMessage('Telephony callback registered');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('Start listener error:', message);
      onStatusMessage(`Listener error: ${message}`);
    }
  }, [onStatusMessage]);

  // Telephony state changes & CallEnded events
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

          // Schedule a single debounced reload (in case CallEnded doesn't fire)
          scheduleHistoryReload();
        }
      },
    );

    const endedSub = callTrackerEmitter.addListener(
      'CallEnded',
      data => {
        console.log('CallEnded event received:', data);
        const { duration = 0, number = '', name = '', date = Date.now(), id } = data;
        const callDuration = Number(duration) || 0;
        
        // Strict Real Call Duration: ONLY count seconds spent offhook (connected talk time)
        const elapsedOffhook = offhookTimestampRef.current
          ? Math.max(0, Math.floor((Date.now() - offhookTimestampRef.current) / 1000))
          : 0;

        // A call is ONLY connected if offhook was reached (party answered)
        const wasConnected = Boolean(reachedOffhookRef.current);
        const realCallDuration = wasConnected
          ? Math.max(elapsedOffhook, callDuration > 0 ? callDuration : 0)
          : 0;

        const recordId = id ? String(id) : `${date}_${Date.now()}`;
        const finalNumber = number || activeNumberRef.current || 'Outgoing Call';

        const wasAppInitiated = Boolean(isAppDialingRef.current || data?.isAppInitiated || activeNumberRef.current);
        isAppDialingRef.current = false;

        const completedRecord: CallRecord = {
          id: recordId,
          employeeId: 'EMP-1082',
          phoneNumber: finalNumber,
          contactName: name || activeContactName || '',
          callType: 'OUTGOING',
          startedAt: date,
          endedAt: date + realCallDuration * 1000,
          durationSeconds: realCallDuration,
          connected: wasConnected,
          createdAt: date,
          number: finalNumber,
          name: name || activeContactName || '',
          duration: realCallDuration,
          date,
          type: 2,
          isAppInitiated: wasAppInitiated,
        };

        setLastCall(completedRecord);
        onCallEndedEvent(completedRecord);


        // Reset active tracking state
        reachedOffhookRef.current = false;
        activeNumberRef.current = '';
        setActiveNumber('');
        setActiveContactName('');

        // Single debounced reload with actual CallLog
        scheduleHistoryReload();
      },
    );

    return () => {
      stateSub.remove();
      endedSub.remove();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, [onCallEndedEvent, scheduleHistoryReload]);

  // Initiate an outgoing call
  const makeCall = async (numToCall?: string, contactName?: string) => {
    const target = (numToCall ?? phoneNumber).trim();
    if (!target) {
      onStatusMessage('Please enter a phone number');
      return;
    }

    try {
      isAppDialingRef.current = true;
      activeNumberRef.current = target;
      reachedOffhookRef.current = false;
      setActiveNumber(target);
      setActiveContactName(contactName || '');
      onStatusMessage(`Dialing ${target}...`);

      if (CallTracker?.startCall) {
        const res = await CallTracker.startCall(target);
        onStatusMessage(`Call initiated: ${res}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Call failed:', message);
      onStatusMessage(`Call error: ${message}`);
    }
  };

  const isCallActive = callState === 'OFFHOOK';

  return {
    callState,
    isCallActive,
    phoneNumber,
    setPhoneNumber,
    activeNumber,
    activeContactName,
    currentDuration,
    lastCall,
    setLastCall,
    isListening,
    startCallListener,
    makeCall,
  };
}
