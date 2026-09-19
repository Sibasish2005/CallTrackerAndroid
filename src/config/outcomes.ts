import { CallOutcomeConfig } from '../types';

export const DEFAULT_CALL_OUTCOMES: CallOutcomeConfig[] = [
  {
    id: 'contacted',
    label: 'Contacted',
    category: 'POSITIVE',
    color: '#0284C7',
  },
  {
    id: 'interested',
    label: 'Interested',
    category: 'POSITIVE',
    color: '#10B981',
  },
  {
    id: 'follow_up',
    label: 'Follow-up needed',
    category: 'NEUTRAL',
    color: '#3B82F6',
  },
  {
    id: 'call_back',
    label: 'Call back later',
    category: 'NEUTRAL',
    color: '#06B6D4',
  },
  {
    id: 'converted',
    label: 'Converted',
    category: 'POSITIVE',
    color: '#059669',
  },
  {
    id: 'not_interested',
    label: 'Not interested',
    category: 'NEGATIVE',
    color: '#EF4444',
  },
  {
    id: 'no_answer',
    label: 'No answer',
    category: 'UNCONNECTED',
    color: '#F59E0B',
  },
  {
    id: 'busy',
    label: 'Busy',
    category: 'UNCONNECTED',
    color: '#EA580C',
  },
  {
    id: 'wrong_number',
    label: 'Wrong number',
    category: 'UNCONNECTED',
    color: '#64748B',
  },
  {
    id: 'not_qualified',
    label: 'Not qualified',
    category: 'NEGATIVE',
    color: '#F97316',
  },
  {
    id: 'other',
    label: 'Other',
    category: 'NEUTRAL',
    color: '#8B5CF6',
  },
];

export function getOutcomesForCall(connected: boolean): CallOutcomeConfig[] {
  if (connected) {
    return DEFAULT_CALL_OUTCOMES.filter(o => o.category !== 'UNCONNECTED');
  }
  // For unconnected calls, strictly allow only unconnected outcomes (no answer, busy, wrong number)
  return DEFAULT_CALL_OUTCOMES.filter(o => o.category === 'UNCONNECTED');
}

export function getOutcomeById(id?: string): CallOutcomeConfig | undefined {
  if (!id) return undefined;
  const key = id.toLowerCase().replace(/-/g, '_');
  return DEFAULT_CALL_OUTCOMES.find(o => o.id === key);
}
