"""
Final Ticket Sender for YATRA 2026
==================================

Designed to send to ALL recipients in the Excel file (3094+). No recipient limit.

1. Imports ALL valid emails from 'Yatra registered/College mail id till 11th feb 2026.xlsx'.
2. Checks for existing registrations in Supabase (paginated; supports 3000+).
3. Generates UNIQUE 6-digit ticket codes (checked against DB).
4. Generates UUIDs for QR codes.
5. Sends emails with specific content and "NO BAGS" rules.
6. Logs all actions to console and Supabase. Progress every 500 emails.

Usage:
    python final_ticket_sender.py              # Dry run (default)
    python final_ticket_sender.py --send       # ACTUAL SENDING (all from Excel)
    python final_ticket_sender.py --send --limit 500 --yes   # Batch of 500 (e.g. for Gmail daily limit)
"""

import pandas as pd
import requests
import os
import sys
import argparse
import uuid
import random
import string
import hmac
import hashlib
import base64
import smtplib
import io
import time
import qrcode
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE = r"Yatra registered\College mail id till 11th feb 2026.xlsx"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL") or EMAIL_USER or "noreply@yatra2026.com"
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
QR_SECRET = os.getenv("QR_SIGNING_SECRET", "yatra-2026-qr-secret-default")
REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "30"))
HTTP_MAX_RETRIES = int(os.getenv("HTTP_MAX_RETRIES", "4"))
HTTP_RETRY_BACKOFF_SECONDS = float(os.getenv("HTTP_RETRY_BACKOFF_SECONDS", "1.5"))
SEND_DELAY_SECONDS = float(os.getenv("SEND_DELAY_SECONDS", "0.7"))
SMTP_RECONNECT_EVERY = int(os.getenv("SMTP_RECONNECT_EVERY", "80"))
SMTP_BATCH_PAUSE_EVERY = int(os.getenv("SMTP_BATCH_PAUSE_EVERY", "250"))
SMTP_BATCH_PAUSE_SECONDS = float(os.getenv("SMTP_BATCH_PAUSE_SECONDS", "30"))

# Ticket Config
EVENT_DATES = "FEB 13 AND 14"
EVENT_VENUE = "Rajalakshmi Institute of Technology"

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=ignore-duplicates"
    }

def ensure_runtime_config(require_smtp: bool):
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY.")
        sys.exit(1)
    if require_smtp and (not EMAIL_USER or not EMAIL_PASS):
        print("ERROR: Missing EMAIL_USER or EMAIL_PASS.")
        sys.exit(1)
    if require_smtp and QR_SECRET == "yatra-2026-qr-secret-default":
        print("ERROR: QR_SIGNING_SECRET is using default fallback. Configure production secret before sending.")
        sys.exit(1)

def request_with_retry(method: str, url: str, *, headers: Dict[str, str], params: Optional[Dict[str, Any]] = None,
                       json: Optional[Any] = None, timeout: int = REQUEST_TIMEOUT_SECONDS):
    last_err = None
    for attempt in range(1, HTTP_MAX_RETRIES + 1):
        try:
            response = requests.request(method, url, headers=headers, params=params, json=json, timeout=timeout)
            if response.status_code >= 500 and attempt < HTTP_MAX_RETRIES:
                wait_s = HTTP_RETRY_BACKOFF_SECONDS * attempt
                print(f"  HTTP {response.status_code} on {method} {url}. Retry {attempt}/{HTTP_MAX_RETRIES} in {wait_s:.1f}s...")
                time.sleep(wait_s)
                continue
            return response
        except requests.RequestException as e:
            last_err = e
            if attempt >= HTTP_MAX_RETRIES:
                break
            wait_s = HTTP_RETRY_BACKOFF_SECONDS * attempt
            print(f"  Request error on {method} {url}: {e}. Retry {attempt}/{HTTP_MAX_RETRIES} in {wait_s:.1f}s...")
            time.sleep(wait_s)
    raise RuntimeError(f"Request failed after {HTTP_MAX_RETRIES} attempts: {method} {url}. Last error: {last_err}")

