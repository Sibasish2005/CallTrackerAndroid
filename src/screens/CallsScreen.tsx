import React from 'react';
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
  { id: 'NOT_CONNECTED', label: 'Unconnected' },
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
  const canDial = phoneNumber.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Fixed top section: Quick Cellular Dialer, Search, and Filter Chips */}
      <View style={styles.headerContainer}>
        {/* Quick Dialer Card */}
        <Card variant="default" style={styles.dialerCard}>
          <Text style={styles.dialerLabel}>QUICK CELLULAR DIALER</Text>
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
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={() => setPhoneNumber('')}
                  style={styles.clearButton}>
                  <Icon name="close" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
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
            onPress={onRefresh}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>↻ Refresh</Text>
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
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={COLORS.monoWhite}
            colors={[COLORS.monoWhite]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No HEEYAKU calls yet</Text>
              <Text style={styles.emptySubtitle}>
                Calls dialed using the Quick Cellular Dialer above will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.monoWhite} />
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
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.monoSilver,
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
