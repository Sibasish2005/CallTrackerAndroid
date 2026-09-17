import React, { useState, useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { COLORS } from './src/theme/colors';
import { useCallTracker } from './src/hooks/useCallTracker';
import { useCallMetrics } from './src/hooks/useCallMetrics';
import { AppNavigator } from './src/components/navigation/AppNavigator';
import { CallOutcomeModal } from './src/components/outcome/CallOutcomeModal';
import { CallRecord } from './src/types';
import { authStorage, EmployeeProfile } from './src/services/authStorage';
import { LoginScreen } from './src/screens/LoginScreen';

function MainApp({ onLogout }: { onLogout: () => void }) {
  const statusBarHeight = StatusBar.currentHeight ?? 24;
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
          paddingTop: statusBarHeight,
        },
      ]}>
      <AppNavigator
        onLogout={onLogout}
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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authStorage.getSession();
        if (session?.token && session.employee) {
          setCurrentEmployee(session.employee);
        }
      } catch (e) {
        console.warn('Auth check error:', e);
      } finally {
        setSessionChecked(true);
      }
    }
    checkAuth();
  }, []);

  if (!sessionChecked) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={COLORS.brandCyan} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      {currentEmployee ? (
        <MainApp onLogout={() => setCurrentEmployee(null)} />
      ) : (
        <LoginScreen onLoginSuccess={(emp) => setCurrentEmployee(emp)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121316',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
