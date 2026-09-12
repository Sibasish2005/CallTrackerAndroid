import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { formatDuration } from '../../utils/formatters';

interface LiveCallCardProps {
  isOffhook: boolean;
  activeNumber: string;
  activeContactName?: string;
  currentDuration: number;
}

export const LiveCallCard: React.FC<LiveCallCardProps> = ({
  isOffhook,
  activeNumber,
  activeContactName,
  currentDuration,
}) => {
  return (
    <Card variant="default" style={styles.liveCallCard}>
      <View style={styles.liveCallHeader}>
        <View style={styles.liveStatusRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveStatusText}>
            {isOffhook ? 'LIVE CALL IN PROGRESS' : 'CONNECTING...'}
          </Text>
        </View>
        <Badge label="Cellular" variant="outline" size="sm" />
      </View>

      <Text style={styles.liveCallerName} numberOfLines={1}>
        {activeContactName || activeNumber || 'Direct Dial'}
      </Text>
      {activeContactName ? (
        <Text style={styles.liveCallerNumber}>{activeNumber}</Text>
      ) : null}

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>CONNECTED DURATION</Text>
        <Text style={styles.timerValue}>
          {formatDuration(currentDuration)}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  liveCallCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D303C',
    backgroundColor: '#181920',
  },
  liveCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveCallerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  liveCallerNumber: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  timerContainer: {
    marginTop: 14,
    backgroundColor: '#20222B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B2D38',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
