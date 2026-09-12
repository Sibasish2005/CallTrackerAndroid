import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { THEME } from '../../theme';
import { COLORS } from '../../theme/colors';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  variant?: 'solid' | 'subtle' | 'outline' | 'glow';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = COLORS.monoSilver,
  bg,
  variant = 'subtle',
  size = 'md',
  style,
  textStyle,
  icon,
}) => {
  const isSm = size === 'sm';

  let computedBg = bg;
  let borderColor: string = COLORS.border;
  let textColor = color;

  if (!computedBg) {
    switch (variant) {
      case 'solid':
        computedBg = COLORS.monoDark;
        borderColor = COLORS.borderActive;
        textColor = COLORS.monoWhite;
        break;
      case 'outline':
        computedBg = 'transparent';
        borderColor = COLORS.borderMuted;
        textColor = COLORS.monoSilver;
        break;
      case 'glow':
        computedBg = COLORS.surfaceHighlight;
        borderColor = COLORS.borderMuted;
        textColor = COLORS.monoWhite;
        break;
      case 'subtle':
      default:
        computedBg = COLORS.surfaceSubtle;
        borderColor = COLORS.border;
        textColor = COLORS.textSecondary;
        break;
    }
  }

  return (
    <View
      style={[
        styles.badge,
        isSm ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: computedBg,
          borderColor,
          borderWidth: 1,
        },
        style,
      ]}>
      {icon ? (
        <Text style={[styles.icon, isSm ? styles.iconSm : styles.iconMd, { color: textColor }]}>
          {icon}{' '}
        </Text>
      ) : null}
      <Text
        style={[
          styles.text,
          isSm ? styles.textSm : styles.textMd,
          { color: textColor },
          textStyle,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.radii.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 11,
  },
  icon: {
    fontWeight: '700',
  },
  iconSm: {
    fontSize: 10,
  },
  iconMd: {
    fontSize: 11,
  },
});
