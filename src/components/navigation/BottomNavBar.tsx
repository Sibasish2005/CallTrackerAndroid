import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TabRoute } from '../../types';
import { COLORS } from '../../theme/colors';
import { Icon } from '../common/Icon';
import { HeeyakuLogo } from '../common/HeeyakuLogo';

interface BottomNavBarProps {
  currentTab: TabRoute;
  onSelectTab: (tab: TabRoute) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.navWrapper}>
      <View style={styles.navBar}>
        {/* Tab 1: Leads (Assigned leads CRM and actions) */}
        <TouchableOpacity
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={() => onSelectTab('leads')}
          style={styles.tabItem}>
          <Icon
            name="leads"
            size={20}
            color={currentTab === 'leads' ? COLORS.monoWhite : COLORS.monoMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'leads' && styles.tabLabelActive,
            ]}>
            Leads
          </Text>
          {currentTab === 'leads' && <View style={styles.activePill} />}
        </TouchableOpacity>

        {/* Tab 2: HEEYAKU (Home / Main daily dashboard) */}
        <TouchableOpacity
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={() => onSelectTab('dashboard')}
          style={styles.tabItem}>
          <View
            style={[
              styles.logoWrapper,
              currentTab !== 'dashboard' && styles.logoInactive,
            ]}>
            <HeeyakuLogo size={26} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'dashboard' && styles.tabLabelActive,
            ]}>
            Home
          </Text>
          {currentTab === 'dashboard' && <View style={styles.activePill} />}
        </TouchableOpacity>

        {/* Tab 3: Analytics (Performance information) */}
        <TouchableOpacity
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={() => onSelectTab('analytics')}
          style={styles.tabItem}>
          <Icon
            name="analytics"
            size={20}
            color={currentTab === 'analytics' ? COLORS.monoWhite : COLORS.monoMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'analytics' && styles.tabLabelActive,
            ]}>
            Analytics
          </Text>
          {currentTab === 'analytics' && <View style={styles.activePill} />}
        </TouchableOpacity>

        {/* Tab 4: Profile (Simple employee profile/settings) */}
        <TouchableOpacity
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={() => onSelectTab('profile')}
          style={styles.tabItem}>
          <Icon
            name="profile"
            size={20}
            color={currentTab === 'profile' ? COLORS.monoWhite : COLORS.monoMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'profile' && styles.tabLabelActive,
            ]}>
            Profile
          </Text>
          {currentTab === 'profile' && <View style={styles.activePill} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    backgroundColor: '#121316',
    borderTopWidth: 1,
    borderTopColor: '#23252E',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    paddingHorizontal: 8,
    paddingBottom: 4,
    backgroundColor: '#181920',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 6,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInactive: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activePill: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
});
