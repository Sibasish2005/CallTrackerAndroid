import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, RADII, SPACING } from '../../theme/colors';
import { apiClient } from '../../services/apiClient';

export interface LeadItem {
  id: string;
  leadCode: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
  company?: string | null; // Course / Institution
  status: string;
  notes?: string | null;
  assignedAt?: string | null;
  updatedAt?: string | null;
}

interface LeadDispositionModalProps {
  visible: boolean;
  lead: LeadItem | null;
  thenOpenWhatsApp?: boolean;
  onClose: () => void;
  onSuccess: (updatedLead: LeadItem) => void;
}

const STATUS_OPTIONS = [
  { id: 'CONTACTED', label: 'Contacted (Spoke with Student)' },
  { id: 'INTERESTED', label: 'Interested (Wants Details/Demo)' },
  { id: 'FOLLOW_UP', label: 'Follow Up Scheduled' },
  { id: 'CALL_BACK', label: 'Student Requested Call Back' },
  { id: 'CONVERTED', label: 'Converted / Admitted 🎉' },
  { id: 'NO_ANSWER', label: 'No Answer / Ringing' },
  { id: 'BUSY', label: 'Busy / Disconnected' },
  { id: 'WRONG_NUMBER', label: 'Wrong Number' },
  { id: 'NOT_INTERESTED', label: 'Not Interested' },
];

export const LeadDispositionModal: React.FC<LeadDispositionModalProps> = ({
  visible,
  lead,
  thenOpenWhatsApp = false,
  onClose,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('CONTACTED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setSelectedStatus(
        lead.status === 'NEW' || lead.status === 'ASSIGNED' ? 'CONTACTED' : lead.status
      );
      setNotes('');
      setError(null);
    }
  }, [lead]);

  if (!visible || !lead) return null;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiClient.submitLeadDisposition(lead.id, {
        status: selectedStatus,
        notes: notes.trim() || undefined,
      });

      if (!res.success || !res.lead) {
        setError(res.error || 'Failed to update lead KPI disposition.');
        setSubmitting(false);
        return;
      }

      onSuccess(res.lead);
      onClose();

      // If this disposition was triggered before WhatsApp redirection, trigger it now!
      if (thenOpenWhatsApp) {
        const cleanNumber = lead.phoneNumber.replace(/[^0-9]/g, '');
        const targetNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
        const url = `https://wa.me/${targetNumber}`;
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(`whatsapp://send?phone=${targetNumber}`);
          }
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server connection error.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>
                {thenOpenWhatsApp ? 'Update KPI to Unlock WhatsApp' : 'Update Lead Disposition (KPI)'}
              </Text>
              <Text style={styles.leadSubtitle}>
                {lead.name} • {lead.phoneNumber}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {thenOpenWhatsApp && (
            <View style={styles.noticeBanner}>
              <Text style={styles.noticeText}>
              Please log discussion outcome to the database before redirecting to WhatsApp.
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Status Selection */}
            <Text style={styles.fieldLabel}>Pipeline Outcome / Status *</Text>
            <View style={styles.optionsContainer}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedStatus(opt.id)}
                    style={[styles.statusOption, isSelected && styles.statusOptionSelected]}>
                    <Text style={[styles.statusOptionText, isSelected && styles.statusOptionTextSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={[styles.fieldLabel, { marginTop: SPACING.md }]}>Discussion Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Student requested fee structure and 2026 batch details"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} disabled={submitting} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}>
              {submitting ? (
                <ActivityIndicator color={COLORS.monoWhite} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {thenOpenWhatsApp ? 'Save KPI & Open WhatsApp' : 'Save KPI Disposition'}
                </Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  leadSubtitle: {
    fontSize: 11,
    color: COLORS.brandCyan,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  noticeText: {
    color: COLORS.brandCyan,
    fontSize: 11,
    lineHeight: 15,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: RADII.sm,
  },
  errorText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '500',
  },
  scrollArea: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  optionsContainer: {
    gap: 6,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  statusOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderColor: COLORS.brandBlue,
  },
  statusOptionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusOptionTextSelected: {
    color: COLORS.monoWhite,
    fontWeight: '700',
  },
  checkIcon: {
    color: COLORS.brandCyan,
    fontSize: 13,
    fontWeight: '900',
  },
  notesInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 12,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: COLORS.brandBlue,
    borderRadius: RADII.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.monoWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
