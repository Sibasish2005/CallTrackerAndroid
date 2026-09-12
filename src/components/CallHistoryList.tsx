import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {CallHistoryItem, FilterTab} from '../types';
import {
  formatCallTime,
  formatVerboseDuration,
  getCallTypeMeta,
} from '../utils/formatters';

interface CallHistoryListProps {
  filteredHistory: CallHistoryItem[];
  callHistory: CallHistoryItem[];
  isLoadingHistory: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: FilterTab;
  setSelectedFilter: (tab: FilterTab) => void;
  onRefreshHistory: () => void;
  onQuickCall: (number: string) => void;
}

const FILTER_TABS: FilterTab[] = ['ALL', 'OUTGOING', 'INCOMING', 'MISSED'];

export const CallHistoryList: React.FC<CallHistoryListProps> = ({
  filteredHistory,
  callHistory,
  isLoadingHistory,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  onRefreshHistory,
  onQuickCall,
}) => {
  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyTitle}>Call History</Text>
          <Text style={styles.historyCount}>
            {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'} logged
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefreshHistory}
          style={styles.historySyncButton}>
          <Text style={styles.historySyncText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search history by name or number..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              selectedFilter === tab && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(tab)}>
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === tab && styles.filterTabTextActive,
              ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List Items */}
      {isLoadingHistory && callHistory.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Reading Call Log...</Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyHistoryBox}>
          <Text style={styles.emptyHistoryIcon}>📋</Text>
          <Text style={styles.emptyHistoryTitle}>No Calls Found</Text>
          <Text style={styles.emptyHistorySubtitle}>
            {searchQuery
              ? 'No calls matching your search query.'
              : 'Call history is empty or requires permissions.'}
          </Text>
        </View>
      ) : (
        filteredHistory.map(item => {
          const meta = getCallTypeMeta(item.type ?? item.callType);
          const isMissed = item.type === 3 || item.type === 5 || item.callType === 'MISSED';

          return (
            <View key={item.id} style={styles.historyCard}>
              <View
                style={[
                  styles.historyTypeIconBadge,
                  {backgroundColor: meta.bg},
                ]}>
                <Text style={[styles.historyTypeIcon, {color: meta.color}]}>
                  {meta.icon}
                </Text>
              </View>

              <View style={styles.historyInfo}>
                <Text style={styles.historyContactName} numberOfLines={1}>
                  {item.name || item.contactName || item.number || item.phoneNumber}
                </Text>
                {(item.name || item.contactName) ? (
                  <Text style={styles.historySubNumber}>{item.number || item.phoneNumber}</Text>
                ) : null}
                <Text style={styles.historyTimestamp}>
                  {formatCallTime(item.date ?? item.startedAt ?? 0)} • {meta.label}
                </Text>
              </View>

              <View style={styles.historyActionRight}>
                <View
                  style={[
                    styles.durationBadge,
                    isMissed && styles.durationBadgeMissed,
                  ]}>
                  <Text
                    style={[
                      styles.durationBadgeText,
                      isMissed && styles.durationBadgeTextMissed,
                    ]}>
                    {isMissed ? 'Missed' : formatVerboseDuration(item.duration ?? item.durationSeconds ?? 0)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.quickCallButton}
                  activeOpacity={0.7}
                  onPress={() => onQuickCall(item.number || item.phoneNumber || '')}>
                  <Text style={styles.quickCallIcon}>📞</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  historySection: {
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  historyCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historySyncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historySyncText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22314E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    padding: 0,
  },
  searchClear: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#161F30',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22314E',
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyHistoryBox: {
    backgroundColor: '#161F30',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22314E',
  },
  emptyHistoryIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#161F30',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#22314E',
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTypeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyTypeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyInfo: {
    flex: 1,
    marginRight: 8,
  },
  historyContactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  historySubNumber: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  historyTimestamp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  historyActionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  durationBadge: {
    backgroundColor: '#0C4A6E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  durationBadgeMissed: {
    backgroundColor: '#7F1D1D',
  },
  durationBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  durationBadgeTextMissed: {
    color: '#FCA5A5',
  },
  quickCallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickCallIcon: {
    fontSize: 13,
  },
});
