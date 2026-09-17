/**
 * HEEYAKU Mobile API Configuration.
 * Production Domain: https://heeyaku.vercel.app
 */
export const API_BASE_URL = 'https://heeyaku.vercel.app';

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/employee/auth/login`,
  me: `${API_BASE_URL}/api/employee/auth/me`,
  leads: `${API_BASE_URL}/api/employee/leads`,
  leadDisposition: (leadId: string) => `${API_BASE_URL}/api/employee/leads/${leadId}/disposition`,
  syncCalls: `${API_BASE_URL}/api/employee/calls/sync`,
};

