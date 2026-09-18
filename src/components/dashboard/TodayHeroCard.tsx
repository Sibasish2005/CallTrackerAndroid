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
        <Text style={styles.heroPreTitle}>{"Today's schedule"}</Text>

        {/* Right indicator: Pill badge + connector line + vertical progress bar */}
        <View style={styles.verticalBarGroup}>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{connectionRate}%</Text>
          </View>
          <View style={styles.pillConnector} />
          <View style={styles.verticalTrack}>
            <View
              style={[
                styles.verticalFill,
                {
                  height: `${Math.min(100, Math.max(10, connectionRate))}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Main Stat: Giant number + label */}
      <View style={styles.heroStatRow}>
        <Text style={styles.heroGiantNumber}>{connectedCalls}</Text>
        <Text style={styles.heroStatLabel}>calls connected</Text>
      </View>

      {/* Subtitle Talk Time text in human language */}
      <Text style={styles.heroTalkTimeSubtext}>
        Total talk time: {talkTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#1C1D22',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#272932',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroPreTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8D919C',
    letterSpacing: 0.2,
  },
  verticalBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    color: '#121316',
    fontSize: 12,
    fontWeight: '800',
  },
  pillConnector: {
    width: 8,
    height: 1.5,
    backgroundColor: '#FFFFFF',
  },
  verticalTrack: {
    width: 4,
    height: 46,
    borderRadius: 2,
    backgroundColor: '#2D2F38',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalFill: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#1D7BF6',
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 4,
  },
  heroGiantNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C2C5CE',
    marginLeft: 10,
  },
  heroTalkTimeSubtext: {
    fontSize: 12,
    color: '#8D919C',
    marginTop: 6,
  },
});
