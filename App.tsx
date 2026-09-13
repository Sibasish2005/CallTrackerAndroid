import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { COLORS } from './src/theme/colors';
import { useCallTracker } from './src/hooks/useCallTracker';
import { useCallMetrics } from './src/hooks/useCallMetrics';
import { AppNavigator } from './src/components/navigation/AppNavigator';
import { CallOutcomeModal } from './src/components/outcome/CallOutcomeModal';
import { CallRecord } from './src/types';

function MainApp() {
  const insets = useSafeAreaInsets();
  const tracker = useCallTracker();

  // Authoritative metrics: strictly computed from HEEYAKU app-initiated calls
  const { todayCalls, todayMetrics, lifetimeMetrics } = useCallMetrics(
    tracker.appCalls,
    tracker.appCalls
  );

  // Manual or automatic outcome disposition target
  const [manualOutcomeCall, setManualOutcomeCall] = useState<CallRecord | null>(null);

  // If there's an automatic pending call from CallEnded or a manual selection
  const activeOutcomeCall = tracker.pendingOutcomeCall || manualOutcomeCall;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: insets.bottom,
        },
      ]}>
      <AppNavigator
        callState={tracker.callState}
        phoneNumber={tracker.phoneNumber}
        setPhoneNumber={tracker.setPhoneNumber}
        activeNumber={tracker.activeNumber}
        activeContactName={tracker.activeContactName}
        currentDuration={tracker.currentDuration}
        todayMetrics={todayMetrics}
        todayCalls={todayCalls}
        lifetimeMetrics={lifetimeMetrics}
        allCalls={tracker.appCalls}
        appCalls={tracker.appCalls}
        filteredCalls={tracker.filteredHistory}
        allCallsCount={tracker.appCalls.length}
        isLoadingHistory={tracker.isLoadingHistory}
        searchQuery={tracker.searchQuery}
        setSearchQuery={tracker.setSearchQuery}
        selectedFilter={tracker.selectedFilter}
        setSelectedFilter={tracker.setSelectedFilter}
        isListening={tracker.isListening}
        permissionGranted={tracker.permissionGranted}
        statusMessage={tracker.statusMessage}
        onMakeCall={tracker.makeCall}
        onRefreshHistory={() => tracker.loadCallHistory(true)}
        onRequestPermissions={tracker.requestPermissions}
        onSelectCall={(call: CallRecord) => setManualOutcomeCall(call)}
      />

      {/* Global Call Disposition Modal */}
      <CallOutcomeModal
        visible={Boolean(activeOutcomeCall)}
        call={activeOutcomeCall}
        onSave={(callId, outcomeId, notes) => {
          tracker.saveCallOutcome(callId, outcomeId, notes);
          setManualOutcomeCall(null);
        }}
        onDismiss={() => {
          tracker.dismissOutcomeModal();
          setManualOutcomeCall(null);
        }}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121316',
  },
});
