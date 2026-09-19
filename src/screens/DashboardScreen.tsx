import React, { useState, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallRecord, CallState, EmployeeMetrics } from '../types';
import { COLORS } from '../theme/colors';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { HeeyakuLogo } from '../components/common/HeeyakuLogo';
import { CallHistoryItemRow } from '../components/common/CallHistoryItemRow';
import { TodayHeroCard } from '../components/dashboard/TodayHeroCard';
import { BentoKpiRow } from '../components/dashboard/BentoKpiRow';
import { CallVolumeCard } from '../components/dashboard/CallVolumeCard';
import { LiveCallCard } from '../components/dashboard/LiveCallCard';

interface DashboardScreenProps {
  callState: CallState;
  activeNumber: string;
  activeContactName?: string;
  currentDuration: number;
  metrics: EmployeeMetrics;
  recentCalls: CallRecord[];
  isListening: boolean;
  onNavigateToCalls: () => void;
  onQuickCall: (number: string, name?: string) => void;
  onSelectCall: (call: CallRecord) => void;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  callState,
  activeNumber,
  activeContactName,
  currentDuration,
  metrics,
  recentCalls,
  isListening,
  onNavigateToCalls,
  onQuickCall,
  onSelectCall,
  onRefresh,
  refreshing = false,
}) => {
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const isOffhook = callState === 'OFFHOOK';
  const isRinging = callState === 'RINGING';
  const hasActiveCall = isOffhook || isRinging;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setLocalRefreshing(true);
    try {
      await onRefresh();
    } catch (e) {
      console.log('Error refreshing dashboard:', e);
    } finally {
      setLocalRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={localRefreshing}
            onRefresh={handleRefresh}
            colors={['#38BDF8']}
            progressBackgroundColor="#1E293B"
            tintColor="#38BDF8"
          />
        ) : undefined
      }>
      {/* Top Header - Kept EXACTLY as specified */}
      <View style={styles.header}>
        <View style={styles.brandingRow}>
          <HeeyakuLogo size={42} />
          <View style={styles.brandingTextContainer}>
            <Text style={styles.brandTitle}>HEEYAKU</Text>
            <Text style={styles.brandSubtitle}>Call Tracker • Pro</Text>
          </View>
        </View>

        <Badge
          label={isListening ? 'Tracking Active' : 'Standby'}
          variant="outline"
          size="sm"
        />
      </View>

      {/* Live Call Active Card */}
      {hasActiveCall && (
        <LiveCallCard
          isOffhook={isOffhook}
          activeNumber={activeNumber}
          activeContactName={activeContactName}
          currentDuration={currentDuration}
        />
      )}

      {/* WIDGET 1: Top Hero Schedule Card */}
      <TodayHeroCard metrics={metrics} />

      {/* WIDGET 2 & 3: Middle Two-Column Bento Cards (Widget 3 is the Real Call Timer) */}
      <BentoKpiRow
        metrics={metrics}
        isOffhook={isOffhook}
        currentDuration={currentDuration}
      />

      {/* WIDGET 4: Bottom Full-Width Card (segmented bar, legend, giant number & delta) */}
      <CallVolumeCard metrics={metrics} />

      {/* Recent Activity from Today */}
      <View style={styles.recentsHeaderRow}>
        <Text style={styles.sectionHeader}>{"TODAY'S CALL ACTIVITY"}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onNavigateToCalls}>
          <Text style={styles.viewAllText}>
            View All ({recentCalls.length}) →
          </Text>
        </TouchableOpacity>
      </View>

      <Card variant="default" style={styles.recentsCard}>
        {recentCalls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No calls recorded today yet</Text>
          </View>
        ) : (
          recentCalls.slice(0, 5).map(item => (
            <CallHistoryItemRow
              key={item.id}
              item={item}
              onPressItem={onSelectCall}
              onQuickCall={onQuickCall}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121316',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 4,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandingTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.brandCyan,
    fontWeight: '600',
    marginTop: 2,
  },
  recentsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D919C',
    letterSpacing: 0.8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C2C5CE',
  },
  recentsCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#1C1D22',
    borderColor: '#272932',
    borderRadius: 18,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
