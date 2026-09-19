import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmployeeMetrics } from '../../types';
import { formatDuration, formatVerboseDuration } from '../../utils/formatters';

interface BentoKpiRowProps {
  metrics: EmployeeMetrics;
  isOffhook?: boolean;
  currentDuration?: number;
}

export const BentoKpiRow: React.FC<BentoKpiRowProps> = ({
  metrics,
  isOffhook = false,
  currentDuration = 0,
}) => {
  const connectionRate = metrics.connectionRatePercent;
  const avgDuration = formatVerboseDuration(metrics.averageDurationSeconds);
  const totalTalkTime = formatVerboseDuration(metrics.totalDurationSeconds);

  return (
    <View style={styles.middleRow}>
      {/* Left Card (Widget 2): Connection Rate */}
      <View style={styles.halfCard}>
        <Text style={styles.cardHighlightedTitle}>Connection Rate</Text>
        <Text style={styles.cardSubtitle}>Daily performance</Text>

        <Text style={styles.cardGiantNumber}>{connectionRate}%</Text>

        <View style={styles.horizontalTrack}>
          <View
            style={[
              styles.horizontalFill,
              {
                width: `${Math.min(100, Math.max(8, connectionRate))}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Right Card (Widget 3 - Home Section Three): Real Call Duration Timer */}
      <View style={[styles.halfCard, isOffhook && styles.halfCardActive]}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardHighlightedTitle}>Real Call Timer</Text>
          {isOffhook && (
            <View style={styles.liveIndicatorPill}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle}>
          {isOffhook ? 'Connected talk time' : 'Real talk time today'}
        </Text>

        <Text style={[styles.cardGiantNumber, isOffhook && styles.cardGiantNumberActive]}>
          {isOffhook ? formatDuration(currentDuration) : totalTalkTime}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaSubtext}>
            {isOffhook ? 'Live conversation' : `Avg ${avgDuration}/call`}
          </Text>
        </View>

        <View style={styles.horizontalTrack}>
          <View
            style={[
              styles.horizontalFill,
              isOffhook && styles.horizontalFillActive,
              {
                width: isOffhook
                  ? `${Math.min(100, Math.max(15, (currentDuration % 60) * 1.6))}%`
                  : `${Math.min(100, Math.max(10, metrics.totalConnected > 0 ? 68 : 8))}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  middleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#1C1D22',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#272932',
  },
  cardHighlightedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8D919C',
    marginTop: 3,
    marginBottom: 20,
  },
  cardGiantNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  horizontalTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2D2F38',
    width: '100%',
    overflow: 'hidden',
  },
  horizontalFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1D7BF6',
  },
  horizontalFillActive: {
    backgroundColor: '#22C55E',
  },
  halfCardActive: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    backgroundColor: '#161E1A',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveIndicatorText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  cardGiantNumberActive: {
    color: '#22C55E',
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    marginBottom: 8,
  },
  metaSubtext: {
    fontSize: 11,
    color: '#8D919C',
    fontWeight: '500',
  },
});
