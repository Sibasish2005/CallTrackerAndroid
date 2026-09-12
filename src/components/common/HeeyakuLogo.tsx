import React from 'react';
import { StyleSheet, View } from 'react-native';

interface HeeyakuLogoProps {
  size?: number;
  showBackground?: boolean;
}

/**
 * Official HEEYAKU Brand Logo
 * Recreated with exact proportional geometry:
 * - 3 white horizontal cascading pills (right-aligned)
 * - 1 Electric Blue (#2563EB) accent dot on the bottom-left
 * - Dark Navy (#0B1F33) rounded container
 */
export const HeeyakuLogo: React.FC<HeeyakuLogoProps> = ({
  size = 48,
  showBackground = true,
}) => {
  // Base SVG viewBox is 64x64
  const scale = size / 64;

  const barHeight = 9.75 * scale;
  const barRadius = 3.5 * scale;
  const dotRadius = 4.5 * scale;
  const cornerRadius = 14 * scale;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
          backgroundColor: showBackground ? '#0B1F33' : 'transparent',
        },
      ]}>
      {/* Content wrapper with proportional padding */}
      <View
        style={{
          width: 48 * scale,
          height: 38.25 * scale,
          justifyContent: 'space-between',
        }}>
        {/* Top Bar (Longest: 48) */}
        <View
          style={{
            width: 48 * scale,
            height: barHeight,
            borderRadius: barRadius,
            backgroundColor: '#FFFFFF',
          }}
        />

        {/* Middle Bar (Medium: 30.75, right-aligned) */}
        <View
          style={{
            width: 30.75 * scale,
            height: barHeight,
            borderRadius: barRadius,
            backgroundColor: '#FFFFFF',
            alignSelf: 'flex-end',
          }}
        />

        {/* Bottom Row: Electric Blue Dot + Short Bar (18.75) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            height: barHeight,
          }}>
          {/* Accent Dot (cx=6 in 48 grid -> positioned on left) */}
          <View
            style={{
              width: dotRadius * 2,
              height: dotRadius * 2,
              borderRadius: dotRadius,
              backgroundColor: '#2563EB',
              marginLeft: 1.5 * scale,
            }}
          />

          {/* Short Bar (18.75) */}
          <View
            style={{
              width: 18.75 * scale,
              height: barHeight,
              borderRadius: barRadius,
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
