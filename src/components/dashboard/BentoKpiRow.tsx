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
  const avgDuration = formatVerboseDuration(metrics.averageDurationSeconds);
  const totalTalkTime = formatVerboseDuration(metrics.totalDurationSeconds);

  return (
    <View style={styles.middleRow}>
      {/* Left Card: Average Call Duration / Quality */}
      <View style={styles.halfCard}>
        <Text style={styles.cardHighlightedTitle}>Avg Call Duration</Text>
        <Text style={styles.cardSubtitle}>
          {metrics.totalConnected > 0 ? 'Per answered lead' : 'No calls answered yet'}
        </Text>

        <Text style={styles.cardGiantNumber}>{avgDuration}</Text>

        <View style={styles.targetBadge}>
          <View style={styles.targetDot} />
          <Text style={styles.targetText}>
            {metrics.averageDurationSeconds >= 120 ? 'Optimal depth' : 'Target: > 2 min'}
          </Text>
        </View>
      </View>

      {/* Right Card: Talk Time & Live Active Tracker */}
      <View style={[styles.halfCard, isOffhook && styles.halfCardActive]}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardHighlightedTitle, isOffhook && styles.cardTitleActive]}>
            {isOffhook ? 'Active Call' : 'Total Talk Time'}
          </Text>
          {isOffhook ? (
            <View style={styles.liveIndicatorPill}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.idlePill}>
              <Text style={styles.idlePillText}>{metrics.totalConnected} connected</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardSubtitle}>
          {isOffhook ? 'Current live talk time' : 'Verified voice seconds'}
        </Text>

        <Text style={[styles.cardGiantNumber, isOffhook && styles.cardGiantNumberActive]}>
          {isOffhook ? formatDuration(currentDuration) : totalTalkTime}
        </Text>

        <View style={styles.horizontalTrack}>
          <View
            style={[
              styles.horizontalFill,
              isOffhook && styles.horizontalFillActive,
              {
                width: isOffhook
                  ? `${Math.min(100, Math.max(10, ((currentDuration % 60) / 60) * 100))}%`
                  : `${Math.min(100, Math.max(metrics.totalConnected > 0 ? 15 : 0, (metrics.totalDurationSeconds / 1800) * 100))}%`,
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
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#151824',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#242A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  halfCardActive: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
    backgroundColor: '#0F1F17',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHighlightedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  cardTitleActive: {
    color: '#4ADE80',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#7B87A2',
    marginTop: 3,
    marginBottom: 16,
  },
  cardGiantNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  cardGiantNumberActive: {
    color: '#22C55E',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C2030',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  targetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  targetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E9BB5',
  },
  idlePill: {
    backgroundColor: '#1C2030',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idlePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7B87A2',
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  horizontalTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1E2333',
    width: '100%',
    overflow: 'hidden',
  },
  horizontalFill: {
    height: '100%',
    borderRadius: 2.5,
    backgroundColor: '#38BDF8',
  },
  horizontalFillActive: {
    backgroundColor: '#22C55E',
  },
});
