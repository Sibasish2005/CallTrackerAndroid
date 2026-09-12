import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CallRecord } from '../../types';
import { COLORS } from '../../theme/colors';
import { formatRelativeDate, formatVerboseDuration } from '../../utils/formatters';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Icon } from './Icon';

interface CallHistoryItemRowProps {
  item: CallRecord;
  onPressItem?: (item: CallRecord) => void;
  onQuickCall: (phoneNumber: string, contactName?: string) => void;
}

export const CallHistoryItemRow: React.FC<CallHistoryItemRowProps> = ({
  item,
  onPressItem,
  onQuickCall,
}) => {
  const number = item.phoneNumber || item.number || 'Unknown';
  const name = item.contactName || item.name || '';
  const date = item.startedAt || item.date || Date.now();
  const duration = item.durationSeconds ?? item.duration ?? 0;
  const isConnected = item.connected ?? (duration > 0 && item.type !== 3 && item.type !== 5);
  const isIncoming = item.type === 1 || item.callType === 'INCOMING';

  const displayName = name.trim().length > 0 ? name : number;
  const showSubNumber = name.trim().length > 0 && number !== name;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPressItem?.(item)}
      style={styles.container}>
      {/* Left: Contact Avatar */}
      <Avatar name={name} number={number} size={42} style={styles.avatar} />

      {/* Center: Contact Info & Call Meta */}
      <View style={styles.infoContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {displayName}
        </Text>

        {showSubNumber && (
          <Text style={styles.subNumberText} numberOfLines={1}>
            {number}
          </Text>
        )}

        <View style={styles.metaRow}>
          {/* Minimalist Arrow Icon */}
          <Icon
            name={isIncoming ? 'arrow-incoming' : 'arrow-outgoing'}
            size={12}
            color={COLORS.textTertiary}
            style={styles.arrowIcon}
          />

          {/* Duration or Unconnected Tag */}
          <Text style={styles.metaText}>
            {isConnected ? formatVerboseDuration(duration) : 'Unconnected'}
          </Text>

          {/* Disposition badge if tagged */}
          {item.outcomeLabel ? (
            <Badge
              label={item.outcomeLabel}
              variant="outline"
              size="sm"
              style={styles.outcomeBadge}
            />
          ) : null}
        </View>
      </View>

      {/* Right: Timestamp & 1-Tap Quick Dial Button */}
      <View style={styles.actionContainer}>
        <Text style={styles.dateText}>{formatRelativeDate(date)}</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onQuickCall(number, name)}
          style={styles.callButton}>
          <Icon name="call" size={16} color={COLORS.monoWhite} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1D22',
    borderBottomWidth: 1,
    borderBottomColor: '#262832',
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#23252E',
    borderColor: '#2E313D',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subNumberText: {
    fontSize: 12,
    color: '#8D919C',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  arrowIcon: {
    marginRight: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#8D919C',
    marginRight: 8,
  },
  outcomeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#8D919C',
    marginBottom: 6,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262832',
    borderWidth: 1,
    borderColor: '#343744',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
