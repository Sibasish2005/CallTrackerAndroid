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

  // Start telephony callback listener
  const startCallListener = useCallback(async () => {
    try {
      if (CallTracker?.startCallStateListener) {
        const res = await CallTracker.startCallStateListener();
        setIsListening(true);
        onStatusMessage(`Listener: ${res}`);
      }
    } catch (error: any) {
      console.log('Start listener error:', error?.message);
      onStatusMessage(`Listener error: ${error?.message || error}`);
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

          // Give native system 800ms to commit call log, then refresh
          setTimeout(() => {
            onCallEndedReloadHistory();
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
          isAppInitiated: true,
        };

        setLastCall(completedRecord);
        onCallEndedEvent(completedRecord);

        // Reset active tracking state
        reachedOffhookRef.current = false;
        activeNumberRef.current = '';
        setActiveNumber('');
        setActiveContactName('');

        // Re-sync with actual CallLog
        setTimeout(() => {
          onCallEndedReloadHistory();
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
  }, [onCallEndedEvent, onCallEndedReloadHistory]);

  // Initiate an outgoing call
  const makeCall = async (numToCall?: string, contactName?: string) => {
    const target = (numToCall ?? phoneNumber).trim();
    if (!target) {
      onStatusMessage('Please enter a phone number');
      return;
    }

    try {
      activeNumberRef.current = target;
      reachedOffhookRef.current = false;
      setActiveNumber(target);
      setActiveContactName(contactName || '');
      onStatusMessage(`Dialing ${target}...`);

      if (CallTracker?.startCall) {
        const res = await CallTracker.startCall(target);
        onStatusMessage(`Call initiated: ${res}`);
      }
    } catch (error: any) {
      console.error('Call failed:', error);
      onStatusMessage(`Call error: ${error?.message || error}`);
    }
  };

  const isCallActive = callState === 'OFFHOOK';

  return {
    callState,
    isCallActive,
    phoneNumber,
    setPhoneNumber,
    activeNumber: activeNumber || activeNumberRef.current,
    activeContactName,
    currentDuration,
    lastCall,
    setLastCall,
    isListening,
    startCallListener,
    makeCall,
  };
}