class SMTPEmailSender:
    """Reuses SMTP connection and reconnects periodically for stability."""
    def __init__(self):
        self.server = None
        self.sent_in_session = 0
        self.total_sent = 0

    def connect(self):
        self.close()
        self.server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30)
        self.server.login(EMAIL_USER, EMAIL_PASS)
        self.sent_in_session = 0

    def close(self):
        if self.server:
            try:
                self.server.quit()
            except Exception:
                try:
                    self.server.close()
                except Exception:
                    pass
            finally:
                self.server = None

    def send(self, to_email: str, subject: str, html_content: str, text_content: str, qr_bytes: bytes) -> Tuple[bool, Optional[str]]:
        """Send email with inline QR code attachment."""
        # Create multipart/related message for inline images
        msg = MIMEMultipart('related')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        
        # Create alternative part for text/html
        msg_alt = MIMEMultipart('alternative')
        msg.attach(msg_alt)
        
        # Attach text and HTML parts
        msg_alt.attach(MIMEText(text_content, 'plain'))
        msg_alt.attach(MIMEText(html_content, 'html'))
        
        # Attach QR code as inline image with Content-ID
        qr_image = MIMEImage(qr_bytes, _subtype='png')
        qr_image.add_header('Content-ID', '<qrcode>')
        qr_image.add_header('Content-Disposition', 'inline', filename='ticket_qr.png')
        msg.attach(qr_image)

        for attempt in range(1, 3):
            try:
                if not self.server or self.sent_in_session >= SMTP_RECONNECT_EVERY:
                    self.connect()
                self.server.sendmail(FROM_EMAIL, to_email, msg.as_string())
                self.sent_in_session += 1
                self.total_sent += 1
                return True, None
            except Exception as e:
                self.close()
                if attempt == 2:
                    return False, str(e)
                time.sleep(1.0)
        return False, "Unknown SMTP failure"

# --- Cryptography & QR ---
def sign_token(ticket_id, secret):
    """HMAC-SHA256 signing of ticket ID."""
    msg = ticket_id.encode('utf-8')
    key = secret.encode('utf-8')
    sig = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return f"{ticket_id}.{sig}"

