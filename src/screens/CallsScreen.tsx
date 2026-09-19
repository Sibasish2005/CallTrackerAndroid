import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallRecord, FilterTab } from '../types';
import { COLORS } from '../theme/colors';
import { Card } from '../components/common/Card';
import { CallHistoryItemRow } from '../components/common/CallHistoryItemRow';
import { Icon } from '../components/common/Icon';

interface CallsScreenProps {
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  filteredCalls: CallRecord[];
  allCallsCount: number;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: FilterTab;
  setSelectedFilter: (filter: FilterTab) => void;
  onMakeCall: (number?: string, name?: string) => void;
  onRefresh: () => void;
  onSelectCall: (call: CallRecord) => void;
}

const FILTER_OPTIONS: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'CONNECTED', label: 'Connected' },
  { id: 'NOT_CONNECTED', label: 'Not Connected' },
  { id: 'OUTGOING', label: 'Outgoing' },
  { id: 'INCOMING', label: 'Incoming' },
  { id: 'MISSED', label: 'Missed' },
];

export const CallsScreen: React.FC<CallsScreenProps> = ({
  phoneNumber,
  setPhoneNumber,
  filteredCalls,
  allCallsCount,
  isLoading,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  onMakeCall,
  onRefresh,
  onSelectCall,
}) => {
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isButtonRefreshing, setIsButtonRefreshing] = useState(false);

  const canDial = phoneNumber.trim().length > 0;

  // Smooth refresh on button click: slight UI change with a small timeout, zero jitter
  const handleButtonRefresh = useCallback(async () => {
    if (isButtonRefreshing || isLoading) return;
    setIsButtonRefreshing(true);
    try {
      const refreshPromise = Promise.resolve(onRefresh());
      const minDelay = new Promise<void>(resolve => setTimeout(() => resolve(), 550));
      await Promise.all([refreshPromise, minDelay]);
    } finally {
      setIsButtonRefreshing(false);
    }
  }, [isButtonRefreshing, isLoading, onRefresh]);

  // Pull to refresh handler: smooth animation with dark spinner, no jarring layout shift
  const handlePullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      const refreshPromise = Promise.resolve(onRefresh());
      const minDelay = new Promise<void>(resolve => setTimeout(() => resolve(), 550));
      await Promise.all([refreshPromise, minDelay]);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [onRefresh]);

  const isAnyRefreshing = isButtonRefreshing || isLoading;

  return (
    <View style={styles.container}>
      {/* Fixed top section: Quick Cellular Dialer, Search, and Filter Chips */}
      <View style={styles.headerContainer}>
        {/* Quick Dialer Card */}
        <Card variant="default" style={styles.dialerCard}>
          <Text style={styles.dialerLabel}>DIAL NUMBER</Text>
          <View style={styles.dialerInputRow}>
            <View style={styles.phoneInputWrapper}>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number..."
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
              {phoneNumber.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  delayPressIn={0}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setPhoneNumber('')}
                  style={styles.clearButton}>
                  <Icon name="close" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              delayPressIn={0}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={() => {
                Keyboard.dismiss();
                onMakeCall();
              }}
              disabled={!canDial}
              style={[styles.dialButton, !canDial && styles.dialButtonDisabled]}>
              <Icon name="call" size={14} color={COLORS.monoWhite} />
              <Text style={styles.dialText}>Call</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Search Input */}
        <View style={styles.searchBarContainer}>
          <Icon name="search" size={14} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or number..."
            placeholderTextColor={COLORS.textTertiary}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => setSearchQuery('')}
              style={styles.searchClearButton}>
              <Icon name="close" size={14} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.filterScrollContent}>
          {FILTER_OPTIONS.map(item => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                delayPressIn={0}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                onPress={() => setSelectedFilter(item.id)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results summary row */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {filteredCalls.length} of {allCallsCount} calls
          </Text>
          <TouchableOpacity
            onPress={handleButtonRefresh}
            disabled={isAnyRefreshing}
            delayPressIn={0}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.refreshButton, isButtonRefreshing && styles.refreshButtonActive]}>
            {isButtonRefreshing ? (
              <View style={styles.refreshLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.monoSilver} style={styles.miniSpinner} />
                <Text style={styles.refreshButtonTextSyncing}>Syncing...</Text>
              </View>
            ) : (
              <Text style={styles.refreshButtonText}>↻ Refresh</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Calls History List */}
      <FlatList
        data={filteredCalls}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        renderItem={({ item }) => (
          <CallHistoryItemRow
            item={item}
            onPressItem={onSelectCall}
            onQuickCall={(num, name) => onMakeCall(num, name)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={handlePullRefresh}
            colors={[COLORS.monoWhite]}
            progressBackgroundColor="#23252E"
            tintColor={COLORS.monoWhite}
            progressViewOffset={10}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonList}>
              {[1, 2, 3, 4].map(key => (
                <View key={key} style={styles.skeletonRow}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonBody}>
                    <View style={styles.skeletonName} />
                    <View style={styles.skeletonSub} />
                    <View style={styles.skeletonMetaRow}>
                      <View style={styles.skeletonMetaIcon} />
                      <View style={styles.skeletonMetaText} />
                    </View>
                  </View>
                  <View style={styles.skeletonCallBtn} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No HEEYAKU calls yet</Text>
              <Text style={styles.emptySubtitle}>
                Calls dialed using the Quick Cellular Dialer above will appear here
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  dialerCard: {
    marginBottom: 16,
  },
  dialerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dialerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  phoneInput: {
    height: 46,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 14,
    paddingRight: 38,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    padding: 6,
    zIndex: 10,
  },
  dialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  dialButtonDisabled: {
    opacity: 0.45,
  },
  dialText: {
    color: COLORS.monoWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  searchClearButton: {
    padding: 6,
  },
  filterScrollContent: {
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.surfaceHighlight,
    borderColor: COLORS.borderActive,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.monoWhite,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    minHeight: 28,
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  refreshButton: {
    minHeight: 28,
    minWidth: 74,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonActive: {
    opacity: 0.8,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  miniSpinner: {
    transform: [{ scale: 0.7 }],
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.monoSilver,
  },
  refreshButtonTextSyncing: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
  },
  skeletonList: {
    paddingTop: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1C1D22',
    borderBottomWidth: 1,
    borderBottomColor: '#262832',
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#262832',
    marginRight: 12,
  },
  skeletonBody: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonName: {
    width: '45%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#262832',
    marginBottom: 8,
  },
  skeletonSub: {
    width: '30%',
    height: 11,
    borderRadius: 5,
    backgroundColor: '#23252E',
    marginBottom: 8,
  },
  skeletonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonMetaIcon: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#23252E',
  },
  skeletonMetaText: {
    width: 50,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#23252E',
  },
  skeletonCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#262832',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
});
