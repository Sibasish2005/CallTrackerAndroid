import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/colors';

interface ProgressBarProps {
  progress: number; // 0 to 1 or 0 to 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = COLORS.monoWhite,
  backgroundColor = COLORS.surfaceSubtle,
  height = 6,
  style,
}) => {
  // Normalize progress to percentage (0 - 100)
  const normalized = Math.min(100, Math.max(0, progress > 1 ? progress : progress * 100));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor,
          borderColor: COLORS.borderSubtle,
          borderWidth: 0.5,
        },
        style,
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${normalized}%`,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
