import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CallRecord, EmployeeMetrics } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { DEFAULT_CALL_OUTCOMES } from '../config/outcomes';
import { formatVerboseDuration } from '../utils/formatters';
import { getMonthRange } from '../utils/dateRange';
import { calculateMetrics } from '../hooks/useCallMetrics';

interface AnalyticsScreenProps {
  todayMetrics: EmployeeMetrics;
  todayCalls: CallRecord[];
  lifetimeMetrics: EmployeeMetrics;
  appCalls?: CallRecord[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  todayMetrics,
  todayCalls,
  lifetimeMetrics,
  appCalls = [],
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(currentDate.getMonth());
  const [showDailyBreakdown, setShowDailyBreakdown] = useState<boolean>(false);

  // Handle hardware back button on Android
  useEffect(() => {
    if (!showDailyBreakdown) return;
    const backAction = () => {
      setShowDailyBreakdown(false);
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => subscription.remove();
  }, [showDailyBreakdown]);

  // Monthly Date Range & Valid Days (No future days)
  const monthData = getMonthRange(selectedYear, selectedMonthIndex);

  // Filter calls for the selected month (strictly HEEYAKU app calls)
  const monthCalls = appCalls.filter(call => {
    const timestamp = Number(call.startedAt || call.date || 0);
    return timestamp >= monthData.range.startMs && timestamp <= monthData.range.endMs;
  });

  const monthMetrics = calculateMetrics(monthCalls);

  // Group month calls by day
  const callsByDay = new Map<number, CallRecord[]>();
  for (const call of monthCalls) {
    const callDate = new Date(Number(call.startedAt || call.date || 0));
    const day = callDate.getDate();
    if (!callsByDay.has(day)) {
      callsByDay.set(day, []);
    }
    callsByDay.get(day)!.push(call);
  }

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedMonthIndex(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonthIndex(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentOrFuture =
      selectedYear > currentDate.getFullYear() ||
      (selectedYear === currentDate.getFullYear() && selectedMonthIndex >= currentDate.getMonth());

    if (isCurrentOrFuture) return; // Prevent selecting future months

    if (selectedMonthIndex === 11) {
      setSelectedMonthIndex(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonthIndex(m => m + 1);
    }
  };

  const isNextDisabled =
    selectedYear === currentDate.getFullYear() &&
    selectedMonthIndex >= currentDate.getMonth();

  if (showDailyBreakdown) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Navigation & Return Header */}
        <View style={styles.subpageHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => setShowDailyBreakdown(false)}
            style={styles.backButton}>
            <Text style={styles.backButtonArrow}>←</Text>
            <Text style={styles.backButtonText}>Back to Analytics</Text>
          </TouchableOpacity>
          <Badge label={monthData.monthLabel} variant="outline" size="sm" />
        </View>

        {/* Subpage Title Block */}
        <View style={styles.subpageTitleBlock}>
          <Text style={styles.title}>Day-by-Day Breakdown</Text>
          <Text style={styles.subtitle}>
            Daily calling activity & metrics for {monthData.monthLabel}
          </Text>
        </View>

        {/* Month Summary Bar */}
        <Card variant="default" style={styles.monthSummaryMiniCard}>
          <View style={styles.monthSummaryRow}>
            <View style={styles.monthSummaryItem}>
              <Text style={styles.monthSummaryLabel}>Total Calls</Text>
              <Text style={styles.monthSummaryValue}>{monthMetrics.totalAttempts}</Text>
            </View>
            <View style={styles.monthSummaryItem}>
              <Text style={styles.monthSummaryLabel}>Connected</Text>
              <Text style={styles.monthSummaryValue}>{monthMetrics.totalConnected}</Text>
            </View>
            <View style={styles.monthSummaryItem}>
              <Text style={styles.monthSummaryLabel}>Not Connected</Text>
              <Text style={styles.monthSummaryValueMuted}>{monthMetrics.totalUnconnected}</Text>
            </View>
            <View style={styles.monthSummaryItem}>
              <Text style={styles.monthSummaryLabel}>Talk Time</Text>
              <Text style={styles.monthSummaryValue}>
                {formatVerboseDuration(monthMetrics.totalDurationSeconds)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Day-by-Day List */}
        <Text style={styles.subSectionTitle}>DAILY ACTIVITY BREAKDOWN</Text>
        <View style={styles.daysList}>
          {monthData.days.slice().reverse().map(bucket => {
            const dayCalls = callsByDay.get(bucket.dayNumber) || [];
            const dayMetrics = calculateMetrics(dayCalls);
            const hasCalls = dayCalls.length > 0;
            return (
              <View
                key={bucket.dayNumber}
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
                    {bucket.dateString} {bucket.isToday ? '(Today)' : ''}
                  </Text>
                </View>

                <View style={styles.dayMetricsCol}>
                  <Text
                    style={[
                      styles.dayCallsText,
                      !hasCalls && styles.dayCallsTextMuted,
                    ]}>
                    {dayCalls.length} {dayCalls.length === 1 ? 'call' : 'calls'} •{' '}
                    {dayMetrics.totalConnected} connected
                  </Text>
                  <Text style={styles.dayTalkTimeText}>
                    {formatVerboseDuration(dayMetrics.totalDurationSeconds)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Return Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowDailyBreakdown(false)}
          style={styles.bottomReturnButton}>
          <Text style={styles.bottomReturnButtonText}>← Return to Overview</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Performance Analytics</Text>
          <Text style={styles.subtitle}>
            Daily, monthly and career calling reports
          </Text>
        </View>
        <Badge label="Realtime" variant="outline" size="sm" />
      </View>

      {/* ========================================================================= */}
      {/* SECTION 1: DAILY PERFORMANCE (TODAY)                                     */}
      {/* ========================================================================= */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>1. DAILY PERFORMANCE (TODAY)</Text>
        <Badge label={`${todayCalls.length} calls`} variant="subtle" size="sm" />
      </View>

      <Card variant="default" style={styles.card}>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Calls Made</Text>
            <Text style={styles.statValue}>{todayMetrics.totalAttempts}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Connected</Text>
            <Text style={styles.statValue}>{todayMetrics.totalConnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Not Connected</Text>
            <Text style={styles.statValueMuted}>{todayMetrics.totalUnconnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Connection Rate</Text>
            <Text style={styles.statValueAccent}>{todayMetrics.connectionRatePercent}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.durationRow}>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Total Talk Time</Text>
            <Text style={styles.durationValue}>
              {formatVerboseDuration(todayMetrics.totalDurationSeconds)}
            </Text>
          </View>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Average Duration</Text>
            <Text style={styles.durationValue}>
              {formatVerboseDuration(todayMetrics.averageDurationSeconds)}
            </Text>
          </View>
        </View>

        {/* Today's Call Results Distribution */}
        <Text style={styles.subSectionTitle}>TODAY'S CALL RESULTS</Text>
        {DEFAULT_CALL_OUTCOMES.map(outcome => {
          const count = todayMetrics.outcomeDistribution[outcome.id] || 0;
          const pct = todayMetrics.totalAttempts > 0
            ? Math.round((count / todayMetrics.totalAttempts) * 100)
            : 0;
          return (
            <View key={outcome.id} style={styles.outcomeRow}>
              <View style={styles.outcomeHeader}>
                <View style={styles.outcomeNameRow}>
                  <View style={[styles.outcomeDot, { backgroundColor: outcome.color }]} />
                  <Text style={styles.outcomeLabel}>{outcome.label}</Text>
                </View>
                <Text style={styles.outcomeCount}>{count} ({pct}%)</Text>
              </View>
              <ProgressBar progress={pct} color={outcome.color} height={4} />
            </View>
          );
        })}
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2: MONTHLY PERFORMANCE                                           */}
      {/* ========================================================================= */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>2. MONTHLY PERFORMANCE</Text>
      </View>

      {/* Month Selector Bar */}
      <View style={styles.monthSelectorRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePrevMonth}
          style={styles.monthArrowButton}>
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthSelectorLabel}>{monthData.monthLabel}</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleNextMonth}
          disabled={isNextDisabled}
          style={[styles.monthArrowButton, isNextDisabled && styles.monthArrowDisabled]}>
          <Text style={[styles.monthArrowText, isNextDisabled && styles.monthArrowTextDisabled]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      <Card variant="default" style={styles.card}>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Calls Made</Text>
            <Text style={styles.statValue}>{monthMetrics.totalAttempts}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Connected</Text>
            <Text style={styles.statValue}>{monthMetrics.totalConnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Not Connected</Text>
            <Text style={styles.statValueMuted}>{monthMetrics.totalUnconnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Connection Rate</Text>
            <Text style={styles.statValueAccent}>{monthMetrics.connectionRatePercent}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.durationRow}>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Total Talk Time</Text>
            <Text style={styles.durationValue}>
              {formatVerboseDuration(monthMetrics.totalDurationSeconds)}
            </Text>
          </View>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Average Duration</Text>
            <Text style={styles.durationValue}>
              {formatVerboseDuration(monthMetrics.averageDurationSeconds)}
            </Text>
          </View>
        </View>

        {/* Month's Call Results Distribution */}
        <Text style={styles.subSectionTitle}>MONTH'S CALL RESULTS</Text>
        {DEFAULT_CALL_OUTCOMES.map(outcome => {
          const count = monthMetrics.outcomeDistribution[outcome.id] || 0;
          const pct = monthMetrics.totalAttempts > 0
            ? Math.round((count / monthMetrics.totalAttempts) * 100)
            : 0;
          return (
            <View key={outcome.id} style={styles.outcomeRow}>
              <View style={styles.outcomeHeader}>
                <View style={styles.outcomeNameRow}>
                  <View style={[styles.outcomeDot, { backgroundColor: outcome.color }]} />
                  <Text style={styles.outcomeLabel}>{outcome.label}</Text>
                </View>
                <Text style={styles.outcomeCount}>{count} ({pct}%)</Text>
              </View>
              <ProgressBar progress={pct} color={outcome.color} height={4} />
            </View>
          );
        })}

        <View style={styles.divider} />

        {/* Button to open dedicated Day-by-Day Performance page for this month */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowDailyBreakdown(true)}
          style={styles.viewBreakdownBanner}>
          <View style={styles.viewBreakdownLeft}>
            <View style={styles.calendarIconBox}>
              <Text style={styles.calendarIconText}>📅</Text>
            </View>
            <View style={styles.viewBreakdownTextGroup}>
              <Text style={styles.viewBreakdownTitle}>Day-by-Day Performance</Text>
              <Text style={styles.viewBreakdownSubtitle}>
                View detailed daily breakdown for {monthData.monthLabel}
              </Text>
            </View>
          </View>
          <View style={styles.viewBreakdownRight}>
            <Text style={styles.viewBreakdownArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 3: LIFETIME PERFORMANCE (HEEYAKU APP CALLS ONLY)                 */}
      {/* ========================================================================= */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>3. LIFETIME PERFORMANCE</Text>
        <Badge label="App Calls Only" variant="outline" size="sm" />
      </View>

      <Card variant="default" style={styles.card}>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Calls</Text>
            <Text style={styles.statValue}>{lifetimeMetrics.totalAttempts}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Connected</Text>
            <Text style={styles.statValue}>{lifetimeMetrics.totalConnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Not Connected</Text>
            <Text style={styles.statValueMuted}>{lifetimeMetrics.totalUnconnected}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Overall Rate</Text>
            <Text style={styles.statValueAccent}>{lifetimeMetrics.connectionRatePercent}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.durationRow}>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Total Talk Time</Text>
            <Text style={styles.durationValue}>
              {formatVerboseDuration(lifetimeMetrics.totalDurationSeconds)}
            </Text>
          </View>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>Average Duration</Text>
            <Text style={styles.durationValue}>
              {formatVerboseDuration(lifetimeMetrics.averageDurationSeconds)}
            </Text>
          </View>
        </View>

        {/* Lifetime Results Distribution */}
        <Text style={styles.subSectionTitle}>ALL-TIME CALL RESULTS</Text>
        {DEFAULT_CALL_OUTCOMES.map(outcome => {
          const count = lifetimeMetrics.outcomeDistribution[outcome.id] || 0;
          const pct = lifetimeMetrics.totalAttempts > 0
            ? Math.round((count / lifetimeMetrics.totalAttempts) * 100)
            : 0;
          return (
            <View key={outcome.id} style={styles.outcomeRow}>
              <View style={styles.outcomeHeader}>
                <View style={styles.outcomeNameRow}>
                  <View style={[styles.outcomeDot, { backgroundColor: outcome.color }]} />
                  <Text style={styles.outcomeLabel}>{outcome.label}</Text>
                </View>
                <Text style={styles.outcomeCount}>{count} ({pct}%)</Text>
              </View>
              <ProgressBar progress={pct} color={outcome.color} height={4} />
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121316',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#8D919C',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8D919C',
    letterSpacing: 0.8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8D919C',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1C1D22',
    borderColor: '#272932',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#20222A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2B2D38',
  },
  statLabel: {
    fontSize: 11,
    color: '#8D919C',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statValueMuted: {
    fontSize: 20,
    fontWeight: '800',
    color: '#64748B',
  },
  statValueAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
  },
  divider: {
    height: 1,
    backgroundColor: '#262832',
    marginVertical: 14,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationBox: {
    flex: 1,
    backgroundColor: '#20222A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2B2D38',
  },
  durationLabel: {
    fontSize: 11,
    color: '#8D919C',
    fontWeight: '600',
    marginBottom: 4,
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  outcomeRow: {
    marginBottom: 12,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  outcomeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  outcomeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outcomeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8D919C',
  },
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1D22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#272932',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  monthArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262832',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: {
    opacity: 0.3,
  },
  monthArrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  monthArrowTextDisabled: {
    color: '#64748B',
  },
  monthSelectorLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  daysList: {
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#20222A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2C37',
  },
  dayDateCol: {
    flex: 1,
  },
  dayDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C2C5CE',
  },
  dayDateToday: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  dayMetricsCol: {
    alignItems: 'flex-end',
  },
  dayCallsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayTalkTimeText: {
    fontSize: 11,
    color: '#8D919C',
    marginTop: 2,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  subpageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#20222A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2B2D38',
  },
  backButtonArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subpageTitleBlock: {
    marginBottom: 16,
  },
  monthSummaryMiniCard: {
    backgroundColor: '#1C1D22',
    borderColor: '#272932',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  monthSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSummaryItem: {
    alignItems: 'center',
  },
  monthSummaryLabel: {
    fontSize: 10,
    color: '#8D919C',
    fontWeight: '600',
    marginBottom: 4,
  },
  monthSummaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthSummaryValueMuted: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  bottomReturnButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: '#20222A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2D38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomReturnButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewBreakdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#20222A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B2D38',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  viewBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#262832',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconText: {
    fontSize: 16,
  },
  viewBreakdownTextGroup: {
    flex: 1,
  },
  viewBreakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewBreakdownSubtitle: {
    fontSize: 11,
    color: '#8D919C',
    marginTop: 2,
  },
  viewBreakdownRight: {
    paddingLeft: 8,
  },
  viewBreakdownArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38BDF8',
  },
  dayRowToday: {
    borderColor: '#38BDF8',
  },
  dayRowEmpty: {
    opacity: 0.7,
  },
  dayDateTextMuted: {
    color: '#64748B',
  },
  dayCallsTextMuted: {
    color: '#64748B',
  },
});
