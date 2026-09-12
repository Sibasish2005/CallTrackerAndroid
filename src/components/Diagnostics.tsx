import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DiagnosticsProps {
  isLoadingHistory: boolean;
  permissionGranted: boolean;
  isListening: boolean;
  statusMessage: string;
  onSyncLog: () => void;
  onRequestPermissions: () => void;
  onStartCallListener: () => void;
}

export const Diagnostics: React.FC<DiagnosticsProps> = ({
  isLoadingHistory,
  permissionGranted,
  isListening,
  statusMessage,
  onSyncLog,
  onRequestPermissions,
  onStartCallListener,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.statusHeaderRow}>
        <Text style={styles.cardSectionLabel}>SERVICE DIAGNOSTICS</Text>
        <TouchableOpacity
          onPress={onSyncLog}
          disabled={isLoadingHistory}
          style={styles.refreshBadge}>
          {isLoadingHistory ? (
            <ActivityIndicator size="small" color="#38BDF8" />
          ) : (
            <Text style={styles.refreshBadgeText}>↻ Sync Log</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.diagnosticsGrid}>
        <TouchableOpacity
          style={[
            styles.diagnosticChip,
            permissionGranted && styles.diagnosticChipActive,
          ]}
          onPress={onRequestPermissions}>
          <Text style={styles.diagnosticChipIcon}>
            {permissionGranted ? '✓' : '!'}
          </Text>
          <Text style={styles.diagnosticChipText}>
            {permissionGranted ? 'Permissions OK' : 'Grant Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.diagnosticChip,
            isListening && styles.diagnosticChipActive,
          ]}
          onPress={onStartCallListener}>
          <Text style={styles.diagnosticChipIcon}>
            {isListening ? '●' : '○'}
          </Text>
          <Text style={styles.diagnosticChipText}>
            {isListening ? 'Listener Running' : 'Start Listener'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusLogLine}>
        <Text style={styles.statusLogLabel}>Log:</Text>
        <Text style={styles.statusLogMessage} numberOfLines={1}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161F30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22314E',
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#0C4A6E',
    borderRadius: 12,
  },
  refreshBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  diagnosticChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 6,
  },
  diagnosticChipActive: {
    borderColor: '#059669',
    backgroundColor: '#064E3B',
  },
  diagnosticChipIcon: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
  },
  diagnosticChipText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  statusLogLine: {
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLogLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 6,
  },
  statusLogMessage: {
    fontSize: 11,
    color: '#38BDF8',
    flex: 1,
  },
});
