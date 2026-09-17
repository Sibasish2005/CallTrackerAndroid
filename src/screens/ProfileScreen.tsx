import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/common/Card';
import { Avatar } from '../components/common/Avatar';
import { HeeyakuLogo } from '../components/common/HeeyakuLogo';
import { apiClient } from '../services/apiClient';
import { authStorage, EmployeeProfile } from '../services/authStorage';
import { COLORS, RADII, SPACING } from '../theme/colors';

interface ProfileScreenProps {
  permissionGranted: boolean;
  isListening: boolean;
  statusMessage: string;
  onRequestPermissions: () => void;
  onRefreshListener: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  permissionGranted,
  isListening,
  onRequestPermissions,
  onLogout,
}) => {
  const isFullyActive = permissionGranted && isListening;
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [stats, setStats] = useState<{ totalAssigned: number; contactedToday: number; convertedTotal: number }>({
    totalAssigned: 0,
    contactedToday: 0,
    convertedTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBackendProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Initial load from local cached session
      const cached = await authStorage.getSession();
      if (cached?.employee) {
        setProfile(cached.employee);
      }

      // 2. Fetch fresh details & live stats from backend
      const res = await apiClient.getMe();
      if (res.success && res.employee) {
        setProfile(res.employee);
        if (res.stats) setStats(res.stats);
      }
    } catch (e) {
      console.warn('Failed to load fresh employee profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBackendProfile();
  }, [loadBackendProfile]);

  const handleLogout = async () => {
    await authStorage.clearSession();
    if (onLogout) onLogout();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadBackendProfile(true)}
          tintColor="#38BDF8"
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BDA Profile</Text>
      </View>

      {/* Employee Identity Card */}
      <Card variant="default" style={styles.card}>
        <View style={styles.profileRow}>
          <Avatar name={profile?.name || 'Associate'} size={54} />
          <View style={styles.profileDetails}>
            <Text style={styles.employeeName}>{profile?.name || 'Staff Member'}</Text>
            <Text style={styles.employeeRole}>
              {profile?.role || profile?.team || 'Business Development Associate'}
            </Text>
          </View>
        </View>
      </Card>

      {/* LIVE CRM OUTPUT & METRICS */}
      <Text style={styles.sectionTitle}>LIVE CRM ACTIVITY</Text>
      <Card variant="default" style={styles.card}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{loading ? '-' : stats.totalAssigned}</Text>
            <Text style={styles.statLabel}>Assigned Leads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{loading ? '-' : stats.contactedToday}</Text>
            <Text style={styles.statLabel}>Contacted Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#22C55E' }]}>{loading ? '-' : stats.convertedTotal}</Text>
            <Text style={styles.statLabel}>Converted</Text>
          </View>
        </View>
      </Card>

      {/* MY WORK IDENTITY */}
      <Text style={styles.sectionTitle}>MY WORK IDENTITY</Text>
      <Card variant="default" style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Employee Code</Text>
          <Text style={styles.infoValueMono}>{profile?.employeeCode || 'EMP-XXXX'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Login Email</Text>
          <Text style={styles.infoValue}>{profile?.email || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Official Role</Text>
          <Text style={styles.infoValue}>Business Development Associate</Text>
        </View>
        <View style={styles.infoRowLast}>
          <Text style={styles.infoLabel}>Contact Number</Text>
          <Text style={styles.infoValue}>{profile?.phoneNumber || '-'}</Text>
        </View>
      </Card>

      {/* TELEPHONY TELEMETRY APP STATUS */}
      <Text style={styles.sectionTitle}>APP TELEPHONY STATUS</Text>
      <Card variant="default" style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Call Tracker Engine</Text>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isFullyActive ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={styles.statusText}>
              {isFullyActive ? 'Active & Listening' : 'Permission Required'}
            </Text>
          </View>
        </View>

        {!isFullyActive && (
          <View style={styles.permissionActionBox}>
            <Text style={styles.permissionPromptText}>
              Call tracking needs telephony permission to log calls automatically.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRequestPermissions}
              style={styles.allowButton}>
              <Text style={styles.allowButtonText}>Grant Telephony Access</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleLogout}
        style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Sign Out of Workspace</Text>
      </TouchableOpacity>

      {/* Subtle Brand Footer */}
      <View style={styles.footerBranding}>
        <HeeyakuLogo size={22} />
        <Text style={styles.footerText}>HEEYAKU Call Tracker & CRM • v1.2</Text>
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
    paddingBottom: 48,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 12,
    color: COLORS.brandCyan,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D919C',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#8D919C',
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#272932',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#272932',
  },
  infoRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 11,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8D919C',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoValueMono: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: COLORS.brandCyan,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121316',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionActionBox: {
    marginTop: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 12,
  },
  permissionPromptText: {
    fontSize: 11,
    color: '#F59E0B',
    lineHeight: 16,
    marginBottom: 8,
  },
  allowButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  allowButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADII.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  footerBranding: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
});
