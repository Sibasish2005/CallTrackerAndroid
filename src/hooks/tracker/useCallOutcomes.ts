import { useRef, useState } from 'react';
import { NativeModules } from 'react-native';
import { CallRecord } from '../../types';
import { getOutcomeById } from '../../config/outcomes';

const { CallTracker } = NativeModules;

export interface UseCallOutcomesReturn {
  pendingOutcomeCall: CallRecord | null;
  setPendingOutcomeCall: (call: CallRecord | null) => void;
  outcomeMapRef: React.MutableRefObject<
    Record<string, { outcomeId: string; outcomeLabel: string; notes?: string }>
  >;
  saveCallOutcome: (
    callId: string,
    outcomeId: string,
    notes?: string,
    onUpdated?: (outcomeId: string, outcomeLabel: string, notes?: string) => void
  ) => void;
  dismissOutcomeModal: () => void;
  getOutcomeForCall: (
    callId: string
  ) => { outcomeId: string; outcomeLabel: string; notes?: string } | undefined;
}

export function useCallOutcomes(): UseCallOutcomesReturn {
  const [pendingOutcomeCall, setPendingOutcomeCall] = useState<CallRecord | null>(null);
  const outcomeMapRef = useRef<
    Record<string, { outcomeId: string; outcomeLabel: string; notes?: string }>
  >({});

  const getOutcomeForCall = (callId: string) => {
    return outcomeMapRef.current[callId];
  };

  const saveCallOutcome = (
    callId: string,
    outcomeId: string,
    notes?: string,
    onUpdated?: (outcomeId: string, outcomeLabel: string, notes?: string) => void
  ) => {
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

    onUpdated?.(outcomeId, outcomeLabel, notes);
    setPendingOutcomeCall(null);
  };

  const dismissOutcomeModal = () => {
    setPendingOutcomeCall(null);
  };

  return {
    pendingOutcomeCall,
    setPendingOutcomeCall,
    outcomeMapRef,
    saveCallOutcome,
    dismissOutcomeModal,
    getOutcomeForCall,
  };
}
