import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CallRecord, CallState, EmployeeMetrics, FilterTab, TabRoute } from '../../types';
import { BottomNavBar } from './BottomNavBar';
import { DashboardScreen } from '../../screens/DashboardScreen';
import { LeadsScreen } from '../../screens/LeadsScreen';
import { CallsScreen } from '../../screens/CallsScreen';
import { AnalyticsScreen } from '../../screens/AnalyticsScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';

interface AppNavigatorProps {
  onLogout?: () => void;
  callState: CallState;
  phoneNumber: string;
  setPhoneNumber: (num: string) => void;
  activeNumber: string;
  activeContactName?: string;
  currentDuration: number;
  todayMetrics: EmployeeMetrics;
  todayCalls: CallRecord[];
  lifetimeMetrics: EmployeeMetrics;
  allCalls: CallRecord[];
  appCalls?: CallRecord[];
  filteredCalls: CallRecord[];
  allCallsCount: number;
  isLoadingHistory: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: FilterTab;
  setSelectedFilter: (tab: FilterTab) => void;
  isListening: boolean;
  permissionGranted: boolean;
  statusMessage: string;
  onMakeCall: (number?: string, name?: string) => void;
  onRefreshHistory: () => void;
  onRequestPermissions: () => void;
  onSelectCall: (call: CallRecord) => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  callState,
  phoneNumber,
  setPhoneNumber,
  activeNumber,
  activeContactName,
  currentDuration,
  todayMetrics,
  todayCalls,
  lifetimeMetrics,
  allCalls,
  appCalls = [],
  filteredCalls,
  allCallsCount,
  isLoadingHistory,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  isListening,
  permissionGranted,
  statusMessage,
  onMakeCall,
  onRefreshHistory,
  onRequestPermissions,
  onSelectCall,
  onLogout,
}) => {
  const [currentTab, setCurrentTab] = useState<TabRoute>('leads');

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {/* Tab 1: Assigned Leads CRM (Replaces legacy calls tab) */}
        {currentTab === 'leads' && (
          <LeadsScreen onMakeCall={onMakeCall} />
        )}

        {/* Main Daily Dashboard */}
        {currentTab === 'dashboard' && (
          <DashboardScreen
            callState={callState}
            activeNumber={activeNumber}
            activeContactName={activeContactName}
            currentDuration={currentDuration}
            metrics={todayMetrics}
            recentCalls={todayCalls}
            isListening={isListening}
            onNavigateToCalls={() => setCurrentTab('leads')}
            onQuickCall={onMakeCall}
            onSelectCall={onSelectCall}
          />
        )}

        {/* Legacy Calls Page fallback */}
        {currentTab === 'calls' && (
          <CallsScreen
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            filteredCalls={filteredCalls}
            allCallsCount={allCallsCount}
            isLoading={isLoadingHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            onMakeCall={onMakeCall}
            onRefresh={onRefreshHistory}
            onSelectCall={onSelectCall}
          />
        )}

        {/* Performance Analytics */}
        {currentTab === 'analytics' && (
          <AnalyticsScreen
            todayMetrics={todayMetrics}
            todayCalls={todayCalls}
            lifetimeMetrics={lifetimeMetrics}
            appCalls={appCalls}
          />
        )}

        {/* Simplified Employee Profile */}
        {currentTab === 'profile' && (
          <ProfileScreen
            permissionGranted={permissionGranted}
            isListening={isListening}
            statusMessage={statusMessage}
            onRequestPermissions={onRequestPermissions}
            onRefreshListener={onRefreshHistory}
            onLogout={onLogout}
          />
        )}
      </View>

      <BottomNavBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121316',
  },
  screenContainer: {
    flex: 1,
  },
});
