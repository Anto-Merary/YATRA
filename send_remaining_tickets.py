"""
YATRA 2026 - Send Remaining Tickets (Updated for Resend)
========================================================
Sends tickets to all registered users who have PAID but do NOT have a ticket sent yet.
Handles both:
1. Users who have a ticket but email failed (Resend).
2. Users who don't have a ticket yet (Create & Send).

Batching: 50 emails per batch (safer), 2 minute pause
"""

import os
import sys
import time
import smtplib
import uuid
import random
import string
import hmac
import hashlib
import io
import requests
import qrcode
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv

load_dotenv()

# Configuration
# UPDATED CREDENTIALS
EMAIL_USER = "tickets3.yatra@ritchennai.edu.in"
EMAIL_PASS = "qgxw gzgj tild fcyx"
FROM_EMAIL = EMAIL_USER
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
QR_SECRET = os.getenv("QR_SIGNING_SECRET")

EVENT_DATES = "FEB 13 AND 14"
EVENT_VENUE = "Rajalakshmi Institute of Technology"

# Lower batch size to be safer for final run
BATCH_SIZE = 50
PAUSE_SEQUENCE = 2 * 60  # 2 minutes

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def sign_token(ticket_id, secret):
    msg = ticket_id.encode('utf-8')
    key = secret.encode('utf-8')
    sig = hmac.new(key, msg, hashlib.sha256).hexdigest()
    return f"{ticket_id}.{sig}"

def generate_qr_bytes(qr_token):
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def get_email_content(reg_data, ticket_code):
    college = reg_data.get('college', 'N/A')
    name = reg_data.get('name', 'N/A')
    
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
        <h3 style="margin:5px 0 0;font-size:18px;font-weight:900;text-transform:uppercase;">{name}</h3>
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
Get ready to step into a Korean-inspired cultural experience filled with energy, performances, lights, and moments you won't forget.

🎟️ Your pass is attached — keep it ready for entry.
📱 Bring your ID. Come charged. Come ready.

This isn't just a fest.
It's a vibe.
See you inside.

Team Yatra 2026
Raja Lakshmi Institutions of Technology

--------------------------------
YOUR TICKET DETAILS
--------------------------------
NAME: {name}
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

def send_email_with_qr(to_email, subject, html, text, qr_bytes):
    msg = MIMEMultipart('related')
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email

    msg_alt = MIMEMultipart('alternative')
    msg.attach(msg_alt)

    msg_alt.attach(MIMEText(text, 'plain'))
    msg_alt.attach(MIMEText(html, 'html'))

    qr_image = MIMEImage(qr_bytes, _subtype='png')
    qr_image.add_header('Content-ID', '<qrcode>')
    qr_image.add_header('Content-Disposition', 'inline', filename='ticket_qr.png')
    msg.attach(qr_image)

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        return True, None
    except Exception as e:
        return False, str(e)

def generate_unique_ticket_code(headers):
    # Check uniqueness against DB directly to be safer
    for _ in range(10):
        code = ''.join(random.choices(string.digits, k=6))
        r = requests.get(f"{SUPABASE_URL}/rest/v1/tickets?code_6_digit=eq.{code}&select=id", headers=headers)
        if r.status_code == 200 and not r.json():
            return code
    return ''.join(random.choices(string.digits, k=6)) # Fallback