def generate_qr_bytes(qr_token):
    """Generate QR code and return as PNG bytes for inline attachment."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

# --- Email Templates ---
def get_email_content(reg_data, ticket_code):
    """Generate email HTML and text content. QR will be attached as inline MIME image."""
    college = reg_data.get('college', 'N/A')
    
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YATRA 2026 // ENTRY PASS</title>
</head>
<body style="margin:0;padding:20px;background:#000;font-family:'Courier New',Courier,monospace;color:#fff;">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #333;">
    <div style="background:#000;padding:40px 20px;text-align:center;border-bottom:2px solid #ff00ff;">
      <h1 style="color:#fff;margin:0;font-size:36px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">YATRA 2026</h1>
      <p style="color:#ff00ff;margin:10px 0 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">OFFICIAL ENTRY PASS</p>
    </div>
    <div style="padding:40px 30px;background:#111;text-align:left;">
      <h2 style="color:#fff;margin:0 0 20px;font-size:20px;">Hey 👋</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin-bottom:20px;">
        Your spot at Yatra 2026 is officially locked.<br>
        Get ready to step into a Korean-inspired cultural experience filled with energy, performances, lights, and moments you won’t forget.
      </p>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin-bottom:20px;">
        🎟️ Your pass is attached — keep it ready for entry.<br>
        📱 Bring your ID. Come charged. Come ready.
      </p>
      <p style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:20px;border-left:4px solid #ff00ff;padding-left:15px;">
        This isn’t just a fest.<br>
        It’s a vibe.<br>
        See you inside.
      </p>
      <p style="color:#888;font-size:12px;margin-top:30px;">
        Team Yatra 2026<br>
        Raja Lakshmi Institutions of Technology
      </p>
    </div>
    <div style="background:#fff;color:#000;padding:30px;margin:0 20px 20px;">
      <div style="margin-bottom:20px;border-bottom:2px dashed #000;padding-bottom:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;">NAME</p>
        <h3 style="margin:5px 0 0;font-size:18px;font-weight:900;text-transform:uppercase;">{reg_data.get('name', 'N/A')}</h3>
      </div>
      <div style="margin-bottom:20px;border-bottom:2px dashed #000;padding-bottom:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;">COLLEGE NAME</p>
        <h3 style="margin:5px 0 0;font-size:18px;font-weight:900;text-transform:uppercase;">{college}</h3>
      </div>
      <div style="text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:2px;">UNIQUE 6 DIGIT ID</p>
        <div style="background:#000;color:#fff;display:inline-block;padding:10px 30px;font-size:32px;font-weight:900;letter-spacing:6px;margin-bottom:20px;">
          {ticket_code}
        </div>
        <div style="display:block;margin:0 auto;width:200px;height:200px;background:#fff;padding:10px;border:2px solid #000;">
          <img src="cid:qrcode" alt="QR CODE" style="width:100%;height:100%;display:block;">
        </div>
        <p style="margin:10px 0 0;font-size:10px;color:#888;">SCAN FOR ENTRY</p>
      </div>
      <div style="margin-bottom:15px;border-bottom:2px dashed #000;padding-bottom:15px;">
        <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">DATES</p>
        <p style="margin:5px 0 0;font-size:14px;font-weight:900;">{EVENT_DATES}</p>
      </div>
      <div>
        <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">COLLEGE</p>
        <p style="margin:5px 0 0;font-size:14px;font-weight:700;">Rajalakshmi Institute<br>of Technology</p>
      </div>
    </div>
    <div style="padding:30px;background:#222;color:#ccc;font-size:12px;">
      <h4 style="margin:0 0 15px;color:#fff;text-transform:uppercase;border-bottom:1px solid #444;padding-bottom:10px;">RULES AND REGULATIONS</h4>
      <ol style="margin:0;padding-left:20px;line-height:1.8;">
        <li>College ID is a MUST.</li>
        <li>No outside food or beverages allowed.</li>
        <li>No ordering of food allowed inside campus.</li>
        <li>Do NOT delete this email.</li>
        <li>Maintain discipline inside the campus.</li>
        <li>Bags are NOT allowed, slim bags are not allowed.</li>
        <li>Entries not allowed after 5:00 PM.</li>
      </ol>
    </div>
    <div style="background:#000;padding:20px;text-align:center;border-top:1px solid #333;">
      <p style="margin:0;color:#666;font-size:10px;">YATRA 2026 OFFICIAL TICKET SYSTEM</p>
    </div>
  </div>
</body>
</html>"""

    text = f"""YATRA 2026 - OFFICIAL ENTRY PASS
================================
Hey 👋
Your spot at Yatra 2026 is officially locked.
Get ready to step into a Korean-inspired cultural experience filled with energy, performances, lights, and moments you won’t forget.

🎟️ Your pass is attached — keep it ready for entry.
📱 Bring your ID. Come charged. Come ready.

This isn’t just a fest.
It’s a vibe.
See you inside.

Team Yatra 2026
Raja Lakshmi Institutions of Technology

--------------------------------
YOUR TICKET DETAILS
--------------------------------
NAME: {reg_data.get('name', 'N/A')}
COLLEGE NAME: {college}
UNIQUE ID: {ticket_code}
DATES: {EVENT_DATES}
COLLEGE: {EVENT_VENUE}

--------------------------------
RULES AND REGULATIONS
--------------------------------
1. College ID is a MUST.
2. No outside food or beverages allowed.
3. No ordering of food allowed inside campus.
4. Do NOT delete this email.
5. Maintain discipline inside the campus.
6. Bags are NOT allowed, slim bags are not allowed.
7. Entries not allowed after 5:00 PM.
"""
    return html, text

