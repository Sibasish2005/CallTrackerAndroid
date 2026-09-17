# HEEYAKU Call Tracker — Current Capabilities

## What the app does today

HEEYAKU Call Tracker is a standalone Android app for sales employees to make calls, record the result of those calls, and review personal call performance.

### 1. Make and track outgoing calls

- Enter a phone number in the app and start a call directly from HEEYAKU.
- See live call status, including ringing/connected state and an in-call duration timer.
- A call is treated as connected only after it reaches the phone's connected (`OFFHOOK`) state.
- Calls started through HEEYAKU are saved as the employee's app-call history.

### 2. Call history

- View HEEYAKU-initiated calls with the number/contact name, date, duration, connection status, and saved outcome.
- Search saved HEEYAKU calls.
- Filter calls by connected, not connected, outgoing, incoming, or missed status.
- Refresh the device call-log data; the native implementation can read up to 200 recent device records when permission is granted.

### 3. Record call outcomes

After a call, the employee can select an outcome and optionally add notes. Available outcomes include:

- Interested / Converted
- Follow-up needed / Call back later
- Not interested / Not qualified
- No answer / Busy / Wrong number
- Other

Outcomes and notes are stored locally on the device with the saved HEEYAKU call record.

### 4. Dashboard and analytics

The app provides call-based performance information for calls made through HEEYAKU:

- Today's attempts, connected calls, connection rate, talk time, and average duration.
- Recent calls and quick dialing from the dashboard.
- Monthly performance, including a day-by-day breakdown.
- Lifetime totals, connection rate, talk time, average duration, and outcome distribution.

### 5. Profile and app status

- Shows an employee profile, employee ID, and team (currently fixed sample values in the app).
- Indicates whether call-tracking permission and the phone-state listener are active.
- Lets the user request required phone permissions.

## Permissions used

For its current features, the Android app requests:

- Permission to place phone calls.
- Permission to read phone state, so it can detect call status and duration.
- Permission to read the device call log.

## Important current limitations

- This is currently an Android-only React Native implementation.
- Data is stored locally on the device; there is no login, server sync, admin panel, team reporting, or cloud backup yet.
- The employee profile information is currently hard-coded sample data.
- Current analytics are based on calls initiated through HEEYAKU, rather than all device calls.
- Lead assignment, lead locking, conversion KPIs, and backend/API integration are planned future work, not current features. See [future_feature.md](future_feature.md).

## In one sentence

Today, HEEYAKU is a personal sales-call tracker: dial from the app, track the call, mark its outcome, and monitor your call activity over time.
