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

const CallHistoryItemRowComponent: React.FC<CallHistoryItemRowProps> = ({
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
    <View style={styles.container}>
      {/* Clickable Left & Center Body: View Call Details / Disposition Modal */}
      <TouchableOpacity
        activeOpacity={0.7}
        delayPressIn={0}
        onPress={() => onPressItem?.(item)}
        style={styles.infoTouchable}>
        {/* Contact Avatar */}
        <Avatar name={name} number={number} size={42} style={styles.avatar} />

        {/* Contact Info & Meta */}
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
            <Icon
              name={isIncoming ? 'arrow-incoming' : 'arrow-outgoing'}
              size={12}
              color={COLORS.textTertiary}
              style={styles.arrowIcon}
            />

            <Text style={styles.metaText}>
              {isConnected ? formatVerboseDuration(duration) : 'Unconnected'}
            </Text>

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

        {/* Date / Timestamp */}
        <Text style={styles.dateText}>{formatRelativeDate(date)}</Text>
      </TouchableOpacity>

      {/* Independent 1-Tap Quick Dial Button: Clean sibling without touch responder conflict */}
      <TouchableOpacity
        activeOpacity={0.65}
        delayPressIn={0}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={() => onQuickCall(number, name)}
        style={styles.callButton}>
        <Icon name="call" size={16} color={COLORS.monoWhite} />
      </TouchableOpacity>
    </View>
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
  infoTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    marginRight: 12,
    backgroundColor: '#23252E',
    borderColor: '#2E313D',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
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
  dateText: {
    fontSize: 11,
    color: '#8D919C',
    alignSelf: 'center',
    marginRight: 4,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#262832',
    borderWidth: 1,
    borderColor: '#343744',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const CallHistoryItemRow = React.memo(CallHistoryItemRowComponent);
