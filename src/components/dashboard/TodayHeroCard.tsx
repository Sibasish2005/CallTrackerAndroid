import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmployeeMetrics } from '../../types';
import { formatVerboseDuration } from '../../utils/formatters';

interface TodayHeroCardProps {
  metrics: EmployeeMetrics;
}

export const TodayHeroCard: React.FC<TodayHeroCardProps> = ({ metrics }) => {
  const connectionRate = metrics.connectionRatePercent;
  const connectedCalls = metrics.totalConnected;
  const totalAttempts = metrics.totalAttempts;
  const talkTime = formatVerboseDuration(metrics.totalDurationSeconds);

  return (
    <View style={styles.heroCard}>
      {/* Top Header Row */}
      <View style={styles.heroTopRow}>
        <View style={styles.titleBadge}>
          <View style={styles.statusPulse} />
          <Text style={styles.heroPreTitle}>TODAY'S PERFORMANCE</Text>
        </View>

        <View style={styles.ratePill}>
          <Text style={styles.ratePillText}>{connectionRate}% Answered</Text>
        </View>
      </View>

      {/* Main Focus: Real Connected Talk Time */}
      <View style={styles.mainTalkTimeContainer}>
        <Text style={styles.talkTimeLabel}>REAL CONNECTED TALK TIME</Text>
        <Text style={styles.talkTimeValue}>{talkTime}</Text>
        <Text style={styles.talkTimeSubtext}>
          Active conversational time across all leads today
        </Text>
      </View>

      {/* Progress Track */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, Math.max(totalAttempts > 0 ? 4 : 0, connectionRate))}%` },
          ]}
        />
      </View>

      {/* Bottom 3-Column Micro KPIs */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.metricNumber}>{connectedCalls}</Text>
          <Text style={styles.metricLabel}>Connected</Text>
        </View>

        <View style={styles.colDivider} />

        <View style={styles.metricCol}>
          <Text style={styles.metricNumber}>{totalAttempts}</Text>
          <Text style={styles.metricLabel}>Total Attempts</Text>
        </View>

        <View style={styles.colDivider} />

        <View style={styles.metricCol}>
          <Text style={[styles.metricNumber, { color: '#38BDF8' }]}>
            {connectionRate}%
          </Text>
          <Text style={styles.metricLabel}>Connection Rate</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#151824',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#242A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9BB5',
    letterSpacing: 1,
  },
  ratePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  ratePillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  mainTalkTimeContainer: {
    marginBottom: 16,
  },
  talkTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E9BB5',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  talkTimeValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  talkTimeSubtext: {
    fontSize: 12,
    color: '#6F7B95',
    marginTop: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E2333',
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E2436',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B87A2',
    marginTop: 2,
  },
  colDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#1E2436',
  },
});
