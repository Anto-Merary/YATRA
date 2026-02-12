# YATRA 2026 - Scanner App Documentation

## Overview
The Scanner App is a standalone mobile or web application responsible for validating entry tickets at the YATRA 2026 gates. It interacts with the main Supabase backend via the `validate_scan` Edge Function.

**NOTE**: The scanner app source code is separate from this repository. This document defines the interface and requirements for the scanner app to work with the YATRA 2026 backend system.

## Core Responsibilities
1.  **Authenticate**: User (Gate Volunteer) must log in to get a valid Supabase JWT.
2.  **Scan**: Read QR codes from attendee passes.
3.  **Validate**: Send the scanned token to the backend for verification.
4.  **Display**: Show clear "ALLOWED" or "DENIED" status with reasons.

## Configuration
The app must allow configuring the **Gate Type** before scanning begins.
- **`CONFERENCE`**: Main entry gate (common for most tickets).
- **`EVENT_{id}`**: Specific event gates (e.g., `EVENT_dance_show`).

## API Integration

### Endpoint
`POST https://mnboyuyajxghqbbkdqhi.supabase.co/functions/v1/validate_scan`

### Authentication
**Header**: `Authorization: Bearer <USER_JWT>`
*The user must be authenticated in Supabase.*

### Request Payload
```json
{
  "qr_token": "<SCANNED_STRING_FROM_QR>",
  "gate_type": "CONFERENCE", 
  "scanner_device": "Device-ID-01" 
}
```
- `qr_token`: **Required**. The exact raw string read from the QR code.
- `gate_type`: **Required**. The gate identifier where the scanner is located.
- `scanner_device`: *Optional*. Identifier for the device/volunteer.

### QR Code Format
The QR code contains a **raw string**, NOT a JSON object.
**Format**: `{UUID}.{HMAC_SIGNATURE}`
**Example**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890.3f8a2...`

### Response Handling

#### ✅ Success (Entry Allowed)
**Status**: `200 OK`
```json
{
  "success": true,
  "allowed": true,
  "reason": "VALID",
  "ticket": {
    "name": "Student Name",
    "email": "student@college.edu",
    "code_6_digit": "123456",
    "category": 1,
    "college": "RIT",
    "is_rit_student": true
  }
}
```
**Action**: Show **GREEN** screen. Display Name, College, and ID.

#### ❌ Failure (Entry Denied)
**Status**: `403 Forbidden` (or `400` for bad request)
```json
{
  "success": false,
  "allowed": false,
  "reason": "ALREADY_USED_TODAY",
  "message": "Ticket already used today. Valid again tomorrow.",
  "ticket": { ... }
}
```
**Action**: Show **RED** screen. Display `message` and `reason` prominently.

**Common Failure Reasons**:
- `TICKET_NOT_FOUND`: Invalid QR.
- `ALREADY_USED_TODAY`: Duplicate entry attempt.
- `WRONG_GATE`: Wrong category for this gate.
- `TOO_EARLY_ENTRY`: Trying to enter before allowed time (3 PM for General).
- `REPLAY_ATTACK`: Scanned twice within 5 seconds.

## Development & Testing
You can test the backend integration using `curl`:

```bash
curl -X POST https://mnboyuyajxghqbbkdqhi.supabase.co/functions/v1/validate_scan \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"qr_token": "TEST_TOKEN", "gate_type": "CONFERENCE"}'
```
