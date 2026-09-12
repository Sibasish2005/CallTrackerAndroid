# HEEYAKU Call Tracker — Future Features Roadmap

> **Status**: Planning only. No code changes until explicitly approved.
> **Last Updated**: September 12, 2026

---

## 1. Lead Management System

### Overview
Replace the current free-dial **Calls Screen** with a server-driven **Leads Screen**.
Employees will no longer browse raw device call history — instead they will see
a curated list of leads assigned to them by an admin through a web panel.

### Source
- **Backend**: Next.js + Vercel (serverless API routes)
- **Database**: PostgreSQL (hosted on Vercel Postgres or external provider)
- **Admin Panel**: Web-based dashboard for managers to assign, re-assign, and unlock leads

### How It Works

```
┌──────────────────────────────────┐
│       Admin Web Panel            │
│  (Next.js + Vercel + PostgreSQL) │
│                                  │
│  • Import lead CSV / manual add  │
│  • Assign leads to employees     │
│  • View employee progress        │
│  • Re-assign / unlock leads      │
└──────────────┬───────────────────┘
               │  REST API
               ▼
┌──────────────────────────────────┐
│     HEEYAKU Mobile App           │
│  (React Native + Kotlin)         │
│                                  │
│  • Fetch assigned leads on login │
│  • Display lead info (not raw #) │
│  • Track calls per lead          │
│  • Auto-lock after 2 calls       │
│  • Sync outcomes back to server  │
└──────────────────────────────────┘
```

### Lead Rules
| Rule | Description |
|---|---|
| **Max 2 Calls** | Each lead allows a maximum of 2 call attempts |
| **Auto-Lock** | After 2 calls, the lead is disabled/greyed out |
| **Admin Unlock** | Only the web admin can re-assign the same lead |
| **Re-assigned Lead** | When re-assigned, call count resets and lead becomes active again |
| **No Free Dial** | Employees call from lead list only (no manual number entry) |

### Lead Data Model (from server)
```typescript
interface Lead {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  company?: string;
  designation?: string;
  notes?: string;
  source?: string;           // e.g. "Website", "Referral", "Campaign"
  maxCalls: number;           // default: 2
  currentCallCount: number;   // 0, 1, or 2
  isLocked: boolean;          // true when currentCallCount >= maxCalls
  assignedAt: string;         // ISO timestamp
  lastCalledAt?: string;      // ISO timestamp
  outcome?: string;           // latest call outcome
  status: 'pending' | 'contacted' | 'converted' | 'locked' | 'expired';
}
```

### UI Changes

| Current (v1) | Future (v2) |
|---|---|
| **Calls Tab** → free-dial any number | **Leads Tab** → server-assigned leads only |
| **Call List** → device CallLog history | **Lead List** → leads fetched from API |
| **Quick Dialer** → manual number input | **Lead Card** → tap to call with lead context |
| **Search** → search call history | **Search** → search assigned leads |
| **Filters** → Connected / Not Connected | **Filters** → Pending / Contacted / Converted / Locked |

### What the Employee Sees (Lead Card)
```
┌─────────────────────────────────────┐
│  Rajesh Kumar              Pending  │
│  Tech Solutions Pvt Ltd             │
│  +91 98765 43210                    │
│                                     │
│  Source: Website                    │
│  Calls: 0/2 remaining              │
│                                     │
│  [  📞  Call Now  ]                 │
└─────────────────────────────────────┘
```

After 2 calls:
```
┌─────────────────────────────────────┐
│  Rajesh Kumar              Locked   │
│  Tech Solutions Pvt Ltd             │
│  +91 98765 43210                    │
│                                     │
│  Source: Website                    │
│  Calls: 2/2 — Limit reached        │
│  Last Result: Follow-up needed      │
│                                     │
│  [ Waiting for admin re-assignment ]│
└─────────────────────────────────────┘
```

---

## 2. Lead KPI Management

### Overview
Introduce lead-specific KPIs that replace generic call volume metrics on the dashboard
and analytics screens. Employees see how they perform against their assigned leads,
not just raw call counts.

### New KPI Metrics

