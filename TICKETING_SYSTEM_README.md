# YATRA 2026 — Cultural Ticketing System

> Production-level ticketing system for college cultural fest with QR-based entry, 4 ticket categories, multi-day usage tracking, gate enforcement, time restrictions, and anti-abuse protection.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Folder Structure](#folder-structure)
3. [Ticket Categories](#ticket-categories)
4. [Database Schema](#database-schema)
5. [QR Token Generation & Verification](#qr-token-generation--verification)
6. [Email Sender (issue_tickets_batch)](#email-sender-issue_tickets_batch)
7. [Scanner Endpoint (validate_scan)](#scanner-endpoint-validate_scan)
8. [Validation Flow — Step by Step](#validation-flow--step-by-step)
9. [Gate Validation Logic](#gate-validation-logic)
10. [Time Restrictions](#time-restrictions)
11. [Day Reset & Usage Tracking](#day-reset--usage-tracking)
12. [Admin Functions](#admin-functions)
13. [API Endpoints](#api-endpoints)
14. [Error Codes & Meanings](#error-codes--meanings)
15. [Scanner ↔ Mail System Data Contract](#scanner--mail-system-data-contract)
16. [Environment Variables](#environment-variables)
17. [Deployment Instructions](#deployment-instructions)
18. [Running Locally](#running-locally)
19. [Security Notes](#security-notes)
20. [Known Limitations & Missing Pieces](#known-limitations--missing-pieces)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        YATRA 2026 SYSTEM                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐   │
│  │  Admin Panel │───▶│ issue_tickets_   │───▶│  Gmail SMTP        │   │
│  │  (Browser)   │    │ batch (Edge Fn)  │    │  (sends email      │   │
│  └─────────────┘    └───────┬──────────┘    │   with QR code)    │   │
│                             │               └────────────────────┘   │
│                             ▼                                        │
│                    ┌────────────────┐                                 │
│                    │   Supabase     │                                 │
│                    │   PostgreSQL   │                                 │
│                    │                │                                 │
│                    │  ┌──────────┐  │                                 │
│                    │  │ tickets  │  │                                 │
│                    │  ├──────────┤  │                                 │
│                    │  │scan_logs │  │                                 │
│                    │  ├──────────┤  │                                 │
│                    │  │registra- │  │                                 │
│                    │  │ tions    │  │                                 │
│                    │  └──────────┘  │                                 │
│                    │                │                                 │
│                    │ validate_scan  │◀──── RPC call                   │
│                    │ (DB Function)  │                                 │
│                    └───────▲────────┘                                 │
│                            │                                         │
│  ┌─────────────┐    ┌──────┴───────────┐                             │
│  │  Scanner App │───▶│ validate_scan   │                             │
│  │  (Mobile/Web)│    │ (Edge Function) │                             │
│  └─────────────┘    └─────────────────┘                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Admin triggers `issue_tickets_batch` → generates signed QR token → stores in DB → emails QR to attendee
2. Attendee shows QR at gate → Scanner reads QR → sends token to `validate_scan` edge function
3. Edge function calls `validate_scan` RPC → 7-step validation → returns ALLOW/REJECT
4. Scanner displays result to gate volunteer

---

## Folder Structure

```
YATRA 2026/
├── supabase/
│   └── functions/
│       ├── issue_tickets_batch/    # Email sender — generates tickets + QR + sends email
│       │   ├── index.ts
│       │   └── deno.json
│       ├── validate_scan/          # Scanner endpoint (deployed to Supabase, not local)
│       │   ├── index.ts
│       │   └── deno.json
│       ├── check_in/               # Legacy check-in for registrations
│       │   ├── index.ts
│       │   └── deno.json
│       ├── ccavenue_create_order/   # Payment gateway init
│       ├── ccavenue_callback/       # Payment callback handler
│       ├── import_paid_sheet/       # Bulk import paid registrations
│       └── send-registration-email/ # Registration confirmation email
├── src/                            # Frontend (React)
├── homepage.html                   # Landing page
└── TICKETING_SYSTEM_README.md      # ← This file
```

---

## Ticket Categories

| Cat | Name                          | Gate         | Time Restriction | Days    | Usage Tracking       |
|-----|-------------------------------|--------------|------------------|---------|----------------------|
| 1   | Institution Student Pass      | CONFERENCE   | None             | 1 or 2  | `usage_day1/day2`    |
| 2   | Event-Specific Ticket         | EVENT_{id}   | None             | 1       | `usage_event`        |
| 3   | General Audience (Single Day) | CONFERENCE   | After 3:00 PM    | 1       | `usage_day1`         |
| 4   | General Audience Combo        | CONFERENCE   | After 3:00 PM    | 2       | `usage_day1/day2`    |

### Category Rules Summary

- **Cat 1 & 2**: No time restriction — entry allowed any time during valid day(s)
- **Cat 3 & 4**: Entry **only after 3:00 PM IST** — rejected before 15:00
- **Cat 2**: Can **only** enter at the specific event gate matching `EVENT_{event_id}`
- **Cat 1, 3, 4**: Can **only** enter at `CONFERENCE` gate — rejected at any event gate
- **Cat 1 & 4**: Multi-day passes — `usage_day1` and `usage_day2` tracked independently
- **Cat 2 & 3**: Single-use — once `usage_event`/`usage_day1` is set, ticket is consumed

---

## Database Schema

### `tickets` table (26 columns)

| Column            | Type          | Default          | Description                                        |
|-------------------|---------------|------------------|----------------------------------------------------|
| `id`              | UUID (PK)     | `gen_random_uuid()` | Ticket unique identifier                        |
| `registration_id` | UUID (FK)     | —                | Links to `registrations.id`                        |
| `email`           | TEXT          | —                | Attendee email                                     |
| `name`            | TEXT          | —                | Attendee name                                      |
| `college`         | TEXT          | —                | College name                                       |
| `phone`           | VARCHAR(20)   | —                | Phone number                                       |
| `code_6_digit`    | TEXT (UNIQUE) | —                | 6-digit human-readable entry code                  |
| `qr_payload`      | TEXT          | —                | Legacy QR data (now = `qr_token`)                  |
| `qr_token`        | TEXT          | —                | **HMAC-SHA256 signed token** — QR code encodes this|
| `ticket_status`   | TEXT          | `'valid'`        | Legacy status field                                |
| `status`          | TEXT          | `'active'`       | **Primary status**: `active` / `revoked`           |
| `category`        | INTEGER       | `1`              | Ticket category: 1, 2, 3, or 4                    |
| `event_id`        | TEXT          | NULL             | Event slug (Cat 2 only), e.g. `dance_show`         |
| `valid_days`      | TEXT[]        | `'{}'`           | Array of valid date strings `['2026-03-14','2026-03-15']` |
| `usage_day1`      | TIMESTAMPTZ   | NULL             | Timestamp when used on Day 1 (`NULL` = unused)     |
| `usage_day2`      | TIMESTAMPTZ   | NULL             | Timestamp when used on Day 2 (`NULL` = unused)     |
| `usage_event`     | TIMESTAMPTZ   | NULL             | Timestamp when event ticket used (`NULL` = unused) |
| `last_used_at`    | TIMESTAMPTZ   | NULL             | Most recent usage (any day)                        |
| `ticket_type`     | VARCHAR(100)  | `'COMBO'`        | Human-readable label                               |
| `price`           | VARCHAR(50)   | —                | Ticket price                                       |
| `is_rit_student`  | BOOLEAN       | `false`          | Whether attendee is from host institution          |
| `ticket_generated`| BOOLEAN       | `false`          | Whether ticket record was created                  |
| `ticket_email_sent`| BOOLEAN      | `false`          | Whether email was sent                             |
| `ticket_sent_at`  | TIMESTAMPTZ   | NULL             | When email was sent                                |
| `created_at`      | TIMESTAMPTZ   | `now()`          | Record creation time                               |
| `updated_at`      | TIMESTAMPTZ   | `now()`          | Last update time                                   |

### `scan_logs` table (6 columns)

| Column           | Type        | Default          | Description                              |
|------------------|-------------|------------------|------------------------------------------|
| `id`             | UUID (PK)   | `gen_random_uuid()` | Log entry ID                          |
| `ticket_id`      | UUID (FK)   | —                | References `tickets.id`                  |
| `gate_type`      | TEXT        | —                | Gate where scan occurred                 |
| `result`         | TEXT        | —                | Scan result code (see Error Codes)       |
| `scanned_at`     | TIMESTAMPTZ | `now()`          | When the scan happened                   |
| `scanner_device` | TEXT        | NULL             | Device/email identifier of scanner       |

### `registrations` table (20 columns)

| Column               | Type        | Default    | Description                        |
|----------------------|-------------|------------|------------------------------------|
| `id`                 | UUID (PK)   | auto       | Registration ID                    |
| `name`               | TEXT        | —          | Registrant name                    |
| `email`              | TEXT        | —          | Registrant email                   |
| `phone`              | TEXT        | —          | Phone number                       |
| `college`            | TEXT        | —          | College name                       |
| `payment_status`     | TEXT        | `'unpaid'` | `unpaid` / `paid`                  |
| `payment_confirmed_at`| TIMESTAMPTZ| NULL       | When payment was confirmed         |
| `ticket_email_sent`  | BOOLEAN     | `false`    | Whether ticket email was sent      |
| `ticket_generated`   | BOOLEAN     | `false`    | Whether ticket was generated       |
| `ticket_sent_at`     | TIMESTAMPTZ | NULL       | When ticket email was sent         |
| `is_rit_student`     | BOOLEAN     | `false`    | Host institution flag              |
| `ticket_type`        | TEXT        | NULL       | Ticket type label                  |
| `price`              | TEXT        | NULL       | Amount paid                        |
| `institution_type`   | TEXT        | NULL       | Type of institution                |
| `register_number`    | TEXT        | NULL       | Student register number            |
| `checked_in_at`      | TIMESTAMPTZ | NULL       | Legacy check-in timestamp          |
| `checked_in_by`      | TEXT        | NULL       | Legacy check-in admin              |
| `payment_utr`        | TEXT        | NULL       | Payment UTR reference              |
| `payment_batch_id`   | UUID        | NULL       | Batch import reference             |
| `created_at`         | TIMESTAMPTZ | `now()`    | Registration time                  |

---

## QR Token Generation & Verification

### How tokens are generated (in `issue_tickets_batch`)

```
QR_TOKEN = TICKET_UUID + "." + HMAC-SHA256(TICKET_UUID, QR_SIGNING_SECRET)
```

**Exact implementation:**

```typescript
async function signToken(ticketId: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(ticketId));
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return `${ticketId}.${hex}`;
}
```

**Example token:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890.3f8a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

### How tokens are verified (in `validate_scan` RPC)

The database function does a **direct lookup**:
```sql
SELECT * FROM public.tickets WHERE qr_token = p_qr_token FOR UPDATE;
```

The token IS the lookup key. If it matches a row, the ticket is found. No separate HMAC verification step is needed — the HMAC ensures tokens cannot be guessed or forged because only the `issue_tickets_batch` function (which holds `QR_SIGNING_SECRET`) can generate valid tokens.

### What the QR code contains

The QR code image encodes **exactly** the `qr_token` string — nothing else. No JSON, no metadata, no UUID.

```
QR Code Image → decodes to → "a1b2c3d4-e5f6-7890-abcd-ef1234567890.3f8a2b..."
```

---

## Email Sender (`issue_tickets_batch`)

### Endpoint

```
POST https://mnboyuyajxghqbbkdqhi.supabase.co/functions/v1/issue_tickets_batch
```

### Authentication

Requires `Authorization: Bearer <JWT>` from a Supabase-authenticated admin user.

### Request Payload

```json
{
  "registration_ids": ["uuid-1", "uuid-2"],
  "category": 1,
  "valid_days": ["2026-03-14", "2026-03-15"],
  "event_id": null
}
```

| Field              | Type     | Required | Description                                       |
|--------------------|----------|----------|---------------------------------------------------|
| `registration_ids` | string[] | YES      | Array of `registrations.id` UUIDs                 |
| `category`         | number   | YES      | 1, 2, 3, or 4                                    |
| `valid_days`       | string[] | YES      | Date strings in `YYYY-MM-DD` format               |
| `event_id`         | string   | Cat 2    | Required for category 2. Event slug e.g. `dance_show` |

### Response

```json
{
  "success": true,
  "issued_count": 3,
  "skipped_count": 1,
  "not_paid_count": 0,
  "already_sent_count": 1,
  "failed": [
    { "registration_id": "uuid-x", "reason": "Registration not found" }
  ]
}
```

### What it does (step-by-step)

1. Validates admin auth via JWT
2. For each `registration_id`:
   - Fetches registration; checks `payment_status === 'paid'`
   - Checks idempotency (`ticket_email_sent` flag + `ticket_email_events` table)
   - If ticket exists → reuses it; if `qr_token` is missing → generates one
   - If no ticket → generates 6-digit code, UUID, HMAC-signed `qr_token`, inserts ticket
   - Generates QR code data URL from `qr_token`
   - Renders brutalist HTML email with ticket code + QR
   - Sends via SMTP (Gmail TLS on port 465)
   - Logs to `ticket_email_events`, marks `registrations.ticket_email_sent = true`

---

## Scanner Endpoint (`validate_scan`)

### Endpoint

```
POST https://mnboyuyajxghqbbkdqhi.supabase.co/functions/v1/validate_scan
```

### Authentication

Requires `Authorization: Bearer <JWT>` from a Supabase-authenticated user (gate volunteer / admin).

### What the Scanner App MUST Send

```json
{
  "qr_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.3f8a2b1c...",
  "gate_type": "CONFERENCE",
  "scanner_device": "Gate-A-iPad-01"
}
```

| Field            | Type   | Required | Description                                          |
|------------------|--------|----------|------------------------------------------------------|
| `qr_token`       | string | YES      | The exact string decoded from QR code                |
| `gate_type`      | string | YES      | `CONFERENCE` or `EVENT_{event_id}` (e.g. `EVENT_dance_show`) |
| `scanner_device` | string | NO       | Optional device identifier for audit trail           |

### What the Backend Returns

**Success (HTTP 200):**
```json
{
  "success": true,
  "allowed": true,
  "reason": "VALID",
  "message": "Entry allowed",
  "ticket": {
    "name": "John Doe",
    "email": "john@example.com",
    "college": "MIT",
    "phone": "9876543210",
    "code_6_digit": "482917",
    "category": 1,
    "ticket_type": "Institution Student Pass",
    "is_rit_student": false,
    "event_id": null,
    "ticket_id": "a1b2c3d4-..."
  }
}
```

**Rejection (HTTP 403):**
```json
{
  "success": false,
  "allowed": false,
  "reason": "ALREADY_USED_TODAY",
  "message": "Ticket already used today. Valid again tomorrow.",
  "ticket": {
    "name": "John Doe",
    "email": "john@example.com",
    "code_6_digit": "482917",
    "category": 1,
    "usage_day1": "2026-03-14T10:30:00Z"
  }
}
```

**Invalid request (HTTP 400):**
```json
{ "error": "qr_token and gate_type are required" }
```

---

## Validation Flow — Step by Step

The `validate_scan` PostgreSQL function implements this exact 7-step decision tree:

```
START
  │
  ▼
STEP 1: Lookup ticket by qr_token
  │   ├─ NOT FOUND → return TICKET_NOT_FOUND (no scan_log entry)
  │   └─ FOUND → continue
  ▼
ANTI-ABUSE: Check scan_logs for VALID result within last 5 seconds
  │   ├─ FOUND → return REPLAY_ATTACK
  │   └─ CLEAR → continue
  ▼
STEP 2: Check ticket.status
  │   ├─ NOT 'active' → return TICKET_REVOKED
  │   └─ 'active' → continue
  ▼
STEP 3: Check if today's date is in ticket.valid_days[]
  │   ├─ NOT IN ARRAY → return INVALID_DAY
  │   └─ IN ARRAY → determine day_index (1 or 2)
  ▼
STEP 4: Time restriction check (Cat 3 & 4 only)
  │   ├─ Category 3 or 4 AND current_time < 15:00 IST → return TOO_EARLY_ENTRY
  │   └─ Otherwise → continue
  ▼
STEP 5: Gate validity check
  │   ├─ Cat 2 at wrong event gate → WRONG_GATE
  │   ├─ Cat 2 at CONFERENCE gate → EVENT_ONLY_TICKET
  │   ├─ Cat 1/3/4 at non-CONFERENCE gate → WRONG_GATE
  │   └─ Correct gate → continue
  ▼
STEP 6: Usage check
  │   ├─ Cat 2: usage_event IS NOT NULL → ALREADY_USED_TODAY
  │   ├─ Day 1: usage_day1 IS NOT NULL → ALREADY_USED_TODAY
  │   ├─ Day 2: usage_day2 IS NOT NULL → ALREADY_USED_TODAY
  │   └─ NULL (unused) → continue
  ▼
STEP 7: APPROVE
  │   ├─ Cat 2 → SET usage_event = NOW()
  │   ├─ Day 1 → SET usage_day1 = NOW()
  │   └─ Day 2 → SET usage_day2 = NOW()
  │
  └─ Insert scan_log with result='VALID'
     Return { allowed: true, reason: 'VALID' }
```

---

## Gate Validation Logic

```
┌─────────────────────────────────────────────────────────┐
│                  GATE TYPE RULES                        │
├──────────┬──────────────────────────────────────────────┤
│ Cat 1    │ MUST scan at gate_type = "CONFERENCE"        │
│ Cat 2    │ MUST scan at gate_type = "EVENT_{event_id}"  │
│ Cat 3    │ MUST scan at gate_type = "CONFERENCE"        │
│ Cat 4    │ MUST scan at gate_type = "CONFERENCE"        │
├──────────┴──────────────────────────────────────────────┤
│ Example gate_type values:                               │
│   "CONFERENCE"          → Main conference entry         │
│   "EVENT_dance_show"    → Dance show event gate         │
│   "EVENT_music_night"   → Music night event gate        │
│   "EVENT_hackathon"     → Hackathon event gate          │
└─────────────────────────────────────────────────────────┘
```

**The scanner app must be pre-configured** with its `gate_type` — it sends this value with every scan request. A conference gate scanner always sends `"CONFERENCE"`. An event gate scanner sends `"EVENT_dance_show"` etc.

---

## Time Restrictions

| Category | Restriction                                    | Implementation                     |
|----------|------------------------------------------------|-------------------------------------|
| 1        | None — entry any time                          | Skips time check                   |
| 2        | None — entry any time                          | Skips time check                   |
| 3        | **After 3:00 PM IST only**                     | `current_time < '15:00'` → reject  |
| 4        | **After 3:00 PM IST only**                     | `current_time < '15:00'` → reject  |

Time is evaluated in **Asia/Kolkata** timezone:
```sql
v_current_time := (v_now AT TIME ZONE 'Asia/Kolkata')::TIME;
IF v_ticket.category IN (3, 4) AND v_current_time < '15:00:00'::TIME THEN
  -- REJECT with reason TOO_EARLY_ENTRY
END IF;
```

---

## Day Reset & Usage Tracking

### How day_index is determined

```sql
-- valid_days = ['2026-03-14', '2026-03-15']
-- today = '2026-03-14' → day_index = 1  (uses usage_day1)
-- today = '2026-03-15' → day_index = 2  (uses usage_day2)
```

The system matches today's date against the `valid_days` array position:
- Position 1 → `usage_day1`
- Position 2 → `usage_day2`

### How reset works

There is **no automatic midnight reset**. Each day has its own independent column:
- Day 1 usage is tracked in `usage_day1`
- Day 2 usage is tracked in `usage_day2`

When Day 2 arrives, the system checks `usage_day2` (which is `NULL`), so the ticket is valid again. **Day 1 usage does not affect Day 2.**

### Category 2 (event tickets)

Event tickets use `usage_event` — once used, they are **permanently consumed**. No day-based reset.

---

## Admin Functions

### `admin_force_allow(p_ticket_id UUID, p_day INTEGER)`

Force-approves a ticket entry, overriding all checks. Sets the appropriate usage column.

| `p_day` | Cat 2 action           | Cat 1/3/4 action          |
|---------|------------------------|---------------------------|
| 1       | `usage_event = NOW()`  | `usage_day1 = NOW()`      |
| 2       | `usage_event = NOW()`  | `usage_day2 = NOW()`      |

### `admin_reset_entry(p_ticket_id UUID, p_day INTEGER)`

Resets usage so ticket can be scanned again.

| `p_day` | Action                                                          |
|---------|-----------------------------------------------------------------|
| 0       | Reset ALL: `usage_day1 = NULL, usage_day2 = NULL, usage_event = NULL` |
| 1       | Cat 2: `usage_event = NULL` / Others: `usage_day1 = NULL`      |
| 2       | Cat 2: `usage_event = NULL` / Others: `usage_day2 = NULL`      |

### Other DB Functions

| Function              | Purpose                                              |
|-----------------------|------------------------------------------------------|
| `check_is_admin`      | Checks if email is in admin list                     |
| `search_tickets`      | Search tickets by name/email/code                    |
| `get_ticket_by_code`  | Lookup ticket by 6-digit code                        |
| `get_ticket_override_logs` | Get override history for a ticket              |
| `verify_and_mark_ticket`   | **Legacy** — old single-use check-in function   |

---

## API Endpoints

| Method | Endpoint                                    | Auth    | Purpose                        |
|--------|---------------------------------------------|---------|--------------------------------|
| POST   | `/functions/v1/issue_tickets_batch`         | JWT     | Generate tickets + send emails |
| POST   | `/functions/v1/validate_scan`               | JWT     | Scanner validation endpoint    |
| POST   | `/functions/v1/check_in`                    | JWT     | Legacy registration check-in   |
| POST   | `/functions/v1/ccavenue_create_order`       | Public  | Create CCAvenue payment order  |
| POST   | `/functions/v1/ccavenue_callback`           | Public  | CCAvenue payment callback      |
| POST   | `/functions/v1/import_paid_sheet`           | JWT     | Bulk import paid registrations |
| POST   | `/functions/v1/send-registration-email`     | JWT     | Send registration confirmation |

Base URL: `https://mnboyuyajxghqbbkdqhi.supabase.co`

---

## Error Codes & Meanings

| Code                | HTTP | Meaning                                             | When                                          |
|---------------------|------|------------------------------------------------------|-----------------------------------------------|
| `TICKET_NOT_FOUND`  | 403  | QR token doesn't match any ticket                   | Invalid/tampered QR code                      |
| `TICKET_REVOKED`    | 403  | Ticket status is not `active`                       | Admin revoked the ticket                      |
| `INVALID_DAY`       | 403  | Today's date not in `valid_days[]`                  | Attendee at wrong day                         |
| `TOO_EARLY_ENTRY`   | 403  | Current time before 3:00 PM IST                     | Cat 3/4 before afternoon                      |
| `WRONG_GATE`        | 403  | Gate type doesn't match ticket category             | Conference ticket at event gate or vice versa  |
| `EVENT_ONLY_TICKET` | 403  | Cat 2 ticket scanned at conference gate             | Event ticket at main entrance                 |
| `ALREADY_USED_TODAY`| 403  | Ticket already used for this day/event              | Re-entry attempt                              |
| `REPLAY_ATTACK`     | 403  | Same ticket scanned within 5 seconds                | Anti-abuse: rapid duplicate scans             |
| `VALID`             | 200  | Entry approved                                      | All checks passed                             |

---

## Scanner ↔ Mail System Data Contract

### Shared Data Format

The **only shared data** between the mail sender and scanner is the `qr_token` string.

```
MAIL SENDER                          SCANNER
─────────────                        ───────
1. Generate UUID                     1. Scan QR code
2. HMAC-SHA256 sign UUID             2. Decode → get qr_token string
3. qr_token = UUID + "." + HMAC     3. Send qr_token to validate_scan
4. Store qr_token in tickets table   4. Backend looks up by qr_token
5. Generate QR image from qr_token   5. Display result to volunteer
6. Email QR image to attendee
```

### Critical: What's inside the QR

```
QR Code Content = qr_token = "{ticket_uuid}.{hmac_hex}"
```

- **NOT** a JSON object
- **NOT** a plain UUID
- **NOT** a URL
- It is a **raw string** — the concatenation of the ticket UUID, a dot, and the 64-char HMAC hex

### How categories are distinguished

Categories are **NOT** encoded in the QR. The QR contains only the token. The category is stored in the database and retrieved during validation. The scanner does not need to know the category — the backend enforces all rules.

---

## Environment Variables

### Required for Edge Functions (set in Supabase Dashboard → Settings → Edge Functions)

| Variable                  | Description                                          | Example                          |
|---------------------------|------------------------------------------------------|----------------------------------|
| `SUPABASE_URL`            | Auto-set by Supabase                                 | `https://xxx.supabase.co`       |
| `SUPABASE_SERVICE_ROLE_KEY`| Auto-set by Supabase                                | `eyJhbG...`                     |
| `QR_SIGNING_SECRET`       | HMAC secret for QR token signing                     | `my-super-secret-key-2026`      |
| `EMAIL_USER`              | Gmail address for SMTP                               | `yatra2026@gmail.com`           |
| `EMAIL_PASS`              | Gmail App Password (NOT account password)            | `abcd efgh ijkl mnop`          |
| `FROM_EMAIL`              | Sender email address                                 | `noreply@yatra2026.com`        |
| `MASTER_ADMIN_EMAIL`      | Primary admin email (bypasses admin check)            | `meraryanto@gmail.com`         |

### Setting env vars

```bash
supabase secrets set QR_SIGNING_SECRET="your-secret-here"
supabase secrets set EMAIL_USER="your-gmail@gmail.com"
supabase secrets set EMAIL_PASS="your-app-password"
```

Or via Supabase Dashboard: **Project Settings → Edge Functions → Add Secret**

---

## Deployment Instructions

### 1. Database Migrations

All migrations are applied via Supabase MCP or Dashboard SQL Editor. The migrations in order:

1. `add_ticket_category_columns` — Added `category`, `event_id`, `valid_days`, `usage_day1/2`, `usage_event`, `qr_token`, `status`
2. `create_scan_logs_table` — Created `scan_logs` with FK to `tickets`
3. `backfill_existing_tickets` — Set existing tickets to Cat 1
4. `create_validate_scan_function` — The 7-step RPC
5. `update_admin_force_allow` — Updated for new usage columns
6. `update_admin_reset_entry` — Updated for new usage columns
7. `widen_ticket_type_column` — `varchar(10)` → `varchar(100)`
8. `fix_validate_scan_not_found_logging` — Fixed FK violation on TICKET_NOT_FOUND

### 2. Edge Functions

```bash
# Deploy validate_scan
supabase functions deploy validate_scan --project-ref mnboyuyajxghqbbkdqhi

# Deploy issue_tickets_batch
supabase functions deploy issue_tickets_batch --project-ref mnboyuyajxghqbbkdqhi
```

### 3. Set Secrets

```bash
supabase secrets set QR_SIGNING_SECRET="<CHOOSE-A-STRONG-SECRET>" --project-ref mnboyuyajxghqbbkdqhi
supabase secrets set EMAIL_USER="<GMAIL>" --project-ref mnboyuyajxghqbbkdqhi
supabase secrets set EMAIL_PASS="<APP-PASSWORD>" --project-ref mnboyuyajxghqbbkdqhi
supabase secrets set MASTER_ADMIN_EMAIL="meraryanto@gmail.com" --project-ref mnboyuyajxghqbbkdqhi
```

---

## Running Locally

### Prerequisites

- [Deno](https://deno.land/) installed
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Gmail App Password configured

### Start local Supabase

```bash
cd "YATRA 2026"
supabase start
```

### Serve edge functions locally

```bash
supabase functions serve --env-file .env.local
```

### `.env.local` file

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
QR_SIGNING_SECRET=local-dev-secret
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
MASTER_ADMIN_EMAIL=meraryanto@gmail.com
FROM_EMAIL=noreply@yatra2026.com
```

### Test the scanner endpoint locally

```bash
curl -X POST http://localhost:54321/functions/v1/validate_scan \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"qr_token": "test-token", "gate_type": "CONFERENCE"}'
```

---

## Security Notes

1. **QR tokens are HMAC-signed** — cannot be forged without `QR_SIGNING_SECRET`
2. **QR codes contain NO plaintext data** — only the signed token string
3. **All validation is server-side** — the scanner app has zero validation logic
4. **JWT authentication required** — both admin and scanner endpoints require valid Supabase JWT
5. **`SELECT ... FOR UPDATE`** — ticket row is locked during validation to prevent race conditions
6. **5-second replay guard** — prevents rapid duplicate scans on the same ticket
7. **SECURITY DEFINER** — DB functions run with elevated privileges, bypassing RLS
8. **SMTP uses TLS** — Gmail connection on port 465 (implicit TLS)
9. **Admin check** — only `MASTER_ADMIN_EMAIL` or users in admin table can issue tickets

---

## Known Limitations & Missing Pieces

### ⚠️ Deployment Blocker

- `issue_tickets_batch` edge function deployment is currently failing with Supabase internal error. The **code is written and saved locally** at `supabase/functions/issue_tickets_batch/index.ts` but needs manual deployment via CLI (`supabase functions deploy issue_tickets_batch`).

### 📋 Missing Information

- **Event dates**: The exact calendar dates for Day 1 and Day 2 need to be provided when calling `issue_tickets_batch`. They are passed as `valid_days` parameter.
- **Scanner frontend**: No scanner app is included in this repo. A separate mobile/web app must be built that:
  1. Authenticates with Supabase (gets JWT)
  2. Scans QR codes
  3. POSTs to `validate_scan` endpoint
  4. Displays the result (green/red + attendee info)

### 🔧 Assumptions Made

1. Timezone is **Asia/Kolkata (IST)** — hardcoded in validation function
2. Day 1 = first element in `valid_days[]`, Day 2 = second element
3. `QR_SIGNING_SECRET` defaults to `"yatra-2026-qr-secret-default"` if not set — **MUST be changed in production**
4. Gmail SMTP is used — if `EMAIL_USER`/`EMAIL_PASS` not set, emails are mocked (logged only)
5. The `MASTER_ADMIN_EMAIL` defaults to `meraryanto@gmail.com`
6. Category 2 event tickets are single-use (no day reset)
7. Existing tickets from before the migration are backfilled as Category 1

### 🔒 Recommendations

1. **Set `QR_SIGNING_SECRET`** to a strong random value (32+ characters)
2. **Build scanner app** with gate_type pre-configured per device
3. **Deploy `issue_tickets_batch`** via Supabase CLI once API issues resolve
4. **Test full flow**: register → pay → issue ticket → receive email → scan at gate
5. **Monitor `scan_logs`** table for abuse patterns
