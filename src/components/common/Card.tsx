import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { THEME } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'subtle' | 'elevated' | 'featured';
  glowColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  glowColor,
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        glowColor && {
          borderColor: glowColor,
          shadowColor: glowColor,
          shadowOpacity: 0.35,
          shadowRadius: 10,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: THEME.radii.lg, // 18px
    padding: THEME.spacing.lg,     // 16px
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  default: {
    backgroundColor: THEME.colors.surface, // #161920
  },
  subtle: {
    backgroundColor: THEME.colors.surfaceSubtle, // #1C2029
    borderColor: THEME.colors.borderSubtle,
  },
  elevated: {
    backgroundColor: THEME.colors.surfaceElevated,
    borderColor: THEME.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  featured: {
    backgroundColor: '#0E1A2E', // Subtle dark navy tint
    borderColor: '#1D3B6A',
  },
});