def main():
    print("YATRA 2026 - SEND REMAINING TICKETS (RESEND MODE)")
    print("=================================================")
    
    headers = get_supabase_headers()
    
    # 1. Fetch Registrations (Paid)
    print("Fetching ALL registrations...")
    all_regs = []
    offset = 0
    while True:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/registrations?select=id,email,name,college,phone,price,payment_status,ticket_email_sent&offset={offset}&limit=1000", headers=headers)
        if r.status_code != 200: sys.exit(f"Error: {r.text}")
        data = r.json()
        if not data: break
        all_regs.extend(data)
        if len(data) < 1000: break
        offset += 1000
        print(f"  Fetched {len(all_regs)} regs...")

    # 2. Fetch Tickets
    print("Fetching ALL tickets...")
    all_tickets = []
    offset = 0
    while True:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/tickets?select=id,registration_id,code_6_digit,qr_token&offset={offset}&limit=1000", headers=headers)
        if r.status_code != 200: sys.exit(f"Error: {r.text}")
        data = r.json()
        if not data: break
        all_tickets.extend(data)
        if len(data) < 1000: break
        offset += 1000
        print(f"  Fetched {len(all_tickets)} tickets...")

    # Create Ticket Map (Reg ID -> Ticket Data)
    ticket_map = {t['registration_id']: t for t in all_tickets}

    # 3. Filter Targets
    targets = []
    for reg in all_regs:
        if reg.get('payment_status') != 'paid': continue
        
        # KEY CHANGE: Target if email NOT sent
        if reg.get('ticket_email_sent') is True: continue
        
        # If no email, skip
        if not reg.get('email'): continue
        
        targets.append(reg)
        
    print(f"\nFound {len(targets)} pending users (Paid but Email Not Sent).")
    
    if len(targets) == 0:
        print("No pending tickets found. Exiting.")
        sys.exit(0)
        
    if "--auto" in sys.argv:
        print(f"Auto-confirming batch of {len(targets)}...")
    else:
        confirm = input(f"Type 'SEND {len(targets)}' to start sending: ").strip()
        if confirm != f"SEND {len(targets)}":
            print("Aborted.")
            sys.exit(0)

    # 4. Process
    success_count = 0
    fail_count = 0
    
    print("\nStarting batch send...")
    
    for idx, reg in enumerate(targets):
        try:
            email = reg['email'].strip().lower()
            reg_id = reg['id']
            
            # Rate limiting / Batching
            if idx > 0 and idx % BATCH_SIZE == 0:
                print(f"\n⏸️  BATCH COMPLETE. Pausing {PAUSE_SEQUENCE//60} minutes...")
                for i in range(PAUSE_SEQUENCE, 0, -60):
                     print(f"  ⏳ {i//60} min remaining...", end='\r')
                     time.sleep(60)
                print("\nResuming...")
            
            # Check for existing ticket
            existing_ticket = ticket_map.get(reg_id)
            
            if existing_ticket:
                # USE EXISTING TICKET
                print(f"[{idx+1}] Found existing ticket for {email}. Resending...")
                ticket_id = existing_ticket['id']
                qr_token = existing_ticket['qr_token']
                code_6_digit = existing_ticket['code_6_digit']
                
                # If qr_token is missing, regenerate?
                if not qr_token:
                    print(f"  ⚠️ Missing QR Token for existing ticket. Regenerating...")
                    qr_token = sign_token(ticket_id, QR_SECRET)
                    # Update DB
                    requests.patch(f"{SUPABASE_URL}/rest/v1/tickets?id=eq.{ticket_id}", headers=headers, json={"qr_token": qr_token})
            else:
                # CREATE NEW TICKET
                print(f"[{idx+1}] Creating NEW ticket for {email}...")
                ticket_id = str(uuid.uuid4())
                qr_token = sign_token(ticket_id, QR_SECRET)
                code_6_digit = generate_unique_ticket_code(headers)
                
                new_ticket = {
                    "id": ticket_id,
                    "registration_id": reg_id,
                    "email": email,
                    "name": reg.get('name'),
                    "college": reg.get('college'),
                    "phone": reg.get('phone'),
                    "code_6_digit": code_6_digit,
                    "qr_token": qr_token,
                    "qr_payload": qr_token,
                    "ticket_status": "valid",
                    "status": "active",
                    "ticket_type": "Student Pass",
                    "price": reg.get('price'),
                    "is_rit_student": "rit" in str(reg.get('college','')).lower()
                }
                
                r = requests.post(f"{SUPABASE_URL}/rest/v1/tickets", headers=headers, json=new_ticket)
                if r.status_code != 201:
                    print(f"  ❌ Failed to create ticket: {r.text}")
                    fail_count += 1
                    continue
                
            # Generate Email
            qr_bytes = generate_qr_bytes(qr_token)
            html, text = get_email_content(reg, code_6_digit)
            
            # Send Email
            ok, err = send_email_with_qr(email, f"YATRA 2026 // ENTRY PASS [{code_6_digit}]", html, text, qr_bytes)
            
            if ok:
                print(f"  ✅ SENT to {email}")
                success_count += 1
                
                # Mark Sent
                requests.patch(
                    f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}", 
                    headers=headers, 
                    json={"ticket_email_sent": True, "ticket_generated": True, "ticket_sent_at": datetime.utcnow().isoformat()}
                )
                
                # Log Event
                requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                    "registration_id": reg_id, "ticket_id": ticket_id, "to_email": email, "status": "sent", "source": "resend_script"
                })
            else:
                print(f"  ❌ SMTP FAILED to {email}: {err}")
                fail_count += 1
                # Log Event
                requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                    "registration_id": reg_id, "ticket_id": ticket_id, "to_email": email, "status": "failed", "error_text": str(err), "source": "resend_script"
                })
                
            time.sleep(0.5)
            
        except Exception as e:
            print(f"[{idx+1}] ❌ Exception for {reg.get('email')}: {e}")
            fail_count += 1

    print("\n" + "="*50)
    print("COMPLETED")
    print(f"Sent: {success_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    main()
