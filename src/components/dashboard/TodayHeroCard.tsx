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
  const talkTime = formatVerboseDuration(metrics.totalDurationSeconds);

  return (
    <View style={styles.heroCard}>
      {/* Top Header Row */}
      <View style={styles.heroTopRow}>
        <Text style={styles.heroPreTitle}>TODAY'S ACTIVITY</Text>

        <View style={styles.ratePill}>
          <View style={styles.rateDot} />
          <Text style={styles.ratePillText}>{connectionRate}% connected</Text>
        </View>
      </View>

      {/* Main Stat: Giant number + label */}
      <View style={styles.heroStatRow}>
        <Text style={styles.heroGiantNumber}>{connectedCalls}</Text>
        <Text style={styles.heroStatLabel}>
          {connectedCalls === 1 ? 'call connected' : 'calls connected'}
        </Text>
      </View>

      {/* Talk Time & Micro Progress Track */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.max(4, connectionRate))}%` },
            ]}
          />
        </View>
      </View>

      <Text style={styles.heroTalkTimeSubtext}>
        Total talk time: {talkTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#18191E',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#24262E',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D919C',
    letterSpacing: 0.8,
  },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#20222A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2D37',
  },
  rateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  ratePillText: {
    color: '#EDEDED',
    fontSize: 12,
    fontWeight: '700',
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginBottom: 8,
  },
  heroGiantNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#EDEDED',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8D919C',
    marginLeft: 10,
  },
  progressRow: {
    marginTop: 6,
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#24262E',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
  heroTalkTimeSubtext: {
    fontSize: 12,
    color: '#8D919C',
    marginTop: 4,
  },
});
