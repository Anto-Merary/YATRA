import os
import sys
import time
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
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
EMAIL_USER = "tickets3.yatra@ritchennai.edu.in"
EMAIL_PASS = "qgxw gzgj tild fcyx"
FROM_EMAIL = EMAIL_USER
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
QR_SECRET = os.getenv("QR_SIGNING_SECRET")

EVENT_DATES = "FEB 13 AND 14"
EVENT_VENUE = "Rajalakshmi Institute of Technology"

# New content
EMAIL_SUBJECT = "YATRA 2026 - Official Entry Pass & Event Details"

def get_email_html(name, ticket_code):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
  .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }}
  .header {{ background: #000; color: #fff; padding: 20px; text-align: center; }}
  .content {{ padding: 20px; }}
  .ticket {{ background: #f9f9f9; padding: 15px; border: 1px dashed #333; margin: 20px 0; text-align: center; }}
  .code {{ font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #d6006e; }}
  h2 {{ color: #d6006e; }}
  h3 {{ margin-top: 20px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }}
  ul {{ padding-left: 20px; }}
  li {{ margin-bottom: 10px; }}
  .important {{ color: #d6006e; font-weight: bold; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>YATRA 2026</h1>
    <p>Official Entry Pass</p>
  </div>
  <div class="content">
    <p>Dear {name},</p>
    <p>Warm greetings from Rajalakshmi Institute of Technology!</p>
    <p>We are delighted to invite you to <strong>Yatra 2026</strong>, a vibrant two-day celebration of diversity, culture, and entertainment. Get ready for an unforgettable experience filled with music, dance, and exhilarating performances!</p>

    <div class="ticket">
      <p><strong>YOUR UNIQUE TICKET CODE</strong></p>
      <div class="code">{ticket_code}</div>
      <br>
      <img src="cid:qrcode" alt="QR Code" width="200" height="200">
      <p><small>Scan this QR code at the entrance</small></p>
    </div>

    <h3>Important Notes for Students</h3>
    
    <h4>1. Entry Requirements</h4>
    <ul>
      <li>Students must carry their <strong>ID card with a tag</strong> for entry. Entry will not be permitted without it.</li>
      <li><strong>Bag Policy:</strong> Avoid bringing bags. Only handbags or sling bags are allowed for girls and will be thoroughly checked at the entrance. Possession of prohibited items will result in entry denial.</li>
    </ul>

    <h4>2. Yatra’26 Registration Wristband</h4>
    <ul>
      <li>Students must present payment proof and QR code (sent by the registration team) to collect their wristbands.</li>
      <li>Wristbands must be worn throughout the event. <strong>No wristband = No entry.</strong></li>
      <li><strong>One band per registration:</strong> If a student exits the campus, the wristband will be removed and not replaced.</li>
      <li>Parking of vehicles inside the campus not allowed during the event days.</li>
      <li>You will be restricted to enter other venues apart from the event area.</li>
    </ul>

    <h4>3. Disciplinary Guidelines</h4>
    <ul>
      <li>Possession or consumption of any prohibited or intoxicating substances is strictly forbidden. Violators will be immediately removed from the venue, and strict action will be taken.</li>
      <li>Students are expected to maintain discipline throughout the event. Any act of misconduct will attract a penalty of <strong>INR 10,000 (Ten Thousand)</strong>, along with appropriate disciplinary action, and the same will be duly informed to the Parents.</li>
      <li>Outside food and beverages are strictly prohibited. Food stalls and water facilities will be available inside the venue.</li>
      <li>Once permitted inside, students are not allowed to exit the campus.</li>
    </ul>

    <p><strong>Dress Code:</strong> Students are expected to maintain decent decorum in their attire. Transparent or inappropriate clothing is strictly prohibited, and dress code compliance will be strictly monitored. Non-compliance will result in cancellation of registration, and entry to the campus will not be permitted.</p>

    <p><strong>Entry Timing:</strong> Entry closes at 6:00 PM. Please arrive early to avoid inconvenience.</p>

    <h4>4. Facilities & Conduct</h4>
    <ul>
      <li>Restrooms are available on the ground floors of all blocks (Excluding Green Building).</li>
      <li>Faculty members are requested to remain at their designated venues until the conclusion of the celebrations.</li>
      <li>Only event venues will remain open; all other classrooms will be closed.</li>
      <li>Students are requested to maintain cleanliness by using designated waste bins to keep the campus neat and hygienic.</li>
    </ul>

    <h3>Transportation Details</h3>
    <ul>
      <li><strong>Day 1 (13th February 2026):</strong> All bus routes will operate in the morning and after the event concludes.</li>
      <li><strong>Day 2 (14th February 2026):</strong> Buses will run with a one-hour delay on all routes.</li>
    </ul>
    
    <p>For any updates, visit the <a href="https://transport.ritchennai.edu.in">RIT Transport Website</a>.</p>

    <p>We have dedicated coordinators available to assist you throughout the event. For any clarifications, please reach out to the Help Desk at the Green Building.</p>

    <p>Let’s come together to celebrate culture, creativity, and tradition at Cultural Yatra’26! We look forward to your enthusiastic participation.</p>
    
    <hr>
    <p style="text-align:center; font-size: 12px; color: #666;">
      Team Yatra 2026<br>
      Rajalakshmi Institute of Technology
    </p>
  </div>
</div>
</body>
</html>"""

def get_email_text(name, ticket_code):
    return f"""Dear {name},

Warm greetings from Rajalakshmi Institute of Technology!

We are delighted to invite you to Yatra 2026, a vibrant two-day celebration of diversity, culture, and entertainment. Get ready for an unforgettable experience filled with music, dance, and exhilarating performances!

YOUR UNIQUE TICKET CODE: {ticket_code}
(Please see attached QR code image)

Important Notes for Students
1.      Entry Requirements

·         Students must carry their ID card with a tag for entry. Entry will not be permitted without it.

·         Bag Policy: Avoid bringing bags. Only handbags or sling bags are allowed for girls and will be thoroughly checked at the entrance. Possession of prohibited items will result in entry denial.

2.      Yatra’26 Registration Wristband

·         Students must present payment proof and QR code (sent by the registration team) to collect their wristbands.

·         Wristbands must be worn throughout the event. No wristband = No entry.

·         One band per registration: If a student exits the campus, the wristband will be removed and not replaced.

·         Parking of vehicles inside the campus not allowed during the event days.

·         You will be restricted to enter other venues apart from the event area.

3.      Disciplinary Guidelines

·         Possession or consumption of any prohibited or intoxicating substances is strictly forbidden. Violators will be immediately removed from the venue, and strict action will be taken.

·         Students are expected to maintain discipline throughout the event. Any act of misconduct will attract a penalty of INR 10,000 (Ten Thousand), along with appropriate disciplinary action, and the same will be duly informed to the Parents.

·         Outside food and beverages are strictly prohibited. Food stalls and water facilities will be available inside the venue.

·         Once permitted inside, students are not allowed to exit the campus.

Dress Code: Students are expected to maintain decent decorum in their attire. Transparent or inappropriate clothing is strictly prohibited, and dress code compliance will be strictly monitored. Non-compliance will result in cancellation of registration, and entry to the campus will not be permitted.

Entry Timing: Entry closes at 6:00 PM. Please arrive early to avoid inconvenience.

4.      Facilities & Conduct

·         Restrooms are available on the ground floors of all blocks (Excluding Green Building).

·         Faculty members are requested to remain at their designated venues until the conclusion of the celebrations.

·         Only event venues will remain open; all other classrooms will be closed.

·         Students are requested to maintain cleanliness by using designated waste bins to keep the campus neat and hygienic.

Transportation Details
·         Day 1 (13th February 2026): All bus routes will operate in the morning and after the event concludes.

·         Day 2 (14th February 2026): Buses will run with a one-hour delay on all routes.

For any updates, visit the RIT Transport Website.

We have dedicated coordinators available to assist you throughout the event. For any clarifications, please reach out to the Help Desk at the Green Building.

Let’s come together to celebrate culture, creativity, and tradition at Cultural Yatra’26! We look forward to your enthusiastic participation.

Team Yatra 2026
Rajalakshmi Institute of Technology
"""

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

import smtplib # Import was missing in send function context if not global, but it is global.

def main():
    print("STARTING PERSONAL MAIL TICKET PROCESSING...")
    headers = get_supabase_headers()
    
    # 1. Fetch pending records
    url = f"{SUPABASE_URL}/rest/v1/registration_personal_mail?ticket_sent=is.false&limit=1000"
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        sys.exit(f"Error fetching pending: {r.text}")
        
    pending = r.json()
    print(f"Found {len(pending)} pending records.")
    
    if not pending:
        print("No pending records. Exiting.")
        sys.exit(0)
        
    for i, record in enumerate(pending):
        email = record['email']
        name = record['name']
        print(f"[{i+1}/{len(pending)}] Processing {email}...")
        
        # A. Sync with Registrations
        reg_id = record.get('registration_id')
        
        if not reg_id:
            # Check if exists in registrations
            r = requests.get(f"{SUPABASE_URL}/rest/v1/registrations?email=eq.{email}&select=id", headers=headers)
            existing = r.json()
            
            if existing:
                reg_id = existing[0]['id']
                print(f"  - Found existing registration: {reg_id}")
            else:
                # Create registration
                print("  - Creating new registration...")
                new_reg = {
                    "email": email,
                    "name": name,
                    "phone": record.get('phone'),
                    "college": record.get('college'),
                    "price": record.get('amount'), 
                    "payment_status": "paid"
                } 
                
                r = requests.post(f"{SUPABASE_URL}/rest/v1/registrations", headers=headers, json=new_reg)
                if r.status_code != 201:
                    print(f"  ❌ Failed to create registration: {r.text}")
                    continue
                    
                # Fetch back the ID (or use Prefer: return=representation)
                # If we used return=representation:
                # reg_id = r.json()[0]['id']
                # Retrying with fetch manually to be sure
                r = requests.get(f"{SUPABASE_URL}/rest/v1/registrations?email=eq.{email}&select=id", headers=headers)
                reg_id = r.json()[0]['id']
                
            # Update local record with reg_id
            requests.patch(f"{SUPABASE_URL}/rest/v1/registration_personal_mail?id=eq.{record['id']}", 
                           headers=headers, json={"registration_id": reg_id})

        # B. Check/Create Ticket
        ticket_id = None
        ticket_code = None
        qr_token = None
        
        # Check if ticket exists for this Reg ID
        r = requests.get(f"{SUPABASE_URL}/rest/v1/tickets?registration_id=eq.{reg_id}&select=id,code_6_digit,qr_token", headers=headers)
        existing_tickets = r.json()
        
        if existing_tickets:
            ticket = existing_tickets[0]
            ticket_id = ticket['id']
            ticket_code = ticket['code_6_digit']
            qr_token = ticket['qr_token']
            print(f"  - Found existing ticket: {ticket_code}")
        else:
            # Create Ticket
            print(f"  - Creating new ticket...")
            ticket_id = str(uuid.uuid4())
            qr_token = sign_token(ticket_id, QR_SECRET)
            # Generate code
            ticket_code = ''.join(random.choices(string.digits, k=6))
            
            new_ticket = {
                "id": ticket_id,
                "registration_id": reg_id,
                "email": email,
                "name": name,
                "college": record.get('college'),
                "phone": record.get('phone'),
                "code_6_digit": ticket_code,
                "qr_token": qr_token,
                "qr_payload": qr_token,
                "ticket_status": "valid",
                "status": "active",
                "ticket_type": "Student Pass",
                "price": record.get('amount'),
                "is_rit_student": "rit" in str(record.get('college','')).lower()
            }
            
            r = requests.post(f"{SUPABASE_URL}/rest/v1/tickets", headers=headers, json=new_ticket)
            if r.status_code != 201:
                print(f"  ❌ Failed to create ticket: {r.text}")
                continue
                
        # Update local record with ticket_id
        requests.patch(f"{SUPABASE_URL}/rest/v1/registration_personal_mail?id=eq.{record['id']}", 
                       headers=headers, json={"ticket_id": ticket_id})
                       
        # C. Send Email
        qr_bytes = generate_qr_bytes(qr_token)
        html = get_email_html(name, ticket_code)
        text = get_email_text(name, ticket_code)
        
        print(f"  - Sending email to {email}...")
        ok, err = send_email_with_qr(email, EMAIL_SUBJECT, html, text, qr_bytes)
        
        if ok:
            print(f"  ✅ Email SENT.")
            requests.patch(f"{SUPABASE_URL}/rest/v1/registration_personal_mail?id=eq.{record['id']}", 
                           headers=headers, json={"ticket_sent": True})
            
            # Also update main registration flag
            requests.patch(f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}", 
                           headers=headers, 
                           json={"ticket_email_sent": True, "ticket_generated": True, "ticket_sent_at": datetime.utcnow().isoformat()})
                           
            # Log event
            requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "registration_id": reg_id, "ticket_id": ticket_id, "to_email": email, "status": "sent", "source": "personal_mail_script"
            })
        else:
            print(f"  ❌ Email FAILED: {err}")
            requests.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, json={
                "registration_id": reg_id, "ticket_id": ticket_id, "to_email": email, "status": "failed", "error_text": str(err), "source": "personal_mail_script"
            })
            
        # Pause slightly to be nice to SMTP
        time.sleep(0.5)

if __name__ == "__main__":
    main()
