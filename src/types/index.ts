export type CallState = 'IDLE' | 'RINGING' | 'OFFHOOK' | 'UNKNOWN';

export type CallType = 'OUTGOING' | 'INCOMING' | 'MISSED' | 'REJECTED';

export type OutcomeCategory = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNCONNECTED';

export interface CallOutcomeConfig {
  id: string;
  label: string;
  category: OutcomeCategory;
  color: string;
  requiresNotes?: boolean;
}

export interface CallRecord {
  id: string;
  employeeId?: string;
  leadId?: string;
  phoneNumber: string;
  contactName?: string;
  callType: CallType;
  startedAt: number;         // Epoch timestamp when call initiated
  connectedAt?: number;      // Epoch timestamp when OFFHOOK fired (if connected)
  endedAt: number;           // Epoch timestamp when IDLE fired
  durationSeconds: number;   // Monotonic measured seconds (IDLE - OFFHOOK)
  connected: boolean;        // True strictly if OFFHOOK was reached
  outcomeId?: string;        // ID from CallOutcomeConfig
  outcomeLabel?: string;     // Cached human-readable label
  notes?: string;            // Employee disposition notes
  createdAt: number;
  synced?: boolean;
  isAppInitiated?: boolean; // True strictly if call was dialed from HEEYAKU app

  // Compatibility aliases for CallLog items
  number?: string;
  name?: string;
  duration?: number;
  date?: number;
  type?: number | CallType;
}

export interface EmployeeMetrics {
  totalAttempts: number;
  totalConnected: number;
  totalUnconnected: number;
  connectionRatePercent: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  outcomeDistribution: Record<string, number>;
}

export type FilterTab = 'ALL' | 'CONNECTED' | 'NOT_CONNECTED' | 'OUTGOING' | 'INCOMING' | 'MISSED';

export type TabRoute = 'dashboard' | 'leads' | 'calls' | 'analytics' | 'profile';

export type CallTrackerEvents = {
  CallStateChanged: [string];
  CallEnded: [{
    id?: string;
    duration: number;
    connected?: boolean;
    number?: string;
    name?: string;
    date?: number;
    isAppInitiated?: boolean;
  }];
};