def send_email_smtp(to_email, subject, html_content, text_content):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email

    part1 = MIMEText(text_content, 'plain')
    part2 = MIMEText(html_content, 'html')

    msg.attach(part1)
    msg.attach(part2)

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"SMTP Error for {to_email}: {e}")
        return False

# --- Core Logic ---

def fetch_existing_registrations(service_key):
    url = f"{SUPABASE_URL}/rest/v1/registrations"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "count=exact"
    }
    all_regs = {}
    offset = 0
    limit = 1000
    print("Fetching existing registrations...")
    while True:
        headers["Range"] = f"{offset}-{offset+limit-1}"
        params = {"select": "id,email,payment_utr,ticket_email_sent"}
        try:
            r = request_with_retry("GET", url, headers=headers, params=params)
            if r.status_code not in (200, 206):
                print(f"Error fetching regs: {r.text}")
                sys.exit(1)
            data = r.json()
            if not data: break
            for row in data:
                if row.get('email'):
                    all_regs[row['email'].lower().strip()] = row
                if row.get('payment_utr'):
                    all_regs[row['payment_utr'].strip()] = row
            if len(data) < limit: break
            offset += limit
            print(f"  Fetched {offset} records...")
        except Exception as e:
            print(f"Exception fetching regs: {e}")
            break
    return all_regs

def import_users(users):
    url = f"{SUPABASE_URL}/rest/v1/registrations"
    headers = get_supabase_headers()
    chunk_size = 50
    inserted_ids = []
    
    print(f"Importing {len(users)} users...")
    for i in range(0, len(users), chunk_size):
        chunk = users[i:i+chunk_size]
        try:
            r = request_with_retry("POST", url, headers=headers, json=chunk)
            if r.status_code in [200, 201]:
                data = r.json()
                print(f"  Imported batch {i//chunk_size + 1}: {len(data)} rows")
                inserted_ids.extend([d['id'] for d in data])
            else:
                # If the bulk insert fails (e.g. due to a duplicate email), fall back
                # to inserting one-by-one so that valid new users still get imported.
                print(f"  Failed batch {i//chunk_size + 1}: {r.status_code} - {r.text[:200]}... Falling back to per-row import.")
                for row in chunk:
                    try:
                        r_row = request_with_retry("POST", url, headers=headers, json=[row])
                        if r_row.status_code in [200, 201]:
                            row_data = r_row.json()
                            if row_data:
                                inserted_ids.append(row_data[0]["id"])
                        elif r_row.status_code == 409:
                            # Duplicate (email / UTR) – safe to ignore
                            continue
                        else:
                            print(f"    Row import failed ({r_row.status_code}): {str(r_row.text)[:160]}")
                    except Exception as e_row:
                        print(f"    Exception importing single row: {e_row}")
        except Exception as e:
            print(f"  Exception importing: {e}")
    return inserted_ids

def check_ticket_code_exists(code, headers):
    r = request_with_retry(
        "GET",
        f"{SUPABASE_URL}/rest/v1/tickets?code_6_digit=eq.{code}&select=id",
        headers=headers
    )
    if r.status_code == 200 and r.json():
        return True
    return False

def generate_unique_ticket_code(headers):
    # Retry loop to ensure uniqueness
    for _ in range(10):
        code = ''.join(random.choices(string.digits, k=6))
        if not check_ticket_code_exists(code, headers):
            return code
    raise Exception("Failed to generate unique ticket code after 10 attempts")

