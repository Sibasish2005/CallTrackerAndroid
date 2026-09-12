import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HeeyakuLogo } from '../common/HeeyakuLogo';
import { COLORS } from '../../theme/colors';

interface HeeyakuNavButtonProps {
  isActive: boolean;
  onPress: () => void;
}

export const HeeyakuNavButton: React.FC<HeeyakuNavButtonProps> = ({
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}>
      <View
        style={[
          styles.glowRing,
          isActive && styles.glowRingActive,
        ]}>
        <View style={styles.buttonBody}>
          <HeeyakuLogo size={36} showBackground={false} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.surfaceElevated,
    padding: 3,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.brandBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  glowRingActive: {
    borderColor: COLORS.brandBlue,
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  buttonBody: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: COLORS.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
