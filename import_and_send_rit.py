
"""
Import and Send Tickets to RIT Students (Local Version)
=======================================================
1. Reads 'Yatra registered/College mail id till 11th feb 2026.xlsx'.
2. Filters for 'RIT' students AND Amount == 500.
3. Checks if they exist in Supabase 'registrations' table.
4. If not, IMPORTS them.
5. GENERATES Tickets and QR codes locally (mimicking Edge Function).
6. SENDS Emails via local SMTP (mimicking Edge Function) with specific template.

Usage:
    python import_and_send_rit.py              # Dry run (default)
    python import_and_send_rit.py --import     # Import missing users
    python import_and_send_rit.py --send       # Send emails (implies import, generates tickets)
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
import qrcode
import io
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuration
INPUT_FILE = r"Yatra registered\College mail id till 11th feb 2026.xlsx"
TARGET_COLLEGE = "RIT"
EXCLUDE_KEYWORD = "ALUMI"

# SMTP Config
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@yatra2026.com")

if not EMAIL_USER or not EMAIL_PASS:
    print("WARNING: EMAIL_USER or EMAIL_PASS not set. Emails will fail.")

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
QR_SECRET = os.getenv("QR_SIGNING_SECRET", "yatra-2026-qr-secret-default")

# Column Mapping
COLUMN_MAP = {
    "Tracking": "payment_utr",
    "Order": "payment_id", 
    "Billing Email": "email",
    "Student Name": "name",
    "College Name": "college",
    "Billing Tel": "phone",
    "Amount": "amount",
}

def clean_phone(p):
    s = str(p).strip().replace(' ', '').replace('-', '').replace('+91', '')
    if len(s) > 10: return s[-10:]
    return s

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

# --- Cryptography & QR ---
def sign_token(ticket_id, secret):
    """HMAC-SHA256 signing of ticket ID."""
    msg = ticket_id.encode('utf-8')
    key = secret.encode('utf-8')
    sig = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return f"{ticket_id}.{sig}"

def generate_qr_base64(qr_token):
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

# --- Email Templates ---
def get_email_content(reg_data, ticket_code, qr_base64):
    college = reg_data.get('college', 'N/A')
    date_string = "FEB 13 AND 14"
    
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
        <p style="margin:0;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;">COLLEGE NAME</p>
        <h3 style="margin:5px 0 0;font-size:18px;font-weight:900;text-transform:uppercase;">{college}</h3>
      </div>
      <div style="text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:2px;">UNIQUE 6 DIGIT ID</p>
        <div style="background:#000;color:#fff;display:inline-block;padding:10px 30px;font-size:32px;font-weight:900;letter-spacing:6px;margin-bottom:20px;">
          {ticket_code}
        </div>
        <div style="display:block;margin:0 auto;width:200px;height:200px;background:#fff;padding:10px;border:2px solid #000;">
          <img src="{qr_base64}" alt="QR CODE" style="width:100%;height:100%;display:block;">
        </div>
        <p style="margin:10px 0 0;font-size:10px;color:#888;">SCAN FOR ENTRY</p>
      </div>
      <div style="display:flex;justify-content:space-between;border-top:2px dashed #000;padding-top:20px;">
        <div style="text-align:left;">
          <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">DATES</p>
          <p style="margin:5px 0 0;font-size:14px;font-weight:900;">{date_string}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">VENUE</p>
          <p style="margin:5px 0 0;font-size:14px;font-weight:700;">Rajalakshmi Institute<br>of Technology</p>
        </div>
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
        <li>Bags are NOT allowed (including slim bags).</li>
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
UNIQUE ID: {ticket_code}
DATES: {date_string}
VENUE: Rajalakshmi Institute of Technology

--------------------------------
RULES AND REGULATIONS
--------------------------------
1. College ID is a MUST.
2. No outside food or beverages allowed.
3. No ordering of food allowed inside campus.
4. Do NOT delete this email.
5. Maintain discipline inside the campus.
6. Bags are NOT allowed (including slim bags).
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
        params = {"select": "id,email,payment_utr,payment_status"} # minimal select
        try:
            r = requests.get(url, headers=headers, params=params)
            if r.status_code != 200:
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
            r = requests.post(url, headers=headers, json=chunk)
            if r.status_code == 201:
                data = r.json()
                print(f"  Imported batch {i//chunk_size + 1}: {len(data)} rows")
                inserted_ids.extend([d['id'] for d in data])
            else:
                print(f"  Failed batch {i//chunk_size + 1}: {r.status_code}")
        except Exception as e:
            print(f"  Exception importing: {e}")
    return inserted_ids

def process_tickets_local(reg_ids):
    headers = get_supabase_headers()
    
    success_count = 0
    skipped_count = 0
    fail_count = 0
    
    print(f"Processing {len(reg_ids)} tickets locally...")
    
    for idx, reg_id in enumerate(reg_ids):
        # 1. Fetch full reg details
        r = requests.get(f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}&select=*", headers=headers)
        if r.status_code != 200 or not r.json():
            print(f"  [{idx+1}] Reg not found: {reg_id}")
            fail_count += 1
            continue
        
        reg = r.json()[0]
        email = reg.get('email')
        
        # 2. Check overlap
        if reg.get('ticket_email_sent'):
            print(f"  [{idx+1}] Skipped {email} (already sent)")
            skipped_count += 1
            continue
            
        # 3. Get or Create Ticket
        # Check existing
        r_ticket = requests.get(f"{SUPABASE_URL}/rest/v1/tickets?registration_id=eq.{reg_id}&select=*", headers=headers)
        ticket = None
        if r_ticket.status_code == 200 and r_ticket.json():
            ticket = r_ticket.json()[0]
            
        if not ticket:
            # Create new
            ticket_code = ''.join(random.choices(string.digits, k=6)) # simple random for now
            ticket_id = str(uuid.uuid4())
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
                "qr_payload": qr_token,
                "ticket_status": "valid",
                "status": "active",
                "ticket_type": "Institution Student Pass",
                "amount": reg.get('amount'),
                "is_rit_student": True
            }
            
            r_create = requests.post(f"{SUPABASE_URL}/rest/v1/tickets", headers=headers, json=new_ticket)
            if r_create.status_code != 201:
                print(f"  [{idx+1}] Failed to create ticket for {email}: {r_create.text}")
                fail_count += 1
                continue
            ticket = new_ticket
            
        # 4. Generate Email
        qr_base64 = generate_qr_base64(ticket['qr_token'])
        html, text = get_email_content(reg, ticket['code_6_digit'], qr_base64)
        
        # 5. Send Email
        if send_email_smtp(email, f"YATRA 2026 // ENTRY PASS [{ticket['code_6_digit']}]", html, text):
            # 6. Mark as sent
            requests.patch(f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}", headers=headers, json={
                "ticket_email_sent": True,
                "ticket_generated": True,
                "ticket_sent_at": datetime.utcnow().isoformat()
            })
            # Log event
            requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "registration_id": reg_id,
                "ticket_id": ticket['id'],
                "to_email": email,
                "status": "sent"
            })
            print(f"  [{idx+1}] Sent to {email}")
            success_count += 1
        else:
            fail_count += 1
            # Log failure
            requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "registration_id": reg_id,
                "ticket_id": ticket['id'],
                "to_email": email,
                "status": "failed",
                "error_text": "SMTP Error"
            })
            
    return {"issued": success_count, "skipped": skipped_count, "failed": fail_count}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--import_data", action="store_true", help="Execute imports")
    parser.add_argument("--send", action="store_true", help="Execute sending (implies import)")
    args = parser.parse_args()
    
    print(f"Reading {INPUT_FILE}...")
    try:
        df = pd.read_excel(INPUT_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        sys.exit(1)
        
    # --- FILTERING ---
    print("Filtering data...")
    print(f"Total Rows: {len(df)}")
    # 1. College RIT
    col_college = "College Name" # we know this
    df.columns = [c.strip() for c in df.columns] 
    print(f"Columns: {df.columns.tolist()}")
    
    mask_rit = df[col_college].fillna('').astype(str).str.contains(TARGET_COLLEGE, case=False)
    mask_alumni = df[col_college].fillna('').astype(str).str.contains(EXCLUDE_KEYWORD, case=False)
    
    print(f"Rows with RIT: {mask_rit.sum()}")
    print(f"Rows with Alumni: {mask_alumni.sum()}")
    
    # 2. Amount == 500
    col_amount = "Amount" # Found in check_amount.py
    if col_amount not in df.columns:
         for c in df.columns:
             if 'amount' in c.lower():
                 col_amount = c
                 break
    print(f"Using Amount Col: {col_amount}")
    
    df[col_amount] = pd.to_numeric(df[col_amount], errors='coerce')
    mask_amount = df[col_amount] == 500
    print(f"Rows with Amount=500: {mask_amount.sum()}")
    
    # Combine
    target_df = df[mask_rit & (~mask_alumni) & mask_amount].copy()
    
    print(f"Found {len(target_df)} valid RIT student records (Amount=500).")
    
    if target_df.empty:
        sys.exit(0)

    # Prepare Data
    users_to_process = []
    for idx, row in target_df.iterrows():
        # simplified extraction
        email = str(row.get('Billing Email', '')).strip().lower()
        if not email or '@' not in email: continue
        
        name = str(row.get('Billing Name', 'Unknown')).strip() # or Student Name
        if 'Student Name' in df.columns:
            name = str(row.get('Student Name', name)).strip()
            
        phone = clean_phone(row.get('Billing Tel', ''))
        college = str(row.get(col_college, 'RIT')).strip()
        
        # Payment ID / UTR
        utr = row.get('Tracking') # or payment_utr
        if pd.isna(utr): utr = f"YATRA-{uuid.uuid4().hex[:8].upper()}"
        
        user_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "college": college,
            "payment_status": "paid",
            "payment_utr": str(utr),
            "payment_id": str(row.get('Order', '')),
            "amount": 500,
            "is_rit_student": True
        }
        users_to_process.append(user_data)

    print(f"Prepared {len(users_to_process)} records for processing.")
    
    # Check DB
    existing_map = fetch_existing_registrations(SUPABASE_KEY)
    
    new_users = []
    existing_ids = []
    
    for u in users_to_process:
        email = u['email']
        utr = u['payment_utr']
        
        if email in existing_map:
             existing_ids.append(existing_map[email]['id'])
        elif utr in existing_map:
             existing_ids.append(existing_map[utr]['id'])
        else:
             new_users.append(u)
             
    print(f"Existing in DB: {len(existing_ids)}")
    print(f"New to Import: {len(new_users)}")
    
    # Import
    imported_ids = []
    if new_users:
        if args.import_data or args.send:
            imported_ids = import_users(new_users)
        else:
            print(f"[DRY RUN] Would import {len(new_users)} users.")
            
    # Send
    all_target_ids = existing_ids + imported_ids
    if args.send:
        # Check SMTP first
        if not EMAIL_USER or not EMAIL_PASS:
            print("ERROR: SMTP credentials missing. Cannot send.")
            sys.exit(1)
            
        print(f"Sending tickets to {len(all_target_ids)} users...")
        confirm = input("Type 'yes' to confirm sending emails: ")
        if confirm.lower() == 'yes':
             res = process_tickets_local(all_target_ids)
             print("\nFinal Results:", res)
        else:
             print("Aborted.")
    else:
        print(f"[DRY RUN] Would send tickets to {len(all_target_ids)} users.")

if __name__ == "__main__":
    main()