def process_tickets(reg_ids: List[str], is_dry_run: bool, max_to_send: Optional[int] = None, start_from: int = 0):
    headers = get_supabase_headers()
    smtp_sender = SMTPEmailSender()
    
    success_count = 0
    skipped_count = 0
    fail_count = 0
    
    sliced_ids = reg_ids[start_from:]
    if max_to_send is not None:
        sliced_ids = sliced_ids[:max_to_send]
    print(f"Processing {len(sliced_ids)} tickets (from index {start_from})...")

    for idx, reg_id in enumerate(sliced_ids):
        # 1. Fetch full reg details to ensure we have latest data
        r = request_with_retry(
            "GET",
            f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}&select=*",
            headers=headers
        )
        if r.status_code != 200 or not r.json():
            print(f"  [{idx+1}] Reg not found: {reg_id}")
            fail_count += 1
            continue
        
        reg = r.json()[0]
        email = reg.get('email')
        if not email:
            print(f"  [{idx+1}] Skipped {reg_id} (missing email)")
            skipped_count += 1
            continue

        if reg.get('payment_status') != 'paid':
            print(f"  [{idx+1}] Skipped {email} (payment_status={reg.get('payment_status')})")
            skipped_count += 1
            continue
        
        # 2. Check overlap
        if reg.get('ticket_email_sent'):
            print(f"  [{idx+1}] Skipped {email} (already sent)")
            skipped_count += 1
            continue
            
        if is_dry_run:
            print(f"  [DRY RUN] Would process ticket for {email}")
            continue

        # 3. Get or Create Ticket
        r_ticket = request_with_retry(
            "GET",
            f"{SUPABASE_URL}/rest/v1/tickets?registration_id=eq.{reg_id}&select=*",
            headers=headers
        )
        ticket = None
        if r_ticket.status_code == 200 and r_ticket.json():
            ticket = r_ticket.json()[0]
            
        if not ticket:
            try:
                ticket_code = generate_unique_ticket_code(headers)
                ticket_id = str(uuid.uuid4()) # QR UUID
                qr_token = sign_token(ticket_id, QR_SECRET)
                
                new_ticket = {
                    "id": ticket_id,
                    "registration_id": reg_id,
                    "email": email,
                    "name": reg.get('name'),
                    "college": reg.get('college'),
                    "phone": reg.get('phone'),
                    "code_6_digit": ticket_code,
                    "qr_token": qr_token,
                    "qr_payload": qr_token, # Using signed token as payload for now, or just ticket_id if preferred
                    "ticket_status": "valid",
                    "status": "active",
                    "ticket_type": "Student Pass",
                    "price": reg.get('price'),
                    "is_rit_student": False # We are importing everyone, logic for RIT flag if needed can be added
                }
                
                # If college contains RIT, set flag
                if "RIT" in str(reg.get('college', '')).upper() or "RAJALAKSHMI INSTITUTE OF TECHNOLOGY" in str(reg.get('college', '')).upper():
                    new_ticket["is_rit_student"] = True

                r_create = request_with_retry(
                    "POST",
                    f"{SUPABASE_URL}/rest/v1/tickets",
                    headers=headers,
                    json=new_ticket
                )
                if r_create.status_code != 201:
                    print(f"  [{idx+1}] Failed to create ticket for {email}: {r_create.text}")
                    fail_count += 1
                    # Log failure
                    request_with_retry("POST", f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                        "registration_id": reg_id,
                        "to_email": email,
                        "status": "failed",
                        "error_text": f"Ticket creation failed: {r_create.text}"
                    })
                    continue
                ticket = new_ticket
            except Exception as e:
                print(f"  [{idx+1}] Exception creating ticket for {email}: {e}")
                fail_count += 1
                continue
            
        if ticket and not ticket.get('qr_token'):
            try:
                regenerated_qr_token = sign_token(ticket['id'], QR_SECRET)
                patch_res = request_with_retry(
                    "PATCH",
                    f"{SUPABASE_URL}/rest/v1/tickets?id=eq.{ticket['id']}",
                    headers=headers,
                    json={"qr_token": regenerated_qr_token, "qr_payload": regenerated_qr_token}
                )
                if patch_res.status_code in (200, 204):
                    ticket['qr_token'] = regenerated_qr_token
                    ticket['qr_payload'] = regenerated_qr_token
            except Exception:
                pass
            if not ticket.get('qr_token'):
                ticket['qr_token'] = sign_token(ticket['id'], QR_SECRET)

        # 4. Generate Email with QR bytes
        qr_bytes = generate_qr_bytes(ticket['qr_token'])
        html, text = get_email_content(reg, ticket['code_6_digit'])
        
        # 5. Send Email with QR attachment
        ok, smtp_error = smtp_sender.send(
            email,
            f"YATRA 2026 // ENTRY PASS [{ticket['code_6_digit']}]",
            html,
            text,
            qr_bytes
        )
        if ok:
            # 6. Mark as sent
            request_with_retry("PATCH", f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}", headers=headers, json={
                "ticket_email_sent": True,
                "ticket_generated": True,
                "ticket_sent_at": datetime.utcnow().isoformat()
            })
            # Log event
            request_with_retry("POST", f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "registration_id": reg_id,
                "ticket_id": ticket['id'],
                "to_email": email,
                "status": "sent"
            })
            print(f"  [{idx+1}] SENT to {email}")
            success_count += 1
            # Progress for large runs (e.g. 3094)
            if success_count > 0 and success_count % 500 == 0:
                print(f"  --- Progress: {success_count} emails sent so far ---")
            # Rate limiting to avoid SMTP block
            if SMTP_BATCH_PAUSE_EVERY > 0 and success_count % SMTP_BATCH_PAUSE_EVERY == 0:
                print(f"  Pausing {SMTP_BATCH_PAUSE_SECONDS}s after {success_count} sends to reduce provider throttling...")
                time.sleep(SMTP_BATCH_PAUSE_SECONDS)
            else:
                time.sleep(SEND_DELAY_SECONDS)
        else:
            fail_count += 1
            print(f"  [{idx+1}] FAILED to send to {email} ({smtp_error})")
            # Log failure
            request_with_retry("POST", f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "registration_id": reg_id,
                "ticket_id": ticket['id'],
                "to_email": email,
                "status": "failed",
                "error_text": f"SMTP Error: {smtp_error}"
            })

    smtp_sender.close()
    return {"issued": success_count, "skipped": skipped_count, "failed": fail_count}

