import { useMemo, useState } from 'react';
import { CallRecord, FilterTab } from '../../types';

export interface UseCallFilterReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: FilterTab;
  setSelectedFilter: (filter: FilterTab) => void;
  filteredHistory: CallRecord[];
}

export function useCallFilter(calls: CallRecord[]): UseCallFilterReturn {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');

  // Filtered call history: strictly filtered based on tab and search text
  const filteredHistory = useMemo(() => {
    return (calls || []).filter(item => {
      // Tab filter
      if (selectedFilter === 'OUTGOING' && item.callType !== 'OUTGOING') {
        return false;
      }
      if (selectedFilter === 'INCOMING' && item.callType !== 'INCOMING') {
        return false;
      }
      if (selectedFilter === 'MISSED' && item.callType !== 'MISSED') {
        return false;
      }
      if (selectedFilter === 'CONNECTED' && !item.connected) {
        return false;
      }
      if (selectedFilter === 'NOT_CONNECTED' && item.connected) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = (item.phoneNumber || item.number)?.toLowerCase().includes(query);
        const matchesName = (item.contactName || item.name)?.toLowerCase().includes(query);
        return matchesNumber || matchesName;
      }

      return true;
    });
  }, [calls, selectedFilter, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    filteredHistory,
  };
}
