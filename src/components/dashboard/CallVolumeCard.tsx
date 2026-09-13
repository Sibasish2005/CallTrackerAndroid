import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmployeeMetrics } from '../../types';

interface CallVolumeCardProps {
  metrics: EmployeeMetrics;
}

export const CallVolumeCard: React.FC<CallVolumeCardProps> = ({ metrics }) => {
  const attempts = metrics.totalAttempts;
  const connected = metrics.totalConnected;
  const unconnected = metrics.totalUnconnected;

  const connectedFlex = Math.max(1, connected);
  const unconnectedFlex = Math.max(1, unconnected);

  return (
    <View style={styles.bottomCard}>
      <View style={styles.bottomCardContentRow}>
        {/* Left Column: Title, Subtitle, Segmented Progress Bar & Legend */}
        <View style={styles.bottomLeftCol}>
          <Text style={styles.cardHighlightedTitle}>Total Call Attempts</Text>
          <Text style={styles.cardSubtitle}>Daily cellular activity</Text>

          {/* Segmented Bar */}
          <View style={styles.segmentedTrack}>
            <View
              style={[
                styles.segmentConnected,
                { flex: connectedFlex },
              ]}
            />
            <View
              style={[
                styles.segmentUnconnected,
                { flex: unconnectedFlex },
              ]}
            />
          </View>

          {/* Legend row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotConnected} />
              <Text style={styles.legendText}>
                Connected ({connected})
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendDotOther} />
              <Text style={styles.legendText}>
                Unconnected ({unconnected})
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column: Giant Total Attempts Number with Delta Indicator */}
        <View style={styles.bottomRightCol}>
          <View style={styles.deltaNumberRow}>
            <Text style={styles.bottomGiantNumber}>{attempts}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomCard: {
    backgroundColor: '#1C1D22',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#272932',
  },
  bottomCardContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bottomLeftCol: {
    flex: 1,
    paddingRight: 16,
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
    marginBottom: 16,
  },
  segmentedTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2D2F38',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  segmentConnected: {
    backgroundColor: '#1D7BF6',
  },
  segmentUnconnected: {
    backgroundColor: '#353844',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotConnected: {
    width: 7,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#1D7BF6',
  },
  legendDotOther: {
    width: 7,
    height: 7,
    borderRadius: 1,
    backgroundColor: '#353844',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D919C',
  },
  bottomRightCol: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 2,
  },
  deltaNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomGiantNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  deltaIndicator: {
    fontSize: 16,
    fontWeight: '900',
    color: '#22C55E',
    marginLeft: 6,
    marginBottom: 8,
  },
});