def clean_phone(p):
    s = str(p).strip().replace(' ', '').replace('-', '').replace('+91', '')
    if len(s) > 10: return s[-10:]
    return s

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--send", action="store_true", help="Actual sending mode. Default is DRY RUN.")
    parser.add_argument(
        "--import-only",
        action="store_true",
        help="Import all Excel users into Supabase but do NOT send any emails.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Max number of records to process in this run.")
    parser.add_argument("--start-from", type=int, default=0, help="Start index in target registration id list.")
    parser.add_argument("--yes", action="store_true", help="Skip interactive confirmation prompt in --send mode.")
    args = parser.parse_args()
    
    mode_import_only = args.import_only and not args.send
    is_dry_run = not args.send and not mode_import_only
    ensure_runtime_config(require_smtp=args.send)
    
    print(f"Reading {INPUT_FILE}...")
    try:
        df = pd.read_excel(INPUT_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        sys.exit(1)

    df.columns = [c.strip() for c in df.columns]
    
    # Identify key columns (flexible for 3094-row Excel)
    col_email = next((c for c in df.columns if 'billing email' in c.lower()), None) or next((c for c in df.columns if 'email' in c.lower()), None)
    col_name = next((c for c in df.columns if 'billing name' in c.lower()), None) or next((c for c in df.columns if 'student name' in c.lower()), None)
    col_college = "College Name" if "College Name" in df.columns else None
    col_phone = next((c for c in df.columns if 'billing tel' in c.lower()), None)
    col_order = "Order" if "Order" in df.columns else None
    col_tracking = "Tracking" if "Tracking" in df.columns else None
    col_amount = next((c for c in df.columns if 'amount' in c.lower()), None) # Taking first match for amount
    
    if not col_email:
        print("CRITICAL: Email column not found. Columns:", list(df.columns))
        sys.exit(1)

    print(f"Found {len(df)} rows in Excel.")
    
    users_to_process = []
    
    for idx, row in df.iterrows():
        email = str(row.get(col_email, '')).strip().lower()
        if not email or '@' not in email or email == 'nan': continue
        
        # BASIC DATA CLEANING
        name = str(row.get(col_name, 'Unknown')).strip()
        if 'Student Name' in df.columns and pd.notna(row.get('Student Name')):
             name = str(row.get('Student Name')).strip()
             
        college = str(row.get(col_college, 'Unknown')).strip()
        phone = clean_phone(row.get(col_phone, ''))
        
        utr = row.get(col_tracking)
        # Generate dummy UTR if missing (legacy data support)
        if pd.isna(utr) or str(utr).strip() == '':
            utr = f"LEGACY-{uuid.uuid4().hex[:8].upper()}"
        else:
            utr = str(utr).strip()
            
        order_id = str(row.get(col_order, ''))
        
        amount = 0
        if col_amount:
            try:
                amount = float(row.get(col_amount, 0))
            except: 
                amount = 0
                
        user_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "college": college,
            "payment_status": "paid", # Assuming excel list contains confirmed paid users
            "payment_utr": utr,
            "price": str(amount)
        }
        users_to_process.append(user_data)
        
    print(f"Parsed {len(users_to_process)} valid user records (all will be eligible for email).")
    if len(users_to_process) == 0:
        print("CRITICAL: No valid email rows. Check Excel column and data.")
        sys.exit(1)

    # Check DB
    existing_map = fetch_existing_registrations(SUPABASE_KEY)
    
    new_users = []
    existing_ids = []
    already_sent_existing = 0
    pending_existing = 0
    
    for u in users_to_process:
        email = u['email']
        utr = u['payment_utr']
        
        if email in existing_map:
             reg = existing_map[email]
             existing_ids.append(reg['id'])
             if reg.get('ticket_email_sent'):
                 already_sent_existing += 1
             else:
                 pending_existing += 1
        elif utr in existing_map:
             reg = existing_map[utr]
             existing_ids.append(reg['id'])
             if reg.get('ticket_email_sent'):
                 already_sent_existing += 1
             else:
                 pending_existing += 1
        else:
             new_users.append(u)

    print(f"Already in DB: {len(existing_ids)}")
    print(f"New to Import: {len(new_users)}")
    
    if is_dry_run:
        print("\n--- DRY RUN SUMMARY ---")
        print(f"Would import: {len(new_users)} users")
        print(f"Existing already sent (will skip): {already_sent_existing}")
        print(f"Existing pending send: {pending_existing}")
        print(f"Would process tickets for: {len(existing_ids) + len(new_users)} users")
        print("To execute, run with --send")
        # Validation of new users
        if new_users:
            print("Sample new user:", new_users[0])
        sys.exit(0)
        
    # --- EXECUTION ---
    imported_ids = []
    if new_users:
        imported_ids = import_users(new_users)

    if mode_import_only:
        print("\n--- IMPORT ONLY SUMMARY ---")
        print(f"Imported new users: {len(imported_ids)}")
        print(f"Existing users matched from DB: {len(existing_ids)}")
        print(f"Total Excel rows parsed: {len(users_to_process)}")
        print("No tickets were generated and no emails were sent (import-only mode).")
        return
        
    # Dedupe to avoid duplicate sends from repeated rows / overlaps
    all_target_ids = list(dict.fromkeys(existing_ids + imported_ids))
    print(f"Starting ticket processing for {len(all_target_ids)} unique users (capable of sending to all from Excel).")

    if args.start_from < 0:
        print("ERROR: --start-from cannot be negative.")
        sys.exit(1)
    if args.limit is not None and args.limit <= 0:
        print("ERROR: --limit must be > 0.")
        sys.exit(1)

    if not args.yes:
        planned = len(all_target_ids[args.start_from:]) if args.limit is None else min(args.limit, max(0, len(all_target_ids) - args.start_from))
        confirm = input(f"Type 'SEND {planned}' to confirm sending: ").strip()
        if confirm != f"SEND {planned}":
            print("Aborted by user.")
            sys.exit(0)

    res = process_tickets(all_target_ids, is_dry_run=False, max_to_send=args.limit, start_from=args.start_from)
    print("\nFinal Results:", res)

if __name__ == "__main__":
    main()
