import { useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  useCallFilter,
  useCallHistory,
  useCallOutcomes,
  useCallPermissions,
  useTelephonyState,
} from './tracker';

export * from './tracker';

/**
 * High-level composed hook for HEEYAKU Call Tracking.
 * Modularized across sub-hooks in `./tracker/`:
 * - useCallPermissions: Runtime telephony & call log permissions
 * - useCallHistory: System call logs and native persistent app calls
 * - useCallOutcomes: Call disposition outcomes and modal state
 * - useCallFilter: Search and filter chips for call history
 * - useTelephonyState: Native telephony listeners, duration timer, and dialing
 */
export function useCallTracker() {
  // 1. Permissions & Status
  const {
    permissionGranted,
    statusMessage,
    setStatusMessage,
    checkPermissions,
    requestPermissions: requestPermsBase,
  } = useCallPermissions();

  // 2. Disposition Outcomes
  const {
    pendingOutcomeCall,
    setPendingOutcomeCall,
    saveCallOutcome: saveOutcomeBase,
    dismissOutcomeModal,
    getOutcomeForCall,
  } = useCallOutcomes();

  // 3. Call History & Native App Calls
  const {
    callHistory,
    setCallHistory,
    appCalls,
    setAppCalls,
    isLoadingHistory,
    loadAppCalls,
    loadCallHistory,
  } = useCallHistory(getOutcomeForCall, latest => {
    setLastCall(prev => prev ?? latest);
  });

  // 4. Filtering & Search (strictly on appCalls as per Option A)
  const {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filteredHistory,
  } = useCallFilter(appCalls);

  // 5. Telephony state, dialing & events
  const {
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
  } = useTelephonyState({
    onCallEndedEvent: completedRecord => {
      // Add completed record to history
      setCallHistory(prev => {
        const filtered = prev.filter(c => c.id !== completedRecord.id);
        return [completedRecord, ...filtered.slice(0, 199)];
      });
      // Show outcome modal
      setPendingOutcomeCall(completedRecord);
    },
    onCallEndedReloadHistory: () => {
      loadCallHistory(false);
    },
    onStatusMessage: setStatusMessage,
  });

  // Request permissions wrapper: automatically starts listener and loads history on grant
  const requestPermissions = useCallback(async () => {
    return requestPermsBase(() => {
      startCallListener();
      loadCallHistory(true);
    });
  }, [requestPermsBase, startCallListener, loadCallHistory]);

  // Save call outcome handler: updates outcome in appCalls, callHistory, and lastCall
  const saveCallOutcome = useCallback(
    (callId: string, outcomeId: string, notes?: string) => {
      saveOutcomeBase(callId, outcomeId, notes, (_id, outcomeLabel, finalNotes) => {
        setAppCalls(prev =>
          prev.map(item =>
            item.id === callId
              ? { ...item, outcomeId, outcomeLabel, notes: finalNotes }
              : item
          )
        );
        setCallHistory(prev =>
          prev.map(item =>
            item.id === callId
              ? { ...item, outcomeId, outcomeLabel, notes: finalNotes }
              : item
          )
        );
        setLastCall(prev =>
          prev?.id === callId
            ? { ...prev, outcomeId, outcomeLabel, notes: finalNotes }
            : prev
        );
      });
    },
    [saveOutcomeBase, setAppCalls, setCallHistory, setLastCall]
  );

  // Initial mount: check permissions and start listener
  useEffect(() => {
    const init = async () => {
      try {
        const status = await checkPermissions();
        if (status === 'granted') {
          await startCallListener();
          await loadCallHistory(true);
          setStatusMessage('System active & tracking');
        } else {
          await requestPermissions();
        }
      } catch (err: any) {
        setStatusMessage(`Init warning: ${err?.message}`);
      }
    };

    init();
  }, [checkPermissions, loadCallHistory, requestPermissions, setStatusMessage, startCallListener]);

  // Monitor AppState: Re-sync call history on return
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          console.log('App resumed, syncing latest call history...');
          loadCallHistory(false);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [loadCallHistory]);

  return {
    callState,
    phoneNumber,
    setPhoneNumber,
    activeNumber,
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
