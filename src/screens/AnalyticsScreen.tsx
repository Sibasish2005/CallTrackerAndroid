import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallRecord, EmployeeMetrics } from '../types';
import { DEFAULT_CALL_OUTCOMES } from '../config/outcomes';
import { formatVerboseDuration } from '../utils/formatters';
import { getMonthRange } from '../utils/dateRange';
import { calculateMetrics } from '../hooks/useCallMetrics';
import { apiClient } from '../services/apiClient';

interface AnalyticsScreenProps {
  todayMetrics: EmployeeMetrics;
  todayCalls: CallRecord[];
  lifetimeMetrics: EmployeeMetrics;
  appCalls?: CallRecord[];
}

type PeriodTab = 'today' | 'month' | 'lifetime';

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  todayMetrics: propTodayMetrics,
  todayCalls: propTodayCalls,
  lifetimeMetrics: propLifetimeMetrics,
  appCalls: propAppCalls = [],
}) => {
  const [selectedTab, setSelectedTab] = useState<PeriodTab>('today');
  const [backendTodayMetrics, setBackendTodayMetrics] = useState<EmployeeMetrics | null>(null);
  const [backendLifetimeMetrics, setBackendLifetimeMetrics] = useState<EmployeeMetrics | null>(null);
  const [backendTodayCalls, setBackendTodayCalls] = useState<CallRecord[] | null>(null);
  const [backendAllCalls, setBackendAllCalls] = useState<CallRecord[] | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Manual pull-to-refresh (no aggressive 4s interval)
  const fetchBackendAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await apiClient.getAnalytics();
      if (res.success) {
        if (res.todayMetrics) setBackendTodayMetrics(res.todayMetrics);
        if (res.lifetimeMetrics) setBackendLifetimeMetrics(res.lifetimeMetrics);
        if (res.todayCalls) setBackendTodayCalls(res.todayCalls);
        if (res.allCalls) setBackendAllCalls(res.allCalls);
      }
    } catch (e) {
      console.warn('Backend analytics fetch error:', e);
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const todayMetrics = backendTodayMetrics !== null ? backendTodayMetrics : propTodayMetrics;
  const lifetimeMetrics = backendLifetimeMetrics !== null ? backendLifetimeMetrics : propLifetimeMetrics;
  const todayCalls = backendTodayCalls !== null ? backendTodayCalls : propTodayCalls;
  const appCalls = backendAllCalls !== null ? backendAllCalls : propAppCalls;

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(currentDate.getMonth());
  const [showDailyBreakdown, setShowDailyBreakdown] = useState<boolean>(false);

  // Android hardware back button handler for daily subpage
  useEffect(() => {
    if (!showDailyBreakdown) return;
    const backAction = () => {
      setShowDailyBreakdown(false);
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [showDailyBreakdown]);

  // Monthly Date Range & Valid Days
  const monthData = useMemo(
    () => getMonthRange(selectedYear, selectedMonthIndex),
    [selectedYear, selectedMonthIndex]
  );

  const monthCalls = useMemo(() => {
    return appCalls.filter((call) => {
      const timestamp = Number(call.startedAt || call.date || 0);
      return timestamp >= monthData.range.startMs && timestamp <= monthData.range.endMs;
    });
  }, [appCalls, monthData]);

  const monthMetrics = useMemo(() => calculateMetrics(monthCalls), [monthCalls]);

  const callsByDay = useMemo(() => {
    const map = new Map<number, CallRecord[]>();
    for (const call of monthCalls) {
      const callDate = new Date(Number(call.startedAt || call.date || 0));
      const day = callDate.getDate();
      if (!map.has(day)) {
        map.set(day, []);
      }
      map.get(day)!.push(call);
    }
    return map;
  }, [monthCalls]);

  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentOrFuture =
      selectedYear > currentDate.getFullYear() ||
      (selectedYear === currentDate.getFullYear() && selectedMonthIndex >= currentDate.getMonth());

    if (isCurrentOrFuture) return;

    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonthIndex((m) => m + 1);
    }
  };

  const isNextDisabled =
    selectedYear === currentDate.getFullYear() &&
    selectedMonthIndex >= currentDate.getMonth();

  // Pick active metrics based on selected tab
  const activeMetrics =
    selectedTab === 'today'
      ? todayMetrics
      : selectedTab === 'month'
      ? monthMetrics
      : lifetimeMetrics;

  const totalCallsCount = activeMetrics.totalAttempts;

  // Day-by-day subpage
  if (showDailyBreakdown) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.subpageHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => setShowDailyBreakdown(false)}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>← Overview</Text>
          </TouchableOpacity>
          <Text style={styles.subpageMonthTag}>{monthData.monthLabel}</Text>
        </View>

        <Text style={styles.pageTitle}>Daily Calling Activity</Text>
        <Text style={styles.pageSubtitle}>
          Breakdown of calls logged during {monthData.monthLabel}
        </Text>

        <View style={styles.breakdownList}>
          {monthData.days.map((bucket) => {
            const dayCalls = callsByDay.get(bucket.dayNumber) || [];
            const dayMetrics = calculateMetrics(dayCalls);
            const hasCalls = dayCalls.length > 0;

            return (
              <View
                key={bucket.dateString}
                style={[
                  styles.dayRow,
                  bucket.isToday && styles.dayRowToday,
                  !hasCalls && styles.dayRowEmpty,
                ]}>
                <View style={styles.dayDateCol}>
                  <Text
                    style={[
                      styles.dayDateText,
                      bucket.isToday && styles.dayDateToday,
                      !hasCalls && styles.dayDateTextMuted,
                    ]}>
                    {bucket.dateString} {bucket.isToday ? '• Today' : ''}
                  </Text>
                </View>

                <View style={styles.dayMetricsCol}>
                  <Text
                    style={[
                      styles.dayCallsText,
                      !hasCalls && styles.dayCallsTextMuted,
                    ]}>
                    {dayCalls.length} {dayCalls.length === 1 ? 'call' : 'calls'} ({dayMetrics.totalConnected} connected)
                  </Text>
                  <Text style={styles.dayTalkTimeText}>
                    {formatVerboseDuration(dayMetrics.totalDurationSeconds)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowDailyBreakdown(false)}
          style={styles.returnButton}>
          <Text style={styles.returnButtonText}>Back to Overview</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchBackendAnalytics(true)}
          tintColor="#38BDF8"
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <Text style={styles.pageSubtitle}>Calling performance and outcomes</Text>
      </View>

      {/* Segmented Period Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedTab('today')}
          style={[styles.tabItem, selectedTab === 'today' && styles.tabItemActive]}>
          <Text style={[styles.tabText, selectedTab === 'today' && styles.tabTextActive]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedTab('month')}
          style={[styles.tabItem, selectedTab === 'month' && styles.tabItemActive]}>
          <Text style={[styles.tabText, selectedTab === 'month' && styles.tabTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedTab('lifetime')}
          style={[styles.tabItem, selectedTab === 'lifetime' && styles.tabItemActive]}>
          <Text style={[styles.tabText, selectedTab === 'lifetime' && styles.tabTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigator (Visible only in month tab) */}
      {selectedTab === 'month' && (
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrevMonth}
            style={styles.monthNavButton}>
            <Text style={styles.monthNavArrow}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.monthNavLabel}>{monthData.monthLabel}</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNextMonth}
            disabled={isNextDisabled}
            style={[styles.monthNavButton, isNextDisabled && styles.monthNavDisabled]}>
            <Text style={[styles.monthNavArrow, isNextDisabled && styles.monthNavArrowDisabled]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hero Performance Card */}
      <View style={styles.card}>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroLabel}>Calls Made</Text>
            <Text style={styles.heroValue}>{activeMetrics.totalAttempts}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroLabel}>Connection Rate</Text>
            <Text style={styles.heroValueAccent}>{activeMetrics.connectionRatePercent}%</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Connected</Text>
            <Text style={styles.statNumber}>{activeMetrics.totalConnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Unconnected</Text>
            <Text style={styles.statNumberMuted}>{activeMetrics.totalUnconnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Talk Time</Text>
            <Text style={styles.statNumber}>
              {formatVerboseDuration(activeMetrics.totalDurationSeconds)}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Avg Call</Text>
            <Text style={styles.statNumber}>
              {formatVerboseDuration(activeMetrics.averageDurationSeconds)}
            </Text>
          </View>
        </View>
      </View>

      {/* Call Outcome Distribution */}
      <View style={styles.card}>
        <View style={styles.outcomeCardHeader}>
          <Text style={styles.sectionHeaderTitle}>Call Outcomes</Text>
          <Text style={styles.sectionHeaderMeta}>
            {totalCallsCount} {totalCallsCount === 1 ? 'call' : 'calls'}
          </Text>
        </View>

        {/* Proportional Stacked Ratio Bar */}
        {totalCallsCount > 0 ? (
          <View style={styles.stackedBar}>
            {DEFAULT_CALL_OUTCOMES.map((outcome) => {
              const count = activeMetrics.outcomeDistribution[outcome.id] || 0;
              if (count === 0) return null;
              const flexWeight = count / totalCallsCount;
              return (
                <View
                  key={outcome.id}
                  style={[
                    styles.stackedSegment,
                    { flex: flexWeight, backgroundColor: outcome.color },
                  ]}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBar} />
        )}

        {/* Outcome Item Rows */}
        <View style={styles.outcomeList}>
          {DEFAULT_CALL_OUTCOMES.map((outcome) => {
            const count = activeMetrics.outcomeDistribution[outcome.id] || 0;
            const pct =
              totalCallsCount > 0 ? Math.round((count / totalCallsCount) * 100) : 0;

            return (
              <View key={outcome.id} style={styles.outcomeRow}>
                <View style={styles.outcomeLeft}>
                  <View style={[styles.outcomeDot, { backgroundColor: outcome.color }]} />
                  <Text style={styles.outcomeLabel}>{outcome.label}</Text>
                </View>
                <View style={styles.outcomeRight}>
                  <Text style={styles.outcomeCount}>{count}</Text>
                  <Text style={styles.outcomePercent}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Day-by-Day Activity link inside month tab */}
        {selectedTab === 'month' && (
          <>
            <View style={styles.cardDivider} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDailyBreakdown(true)}
              style={styles.dayBreakdownLink}>
              <Text style={styles.dayBreakdownLinkText}>
                View daily activity for {monthData.monthLabel} →
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111215',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EDEDED',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#8B8F9A',
    marginTop: 3,
  },

  /* Segmented Period Tabs */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#18191E',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#24262E',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: '#272A33',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B8F9A',
  },
  tabTextActive: {
    color: '#EDEDED',
    fontWeight: '600',
  },

  /* Month Selector */
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18191E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24262E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  monthNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  monthNavArrow: {
    fontSize: 20,
    color: '#EDEDED',
    fontWeight: '600',
  },
  monthNavDisabled: {
    opacity: 0.3,
  },
  monthNavArrowDisabled: {
    color: '#555860',
  },
  monthNavLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EDEDED',
  },

  /* Cards */
  card: {
    backgroundColor: '#18191E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24262E',
    padding: 16,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  heroStat: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#262830',
    marginHorizontal: 16,
  },
  heroLabel: {
    fontSize: 12,
    color: '#8B8F9A',
    marginBottom: 4,
    fontWeight: '500',
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#EDEDED',
  },
  heroValueAccent: {
    fontSize: 26,
    fontWeight: '700',
    color: '#34D399',
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#24262E',
    marginVertical: 14,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
  },
  statLabel: {
    fontSize: 11,
    color: '#8B8F9A',
    marginBottom: 3,
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EDEDED',
  },
  statNumberMuted: {
    fontSize: 15,
    fontWeight: '600',
    color: '#717682',
  },

  /* Outcome section */
  outcomeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EDEDED',
  },
  sectionHeaderMeta: {
    fontSize: 12,
    color: '#8B8F9A',
  },

  /* Stacked Ratio Bar */
  stackedBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#24262E',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  stackedSegment: {
    height: '100%',
  },
  emptyBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#24262E',
    marginBottom: 16,
  },

  outcomeList: {
    gap: 10,
  },
  outcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  outcomeLabel: {
    fontSize: 13,
    color: '#D4D6DC',
  },
  outcomeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outcomeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EDEDED',
  },
  outcomePercent: {
    fontSize: 12,
    color: '#8B8F9A',
    width: 32,
    textAlign: 'right',
  },

  dayBreakdownLink: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  dayBreakdownLinkText: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '500',
  },

  /* Subpage styling */
  subpageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#18191E',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#24262E',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EDEDED',
  },
  subpageMonthTag: {
    fontSize: 12,
    color: '#8B8F9A',
    fontWeight: '500',
  },
  breakdownList: {
    marginTop: 14,
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18191E',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24262E',
  },
  dayRowToday: {
    borderColor: '#38BDF8',
  },
  dayRowEmpty: {
    opacity: 0.5,
  },
  dayDateCol: {
    flex: 1,
  },
  dayDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EDEDED',
  },
  dayDateToday: {
    color: '#38BDF8',
  },
  dayDateTextMuted: {
    color: '#717682',
    fontWeight: '400',
  },
  dayMetricsCol: {
    alignItems: 'flex-end',
  },
  dayCallsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D4D6DC',
  },
  dayCallsTextMuted: {
    color: '#717682',
  },
  dayTalkTimeText: {
    fontSize: 11,
    color: '#8B8F9A',
    marginTop: 2,
  },
  returnButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#18191E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24262E',
    alignItems: 'center',
  },
  returnButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EDEDED',
  },
});
