import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/common/Card';
import { Avatar } from '../components/common/Avatar';
import { HeeyakuLogo } from '../components/common/HeeyakuLogo';

interface ProfileScreenProps {
  permissionGranted: boolean;
  isListening: boolean;
  statusMessage: string;
  onRequestPermissions: () => void;
  onRefreshListener: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  permissionGranted,
  isListening,
  onRequestPermissions,
}) => {
  const isFullyActive = permissionGranted && isListening;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Employee Identity Card */}
      <Card variant="default" style={styles.card}>
        <View style={styles.profileRow}>
          <Avatar name="Rahul Sharma" size={54} />
          <View style={styles.profileDetails}>
            <Text style={styles.employeeName}>Rahul Sharma</Text>
            <Text style={styles.employeeRole}>Sales Executive</Text>
          </View>
        </View>
      </Card>

      {/* MY WORK */}
      <Text style={styles.sectionTitle}>MY WORK</Text>
      <Card variant="default" style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee ID</Text>
          <Text style={styles.infoValue}>EMP-1024</Text>
        </View>
        <View style={styles.infoRowLast}>
          <Text style={styles.infoLabel}>Team</Text>
          <Text style={styles.infoValue}>Sales</Text>
        </View>
      </Card>

      {/* APP STATUS */}
      <Text style={styles.sectionTitle}>APP</Text>
      <Card variant="default" style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Call Tracking</Text>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isFullyActive ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={styles.statusText}>
              {isFullyActive ? 'Active' : 'Action Needed'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRowLast}>
          <Text style={styles.infoLabel}>Notifications</Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>On</Text>
          </View>
        </View>

        {/* Friendly permission prompt if not granted */}
        {!isFullyActive && (
          <View style={styles.permissionActionBox}>
            <Text style={styles.permissionPromptText}>
              Call tracking needs permission to work.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRequestPermissions}
              style={styles.allowButton}>
              <Text style={styles.allowButtonText}>Allow Access</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* HELP & SUPPORT */}
      <Text style={styles.sectionTitle}>HELP</Text>
      <Card variant="default" style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} style={styles.helpRow}>
          <Text style={styles.helpLabel}>How HEEYAKU Works</Text>
          <Text style={styles.helpArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.helpRow}>
          <Text style={styles.helpLabel}>Help & Support</Text>
          <Text style={styles.helpArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.helpRowLast}>
          <Text style={styles.helpLabel}>About HEEYAKU</Text>
          <Text style={styles.helpArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* Subtle Brand Footer */}
      <View style={styles.footerBranding}>
        <HeeyakuLogo size={22} />
        <Text style={styles.footerText}>HEEYAKU Call Tracker</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121316',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#1C1D22',
    borderColor: '#272932',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 13,
    color: '#8D919C',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D919C',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262832',
  },
  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8D919C',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  permissionActionBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#262832',
    alignItems: 'center',
  },
  permissionPromptText: {
    fontSize: 13,
    color: '#F59E0B',
    marginBottom: 10,
    textAlign: 'center',
  },
  allowButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262832',
  },
  helpRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  helpLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  helpArrow: {
    fontSize: 20,
    color: '#8D919C',
    fontWeight: '600',
  },
  footerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
