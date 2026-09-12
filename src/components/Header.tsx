import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

interface HeaderProps {
  callState: string;
  isCallActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({callState, isCallActive}) => {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.appTitle}>Call Tracker</Text>
        <Text style={styles.appSubtitle}>
          Real-Time Telephony & Exact Duration Logger
        </Text>
      </View>

      <View
        style={[
          styles.stateBadge,
          isCallActive ? styles.stateBadgeActive : styles.stateBadgeIdle,
        ]}>
        <View
          style={[
            styles.statusIndicatorDot,
            isCallActive && styles.pulsingDot,
          ]}
        />
        <Text
          style={[
            styles.stateBadgeText,
            isCallActive
              ? styles.stateBadgeTextActive
              : styles.stateBadgeTextIdle,
          ]}>
          {isCallActive ? 'IN CALL' : callState}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  stateBadgeActive: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  stateBadgeIdle: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
    marginRight: 6,
  },
  pulsingDot: {
    backgroundColor: '#34D399',
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stateBadgeTextActive: {
    color: '#34D399',
  },
  stateBadgeTextIdle: {
    color: '#94A3B8',
  },
});
