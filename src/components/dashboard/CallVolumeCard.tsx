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

  const connectedFlex = Math.max(0, connected);
  const unconnectedFlex = Math.max(0, unconnected);
  const hasCalls = attempts > 0;

  return (
    <View style={styles.bottomCard}>
      <View style={styles.bottomCardContentRow}>
        {/* Left Column: Title, Subtitle, Segmented Progress Bar & Legend */}
        <View style={styles.bottomLeftCol}>
          <Text style={styles.cardHighlightedTitle}>Call Volume Breakdown</Text>
          <Text style={styles.cardSubtitle}>Connected vs Unanswered Outreach</Text>

          {/* Segmented Bar */}
          <View style={styles.segmentedTrack}>
            {hasCalls ? (
              <>
                {connected > 0 && (
                  <View
                    style={[
                      styles.segmentConnected,
                      { flex: connectedFlex },
                    ]}
                  />
                )}
                {unconnected > 0 && (
                  <View
                    style={[
                      styles.segmentUnconnected,
                      { flex: unconnectedFlex },
                    ]}
                  />
                )}
              </>
            ) : (
              <View style={styles.segmentEmpty} />
            )}
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
                Unanswered ({unconnected})
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column: Giant Total Attempts Number */}
        <View style={styles.bottomRightCol}>
          <Text style={styles.bottomGiantNumber}>{attempts}</Text>
          <Text style={styles.bottomGiantLabel}>Dials</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomCard: {
    backgroundColor: '#151824',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#242A3E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomCardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLeftCol: {
    flex: 1,
    paddingRight: 16,
  },
  cardHighlightedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#7B87A2',
    marginTop: 2,
    marginBottom: 14,
  },
  segmentedTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E2333',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  segmentConnected: {
    backgroundColor: '#38BDF8',
  },
  segmentUnconnected: {
    backgroundColor: '#334155',
  },
  segmentEmpty: {
    flex: 1,
    backgroundColor: '#1E2333',
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
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
  legendDotOther: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E9BB5',
  },
  bottomRightCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#1E2436',
  },
  bottomGiantNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  bottomGiantLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B87A2',
    marginTop: 1,
  },
});
