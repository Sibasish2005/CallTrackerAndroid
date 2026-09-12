import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CallHistoryItem} from '../types';
import {
  computeDashboardStats,
  formatTalkTime,
  formatVerboseDuration,
} from '../utils/formatters';

interface DashboardProps {
  callHistory: CallHistoryItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({callHistory}) => {
  const stats = useMemo(
    () => computeDashboardStats(callHistory),
    [callHistory],
  );

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.sectionLabel}>TODAY'S DASHBOARD</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{todayLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {/* Stat 1: Total Calls */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconContainer, {backgroundColor: '#0C4A6E'}]}>
              <Text style={[styles.iconText, {color: '#38BDF8'}]}>📞</Text>
            </View>
            <Text style={styles.statLabel}>Total Calls</Text>
          </View>
          <Text style={[styles.statValue, {color: '#F8FAFC'}]}>
            {stats.totalCalls}
          </Text>
        </View>

        {/* Stat 2: Connected */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconContainer, {backgroundColor: '#064E3B'}]}>
              <Text style={[styles.iconText, {color: '#34D399'}]}>✓</Text>
            </View>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
          <Text style={[styles.statValue, {color: '#34D399'}]}>
            {stats.connectedCalls}
          </Text>
        </View>

        {/* Stat 3: Missed */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconContainer, {backgroundColor: '#7F1D1D'}]}>
              <Text style={[styles.iconText, {color: '#F87171'}]}>✕</Text>
            </View>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
          <Text style={[styles.statValue, {color: '#F87171'}]}>
            {stats.missedCalls}
          </Text>
        </View>

        {/* Stat 4: Total Talk Time */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconContainer, {backgroundColor: '#78350F'}]}>
              <Text style={[styles.iconText, {color: '#FBBF24'}]}>⏱️</Text>
            </View>
            <Text style={styles.statLabel}>Talk Time</Text>
          </View>
          <Text
            style={[styles.statValue, styles.statValueSmall, {color: '#FBBF24'}]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {formatTalkTime(stats.totalTalkTimeSeconds)}
          </Text>
        </View>

        {/* Stat 5: Avg Duration */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconContainer, {backgroundColor: '#4C1D95'}]}>
              <Text style={[styles.iconText, {color: '#A78BFA'}]}>📈</Text>
            </View>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
          <Text
            style={[styles.statValue, styles.statValueSmall, {color: '#C4B5FD'}]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {stats.connectedCalls > 0
              ? formatVerboseDuration(stats.avgDurationSeconds)
              : '0s'}
          </Text>
        </View>

        {/* Stat 6: Longest Call */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View style={[styles.iconContainer, {backgroundColor: '#134E4A'}]}>
              <Text style={[styles.iconText, {color: '#2DD4BF'}]}>🏆</Text>
            </View>
            <Text style={styles.statLabel}>Longest Call</Text>
          </View>
          <Text
            style={[styles.statValue, styles.statValueSmall, {color: '#2DD4BF'}]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {stats.longestCallSeconds > 0
              ? formatVerboseDuration(stats.longestCallSeconds)
              : '0s'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161F30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22314E',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  dateBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#0E1626',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  statValueSmall: {
    fontSize: 16,
  },
});
