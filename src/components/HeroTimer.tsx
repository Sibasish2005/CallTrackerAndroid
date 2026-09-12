import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CallHistoryItem} from '../types';
import {
  formatCallTime,
  formatStopwatch,
  formatVerboseDuration,
  getCallTypeMeta,
} from '../utils/formatters';

interface HeroTimerProps {
  isCallActive: boolean;
  currentDuration: number;
  lastCall: CallHistoryItem | null;
  activeNumber: string;
}

export const HeroTimer: React.FC<HeroTimerProps> = ({
  isCallActive,
  currentDuration,
  lastCall,
  activeNumber,
}) => {
  return (
    <View style={[styles.heroCard, isCallActive && styles.heroCardActive]}>
      <View style={styles.heroHeaderRow}>
        <Text style={styles.heroSubheader}>
          {isCallActive ? '● LIVE CALL DURATION' : 'LAST RECORDED CALL'}
        </Text>
        {isCallActive && (
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Big Timer Display */}
      <View style={styles.timerDisplay}>
        <Text
          style={[
            styles.timerValue,
            isCallActive && styles.timerValueActive,
          ]}>
          {isCallActive
            ? formatStopwatch(currentDuration)
            : lastCall
            ? formatStopwatch(lastCall.duration ?? lastCall.durationSeconds ?? 0)
            : '00:00'}
        </Text>
        <Text style={styles.timerUnit}>
          {isCallActive
            ? 'Active Call Time (MM:SS)'
            : lastCall
            ? `Exact Duration (${formatVerboseDuration(lastCall.duration ?? lastCall.durationSeconds ?? 0)})`
            : 'Awaiting call'}
        </Text>
      </View>

      {/* Last Call or Active Call Meta */}
      {isCallActive ? (
        <View style={styles.heroDetailsBox}>
          <View style={styles.heroDetailRow}>
            <Text style={styles.heroDetailLabel}>Connected To:</Text>
            <Text style={styles.heroDetailValue}>
              {activeNumber || 'Active Call'}
            </Text>
          </View>
          <View style={styles.heroDetailRow}>
            <Text style={styles.heroDetailLabel}>Status:</Text>
            <Text style={[styles.heroDetailValue, {color: '#34D399'}]}>
              Off-Hook (Talking)
            </Text>
          </View>
        </View>
      ) : lastCall ? (
        <View style={styles.heroDetailsBox}>
          <View style={styles.heroDetailRow}>
            <Text style={styles.heroDetailLabel}>Contact / Number:</Text>
            <Text style={styles.heroDetailValue}>
              {lastCall.name ? `${lastCall.name} (${lastCall.number || lastCall.phoneNumber})` : (lastCall.number || lastCall.phoneNumber)}
            </Text>
          </View>
          <View style={styles.heroDetailRow}>
            <Text style={styles.heroDetailLabel}>Time & Date:</Text>
            <Text style={styles.heroDetailValue}>
              {formatCallTime(lastCall.date ?? lastCall.startedAt ?? 0)}
            </Text>
          </View>
          <View style={styles.heroDetailRow}>
            <Text style={styles.heroDetailLabel}>Call Type:</Text>
            <Text
              style={[
                styles.heroDetailValue,
                {color: getCallTypeMeta(lastCall.type ?? lastCall.callType).color},
              ]}>
              {getCallTypeMeta(lastCall.type ?? lastCall.callType).label}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.heroEmptyText}>
          No calls tracked yet. Start a call below to track duration.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#131D31',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#1E2D4A',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardActive: {
    borderColor: '#059669',
    backgroundColor: '#0A2322',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroSubheader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  livePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  timerValue: {
    fontSize: 58,
    fontWeight: '900',
    color: '#E2E8F0',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerValueActive: {
    color: '#34D399',
  },
  timerUnit: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  heroDetailsBox: {
    backgroundColor: 'rgba(11, 15, 25, 0.65)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  heroDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  heroDetailLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  heroDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  heroEmptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
});