| KPI | Description | Formula |
|---|---|---|
| **Leads Assigned** | Total leads pushed by admin | Count of all leads for employee |
| **Leads Contacted** | Leads with ≥1 call attempt | Count where `currentCallCount > 0` |
| **Leads Converted** | Leads marked "Converted" | Count where `outcome = 'Converted'` |
| **Conversion Rate** | Success percentage | `(converted / assigned) × 100` |
| **Pending Leads** | Leads not yet called | Count where `currentCallCount = 0` |
| **Locked Leads** | Hit 2-call limit, awaiting admin | Count where `isLocked = true` |
| **Avg Calls Per Lead** | Efficiency metric | `totalCalls / totalLeadsContacted` |
| **Contact Rate** | Reach percentage | `(contacted / assigned) × 100` |

### Dashboard Changes (Future)

**Current Dashboard KPIs** (call-based):
- Calls Connected
- Total Talk Time
- Connection Rate
- Average Duration
- Total Attempts

**Future Dashboard KPIs** (lead-based):
- Leads Assigned Today
- Leads Contacted Today
- Leads Converted Today
- Conversion Rate
- Pending Leads Remaining
- Talk Time (retained)

### Analytics Changes (Future)
The 3-section analytics structure remains but metrics shift:

1. **Daily Performance** → Today's lead activity
2. **Monthly Performance** → Month-to-date lead conversion trends
3. **Lifetime Performance** → Career lead conversion stats

---

## 3. API Endpoints (Planned)

### Mobile App → Server

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/leads?employeeId={id}` | Fetch assigned leads |
| `POST` | `/api/leads/{leadId}/call` | Record a call attempt |
| `PATCH` | `/api/leads/{leadId}/outcome` | Save call outcome |
| `GET` | `/api/leads/stats?employeeId={id}` | Fetch lead KPIs |

### Admin Panel → Server

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/admin/leads/import` | Bulk import leads (CSV) |
| `POST` | `/api/admin/leads/assign` | Assign leads to employee |
| `PATCH` | `/api/admin/leads/{leadId}/unlock` | Re-assign / unlock a lead |
| `GET` | `/api/admin/employees/{id}/progress` | View employee performance |

---

## 4. Implementation Approach (When Ready)

### Phase 1: Backend (Next.js + Vercel)
- [ ] Set up Next.js project with Vercel deployment
- [ ] Design PostgreSQL schema (leads, employees, call_logs, assignments)
- [ ] Build API routes for lead CRUD and assignment
- [ ] Build admin web panel (import, assign, monitor)

### Phase 2: Mobile Integration
- [ ] Create `src/hooks/useLeads.ts` — fetch/poll leads from API
- [ ] Create `src/services/leadService.ts` — API client
- [ ] Update `src/types/index.ts` — add Lead interfaces
- [ ] Replace `CallsScreen` → `LeadsScreen`
- [ ] Wire call outcomes to server via API (not just local storage)

### Phase 3: KPI Migration
- [ ] Update `useCallMetrics.ts` → `useLeadMetrics.ts`
- [ ] Update `DashboardScreen.tsx` — lead-based hero cards
- [ ] Update `AnalyticsScreen.tsx` — lead conversion analytics
- [ ] Retain backward compatibility for call-only mode (fallback)

### Phase 4: Testing & Rollout
- [ ] End-to-end testing: admin assigns → employee calls → outcome syncs
- [ ] Offline handling: queue API calls when no connectivity
- [ ] APK release with lead system enabled

---

## 5. Database Schema (Draft)

```sql
-- Employees table
CREATE TABLE employees (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT,
  team        TEXT,
  role        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  company             TEXT,
  designation         TEXT,
  source              TEXT,
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Lead assignments (junction table)
CREATE TABLE lead_assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID REFERENCES leads(id),
  employee_id         TEXT REFERENCES employees(id),
  max_calls           INT DEFAULT 2,
  current_call_count  INT DEFAULT 0,
  is_locked           BOOLEAN DEFAULT FALSE,
  status              TEXT DEFAULT 'pending',
  outcome             TEXT,
  assigned_at         TIMESTAMP DEFAULT NOW(),
  last_called_at      TIMESTAMP,
  UNIQUE(lead_id, employee_id, assigned_at)
);

-- Call records (synced from mobile)
CREATE TABLE call_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID REFERENCES lead_assignments(id),
  employee_id         TEXT REFERENCES employees(id),
  duration_seconds    INT,
  connected           BOOLEAN,
  outcome             TEXT,
  notes               TEXT,
  called_at           TIMESTAMP DEFAULT NOW()
);
```

---

> **Note**: This document is a living roadmap. Implementation begins only when explicitly approved.
> The current app continues to work in standalone call-tracking mode until the backend is ready.
