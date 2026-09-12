import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/colors';

export type IconName =
  | 'home'
  | 'call'
  | 'analytics'
  | 'profile'
  | 'search'
  | 'check'
  | 'close'
  | 'arrow-outgoing'
  | 'arrow-incoming'
  | 'clock'
  | 'grid'
  | 'refresh';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = COLORS.textPrimary,
  style,
}) => {
  const stroke = 1.8;

  switch (name) {
    case 'home':
      // Minimalist geometric house: triangle roof + body
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.75,
              height: size * 0.75,
              borderTopWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              top: 2,
            }}
          />
          <View
            style={{
              width: size * 0.65,
              height: size * 0.45,
              borderWidth: stroke,
              borderTopWidth: 0,
              borderColor: color,
              borderRadius: 1,
              marginTop: -size * 0.28,
            }}
          />
        </View>
      );

    case 'call': {
      // Classic normal telephone handset receiver (Monochromatic)
      const s = size;
      return (
        <View
          style={[
            {
              width: s,
              height: s,
              alignItems: 'center',
              justifyContent: 'center',
            },
            style,
          ]}>
          <View
            style={{
              width: s * 0.78,
              height: s * 0.78,
              transform: [{ rotate: '-32deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {/* Top earpiece */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: s * 0.54,
                height: s * 0.24,
                borderRadius: s * 0.1,
                backgroundColor: color,
              }}
            />
            {/* Handle spine on the outer left */}
            <View
              style={{
                position: 'absolute',
                top: s * 0.1,
                left: 0,
                width: s * 0.22,
                height: s * 0.58,
                borderTopLeftRadius: s * 0.12,
                borderBottomLeftRadius: s * 0.12,
                borderRadius: s * 0.08,
                backgroundColor: color,
              }}
            />
            {/* Bottom mouthpiece */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: s * 0.54,
                height: s * 0.24,
                borderRadius: s * 0.1,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );
    }

    case 'analytics':
      // Minimalist 3 ascending bars
      return (
        <View
          style={[
            {
              width: size,
              height: size,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: size * 0.12,
              paddingBottom: 2,
            },
            style,
          ]}>
          <View
            style={{
              width: stroke * 1.3,
              height: size * 0.35,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              width: stroke * 1.3,
              height: size * 0.65,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              width: stroke * 1.3,
              height: size * 0.9,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'profile':
      // Minimalist head + shoulder
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.36,
              height: size * 0.36,
              borderRadius: size * 0.18,
              borderWidth: stroke,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          <View
            style={{
              width: size * 0.72,
              height: size * 0.36,
              borderTopLeftRadius: size * 0.36,
              borderTopRightRadius: size * 0.36,
              borderWidth: stroke,
              borderBottomWidth: 0,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'search':
      // Minimalist magnifying glass
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: size * 0.28,
              borderWidth: stroke,
              borderColor: color,
              top: -1,
              left: -1,
            }}
          />
          <View
            style={{
              width: stroke,
              height: size * 0.32,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
              position: 'absolute',
              bottom: 2,
              right: 4,
            }}
          />
        </View>
      );

    case 'check':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.55,
              height: size * 0.3,
              borderLeftWidth: stroke * 1.2,
              borderBottomWidth: stroke * 1.2,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
              top: -1,
            }}
          />
        </View>
      );

    case 'close':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.6,
              height: stroke,
              backgroundColor: color,
              position: 'absolute',
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              width: size * 0.6,
              height: stroke,
              backgroundColor: color,
              position: 'absolute',
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    case 'arrow-outgoing':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.55,
              height: size * 0.55,
              borderTopWidth: stroke,
              borderRightWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '0deg' }],
            }}
          />
          <View
            style={{
              width: stroke,
              height: size * 0.65,
              backgroundColor: color,
              position: 'absolute',
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'arrow-incoming':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.55,
              height: size * 0.55,
              borderBottomWidth: stroke,
              borderLeftWidth: stroke,
              borderColor: color,
              transform: [{ rotate: '0deg' }],
            }}
          />
          <View
            style={{
              width: stroke,
              height: size * 0.65,
              backgroundColor: color,
              position: 'absolute',
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'clock':
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.8,
              height: size * 0.8,
              borderRadius: size * 0.4,
              borderWidth: stroke,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: stroke,
                height: size * 0.26,
                backgroundColor: color,
                position: 'absolute',
                top: size * 0.12,
              }}
            />
            <View
              style={{
                width: size * 0.22,
                height: stroke,
                backgroundColor: color,
                position: 'absolute',
                right: size * 0.15,
              }}
            />
          </View>
        </View>
      );

    case 'grid':
    default:
      return (
        <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
          <View
            style={{
              width: size * 0.6,
              height: size * 0.6,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: 2,
            }}
          />
        </View>
      );
  }
};
