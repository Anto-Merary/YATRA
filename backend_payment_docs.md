# YATRA 2026 - Backend & Payment Gateway Documentation

This document provides a detailed technical overview of the backend architecture and CCAvenue payment gateway integration for the YATRA 2026 project.

## 1. Architecture Overview

The backend follows a hybrid architecture leveraging both **Vercel Serverless Functions** and **Supabase Edge Functions**.

*   **Frontend**: React (Vite) hosted on Vercel.
*   **Database**: PostgreSQL via Supabase.
*   **API Layer**:
    *   **Vercel APIs (`/api/*`)**: Primary entry points for frontend interactions (e.g., Payment Initiation).
    *   **Supabase Edge Functions**: Backend logic for order handling, callbacks, and emails.
    *   **Rewrites**: `vercel.json` is configured to proxy specific API routes to Supabase Edge Functions.

### Key Components

| Component | Type | Path | Description |
| :--- | :--- | :--- | :--- |
| **Payment Init** | Vercel Function | `api/ccavenue-init.ts` | Initiates payment, creates order in DB, returns encrypted payload. |
| **Payment Callback** | Vercel Route | `/api/ccavenue-handle` | public URL handling CCAvenue POST response. |
| **Callback Logic** | Supabase Function | `supabase/functions/ccavenue-handle` (mapped) | Decrypts response, updates DB, redirects user. |
| **Registration Sync** | Supabase Function | `functions/ccavenue_create_order` | Alternative/Internal order creation logic. |

---

## 2. Payment Gateway Integration (CCAvenue)

The integration uses the **Non-Seamless** method where the user is redirected to CCAvenue's page to complete the payment.

### 2.1 Communication Flow

1.  **Initiation (`/api/ccavenue-init`)**:
    *   **Input**: JSON payload with user details (name, email, phone, purpose).
    *   **Process**:
        1.  Validates input data.
        2.  Upserts user into `registrations` table (status: `unpaid`).
        3.  Creates an entry in `ccavenue_orders` table (status: `pending`).
        4.  Constructs the parameter string expected by CCAvenue.
        5.  Encrypts the parameters using AES-128-CBC (using `working_key`).
    *   **Output**: JSON containing `encRequest`, `access_code`, and the `action` URL.

2.  **User Payment**:
    *   Frontend constructs a hidden FORM using the response data.
    *   Auto-submits to `https://secure.ccavenue.com/transaction/transaction.do`.
    *   User completes payment on bank page.

3.  **Callback Processing (`/api/ccavenue-handle`)**:
    *   **Trigger**: CCAvenue POSTs to `https://www.rityatra.in/api/ccavenue-handle`.
    *   **Routing**: Vercel rewrites this request to the Supabase Edge Function (via `vercel.json`).
    *   **Process**:
        1.  Receives `encResp` (hex encoded ciphertext).
        2.  Decrypts it using AES-128-CBC.
        3.  Extracts `order_status` (Success/Aborted/Failure).
        4.  Updates `ccavenue_orders` table.
        5.  If **Success**: Updates `registrations` table to `paid` and triggers ticket email.
    *   **Response**: Returns an HTML redirect to the frontend success/failure page.

### 2.2 Database Schema (Payment Related)

#### `ccavenue_orders` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `order_id` | Text (PK) | Unique Order ID (e.g., `YATRA17283...`). |
| `purpose` | Text | `yatra_entry` or `event`. |
| `amount_inr` | Numeric | Transaction amount. |
| `status` | Text | `pending`, `success`, `failure`, `aborted`. |
| `enc_request` | Text | Encrypted request payload (for audit). |
| `enc_response` | Text | Encrypted response payload (for audit). |
| `tracking_id` | Text | CCAvenue Bank Ref No. |
| `yatra_registration_id` | UUID | FK to `registrations.id`. |

### 2.3 Configuration & Secrets

The following environment variables are required:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `CCAVENUE_MERCHANT_ID` | Vercel / Supabase | Merchant ID provided by CCAvenue. |
| `CCAVENUE_ACCESS_CODE` | Vercel / Supabase | Access Code for the specific sub-account. |
| `CCAVENUE_WORKING_KEY` | Vercel / Supabase | 32-char encryption key. |
| `VITE_SUPABASE_URL` | Frontend/Vercel | Supabase Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Admin key for DB writes (Bypasses RLS). |
| `SITE_URL` | Vercel | Base URL for redirects (e.g., `https://www.rityatra.in`). |

---

## 3. Discrepancies & Notes

### Routing Anomaly
*   **Callback URL**: The system sets the callback to `.../api/ccavenue-handle`.
*   **Rewrite**: `vercel.json` rewrites this path to a Supabase Function.
    ```json
    "source": "/api/ccavenue-handle",
    "destination": "https://[project-ref].supabase.co/functions/v1/ccavenue-handle"
    ```
*   **Local Codebase**: The local folder for the callback function is named `supabase/functions/ccavenue_callback`.
    *   *Note*: Ensure the Supabase function is deployed with the name `ccavenue-handle` OR update `vercel.json` to point to `ccavenue_callback`.

### Legacy vs Modern
*   `api/ccavenue-handle.ts` exists locally but is likely **bypassed** due to the Vercel rewrite. The active logic resides in the Supabase Edge Function.
*   Frontend files (`Form.tsx`, `TestPaymentPage.tsx`) explicitly call the Vercel API `api/ccavenue-init`.

## 4. Testing

### Local Testing
To test payments locally (`localhost`), you must:
1.  Use `ngrok` or similar to expose your local server.
2.  Update the `redirect_url` and `cancel_url` in `api/ccavenue-init.ts` to your ngrok URL.
3.  **Important**: CCAvenue creates a whitelist of domains. `localhost` is NOT whitelisted. You must use the whitelisted domain (e.g., `rityatra.in`) or a pre-approved test domain.

### Test Payment Page
A simulation page exists at `/test-payment` (`src/pages/TestPaymentPage.tsx`) which:
1.  Generates dummy user data.
2.  Calls the real `/api/ccavenue-init`.
3.  Useful for verifying the encryption/handshake without filling the registration form.
