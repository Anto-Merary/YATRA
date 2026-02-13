"""
YATRA 2026 - Manual Fix & Resend
================================
Resends tickets to specific users.
CRITICAL: Regenerates the QR token (HMAC signature) to ensure it works with the scanner.
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

TARGET_EMAILS = [
    "aakash.240001@cse.ritchennai.edu.in",
    "gn224029@gmail.com",
    "Javagalnath.v.2023.cce@ritchennai.edu.in",
    "karan.s.2024.aids@rajalakshmi.edu.in",
    "lingeshram.240070@vlsi.ritchennai.edu.in"
]

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

def get_email_content(name, college, ticket_code):
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

def main():
    print("YATRA 2026 - MANUAL FIX & RESEND")
    print("================================")
    
    headers = get_supabase_headers()
    
    for email in TARGET_EMAILS:
        email = email.lower().strip()
        print(f"\nProcessing {email}...")
        
        # 1. Fetch Ticket
        # Use ilike to handle case sensitivity (e.g. Javagalnath vs javagalnath)
        r = requests.get(f"{SUPABASE_URL}/rest/v1/tickets?email=ilike.{email}&select=*", headers=headers)
        tickets = r.json()
        
        if not tickets:
             print(f"  ❌ No ticket found in DB for {email}. Skipping.")
             continue
            
        ticket = tickets[0]
        ticket_id = ticket['id']
        name = ticket['name'] or "Guest"
        college = ticket['college'] or "N/A"
        code_6_digit = ticket['code_6_digit']
        
        print(f"  - Found ticket: {code_6_digit} (ID: {ticket_id})")
        
        # 2. Regenerate QR Token (CRITICAL FIX)
        # We re-sign the ticket_id with the current secret to ensure it is valid
        new_qr_token = sign_token(ticket_id, QR_SECRET)
        
        if new_qr_token != ticket.get('qr_token'):
            print("  - QR Token mismatched/updated. Updating DB...")
            requests.patch(f"{SUPABASE_URL}/rest/v1/tickets?id=eq.{ticket_id}", 
                           headers=headers, json={"qr_token": new_qr_token})
        else:
            print("  - QR Token verified (matches current secret).")
            
        # 3. Generate QR Image
        qr_bytes = generate_qr_bytes(new_qr_token)
        
        # 4. Send Email
        html, text = get_email_content(name, college, code_6_digit)
        print("  - Sending email...")
        ok, err = send_email_with_qr(email, f"YATRA 2026 // ENTRY PASS [{code_6_digit}]", html, text, qr_bytes)
        
        if ok:
            print(f"  ✅ SENT to {email}")
            
            # Log Event
            requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "ticket_id": ticket_id, "to_email": email, "status": "sent", "source": "manual_fix_script"
            })
        else:
            print(f"  ❌ FAILED to send: {err}")

    print("\nDONE.")

if __name__ == "__main__":
    main()
