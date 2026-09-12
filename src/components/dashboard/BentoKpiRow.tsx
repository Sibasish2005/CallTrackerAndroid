import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmployeeMetrics } from '../../types';
import { formatVerboseDuration } from '../../utils/formatters';

interface BentoKpiRowProps {
  metrics: EmployeeMetrics;
}

export const BentoKpiRow: React.FC<BentoKpiRowProps> = ({ metrics }) => {
  const connectionRate = metrics.connectionRatePercent;
  const avgDuration = formatVerboseDuration(metrics.averageDurationSeconds);

  return (
    <View style={styles.middleRow}>
      {/* Left Card: Connection Rate */}
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

      {/* Right Card: Average Duration */}
      <View style={styles.halfCard}>
        <Text style={styles.cardHighlightedTitle}>Avg Duration</Text>
        <Text style={styles.cardSubtitle}>Per answered call</Text>

        <Text style={styles.cardGiantNumber}>{avgDuration}</Text>

        <View style={styles.horizontalTrack}>
          <View
            style={[
              styles.horizontalFill,
              {
                width: `${Math.min(100, Math.max(10, metrics.totalConnected > 0 ? 68 : 8))}%`,
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
});
