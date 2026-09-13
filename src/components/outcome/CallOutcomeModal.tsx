import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallRecord } from '../../types';
import { COLORS } from '../../theme/colors';
import { getOutcomesForCall } from '../../config/outcomes';
import { formatVerboseDuration } from '../../utils/formatters';

interface CallOutcomeModalProps {
  call: CallRecord | null;
  visible: boolean;
  onSave: (callId: string, outcomeId: string, notes?: string) => void;
  onDismiss: () => void;
}

export const CallOutcomeModal: React.FC<CallOutcomeModalProps> = ({
  call,
  visible,
  onSave,
  onDismiss,
}) => {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  if (!call) return null;

  const isConnected = call.connected;
  const duration = call.durationSeconds ?? call.duration ?? 0;
  const outcomes = getOutcomesForCall(isConnected);

  const selectedOutcome = outcomes.find(o => o.id === selectedOutcomeId);
  const canSubmit = Boolean(selectedOutcomeId);

  const handleSave = () => {
    if (!selectedOutcomeId) return;
    onSave(call.id, selectedOutcomeId, notes.trim());
    setSelectedOutcomeId(null);
    setNotes('');
  };

  const handleClose = () => {
    setSelectedOutcomeId(null);
    setNotes('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Call Outcome</Text>
              <Text style={styles.subtitle}>
                {call.contactName || call.phoneNumber || call.number}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isConnected ? `Connected • ${formatVerboseDuration(duration)}` : 'Not Connected'}
              </Text>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Outcome Selection Grid - Monochromatic */}
            <Text style={styles.sectionLabel}>SELECT DISPOSITION</Text>
            <View style={styles.chipGrid}>
              {outcomes.map(outcome => {
                const isSelected = selectedOutcomeId === outcome.id;
                return (
                  <TouchableOpacity
                    key={outcome.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedOutcomeId(outcome.id)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}>
                      {outcome.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes Input */}
            <Text style={styles.sectionLabel}>
              NOTES {selectedOutcome?.requiresNotes ? '(REQUIRED)' : '(OPTIONAL)'}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add key highlights, customer feedback or next steps..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={styles.cancelButton}>
              <Text style={styles.cancelText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={!canSubmit}
              style={[
                styles.saveButton,
                !canSubmit && styles.saveButtonDisabled,
              ]}>
              <Text style={styles.saveText}>Save Outcome</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderMuted,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.monoWhite,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
    backgroundColor: COLORS.surfaceSubtle,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.monoSilver,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: COLORS.textTertiary,
    marginBottom: 10,
    marginTop: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderActive,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.monoWhite,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.borderActive,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: COLORS.monoWhite,
    fontWeight: '700',
    fontSize: 14,
  },
});
