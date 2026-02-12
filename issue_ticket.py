"""
YATRA 2026 - Production Ticket Issuer
=====================================
Single source of truth for issuing tickets.
Handles:
1. Token Generation (UUID + HMAC-SHA256) -> MATCHES EDGE FUNCTION
2. QR Code Generation (from signed token)
3. Ticket Creation in DB (if not exists)
4. Email Sending (via Gmail SMTP)

Usage:
    python issue_ticket.py <email>              # Issue/Resend to specific email
    python issue_ticket.py --batch --limit 10   # Issue to next 10 pending paid registrations
    python issue_ticket.py --fix-dates          # Update valid_days for all tickets
"""

import os
import sys
import hmac
import hashlib
import qrcode
import smtplib
import argparse
from io import BytesIO
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv
from supabase import create_client, Client

# Force load .env file
load_dotenv()

# Configuration
# TODO: UPDATE THESE DATES BEFORE PRODUCTION RUN
VALID_DAYS = ["2026-03-14", "2026-03-15"] 

def get_env(key, required=True):
    val = os.getenv(key)
    if not val and required:
        print(f"CRITICAL ERROR: Missing {key} in .env")
        sys.exit(1)
    return val

# Production Secrets
SUPABASE_URL = get_env("VITE_SUPABASE_URL")
SUPABASE_KEY = get_env("SUPABASE_SERVICE_KEY") # Must be SERVICE_ROLE key
QR_SECRET = get_env("QR_SIGNING_SECRET")
EMAIL_USER = get_env("EMAIL_USER")
EMAIL_PASS = get_env("EMAIL_PASS")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_signed_token(ticket_id: str) -> str:
    """
    Generate HMAC-SHA256 signed token.
    Format: ticket_uuid.hex_signature
    """
    signature = hmac.new(
        QR_SECRET.encode('utf-8'),
        ticket_id.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"{ticket_id}.{signature}"

def generate_qr_image(token: str) -> bytes:
    """Generate QR code PNG bytes from token."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

def send_email(to_email: str, name: str, code_6_digit: str, qr_bytes: bytes) -> bool:
    """Send ticket email via SMTP."""
    msg = MIMEMultipart("related")
    msg["Subject"] = f"Your YATRA 2026 Ticket [{code_6_digit}]"
    msg["From"] = f"YATRA 2026 <{EMAIL_USER}>"
    msg["To"] = to_email

    # HTML Body (Brutalist Design)
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Courier New', monospace; background: #fff; color: #000; margin: 0; padding: 0;">
      <div style="background: #000; color: #fff; padding: 20px;">
        <h1 style="margin:0; font-size: 36px;">YATRA 2026</h1>
        <p style="margin:5px 0 0; color: #f0f;">OFFICIAL ENTRY PASS</p>
      </div>
      <div style="padding: 20px; border: 4px solid #000; margin: 20px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase;">ATTENDEE</p>
        <h2 style="margin: 0 0 20px; font-size: 24px;">{name}</h2>
        
        <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
          <p style="color: #ccc; font-size: 10px; letter-spacing: 2px;">ENTRY CODE</p>
          <div style="font-size: 48px; font-weight: bold; letter-spacing: 5px; margin: 10px 0;">{code_6_digit}</div>
          
          <div style="background: #fff; padding: 10px; display: inline-block; margin-top: 20px;">
            <img src="cid:qrcode" width="200" height="200" alt="QR Code" style="display: block;" />
          </div>
          <p style="color: #888; font-size: 10px; margin-top: 10px;">SCAN THIS AT THE GATE</p>
        </div>
        
        <div style="margin-top: 20px; font-size: 12px; line-height: 1.5;">
          <p><strong>DATES:</strong> March 14-15, 2026</p>
          <p><strong>VENUE:</strong> Rajalakshmi Institute of Technology</p>
          <p>Bring a valid college ID card.</p>
        </div>
      </div>
    </body>
    </html>
    """

    msg_alt = MIMEMultipart("alternative")
    msg.attach(msg_alt)
    msg_alt.attach(MIMEText(f"Your YATRA Ticket Code: {code_6_digit}", "plain"))
    msg_alt.attach(MIMEText(html, "html"))

    img = MIMEImage(qr_bytes)
    img.add_header("Content-ID", "<qrcode>")
    msg.attach(img)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False

def process_registration(reg, force=False):
    """Process a single registration."""
    print(f"\nProcessing: {reg['email']} ({reg['name']})")

    # 1. Check/Create Ticket
    tickets = supabase.table("tickets").select("*").eq("registration_id", reg['id']).execute().data
    
    ticket_id = None
    ticket_code = None
    
    if tickets:
        ticket = tickets[0]
        ticket_id = ticket['id']
        ticket_code = ticket['code_6_digit']
        print(f"  Existing ticket found: {ticket_code}")
        
        # Check if ticket needs update (missing token or wrong dates)
        updates = {}
        if not ticket.get('qr_token'):
            print("  ⚠️ Ticket missing QR token - Generating...")
            updates['qr_token'] = generate_signed_token(ticket_id)
        
        if ticket.get('valid_days') != VALID_DAYS:
            print(f"  ⚠️ Ticket has wrong dates ({ticket.get('valid_days')}) - Fixing...")
            updates['valid_days'] = VALID_DAYS
            
        if updates:
            supabase.table("tickets").update(updates).eq("id", ticket_id).execute()
            print("  Updated ticket record.")
            # Refresh ticket data
            ticket.update(updates)

        qr_token = ticket.get('qr_token') or updates.get('qr_token')

    else:
        # Create New Ticket
        import random
        ticket_code = str(random.randint(100000, 999999))
        
        # Generate UUID locally (or let DB do it, but we need it for signing)
        # We'll use uuid.uuid4 to generate ID client-side to sign it immediately
        import uuid
        ticket_id = str(uuid.uuid4())
        qr_token = generate_signed_token(ticket_id)
        
        data = {
            "id": ticket_id,
            "registration_id": reg['id'],
            "email": reg['email'],
            "name": reg['name'],
            "college": reg.get('college'),
            "phone": reg.get('phone'),
            "code_6_digit": ticket_code,
            "qr_token": qr_token,
            "category": 1,
            "valid_days": VALID_DAYS,
            "status": "active",
            "is_rit_student": False # Logic for this?
        }
        
        try:
            supabase.table("tickets").insert(data).execute()
            print(f"  Created new ticket: {ticket_code}")
        except Exception as e:
            print(f"  ❌ Failed to insert ticket: {e}")
            return

    # 2. Check if already sent
    if reg.get('ticket_email_sent') and not force:
        print("  Skipping: Email already sent (use --force or specific email to override)")
        return

    # 3. Generate QR and Send Email
    qr_bytes = generate_qr_image(qr_token)
    if send_email(reg['email'], reg['name'], ticket_code, qr_bytes):
        # 4. Mark as sent
        supabase.table("tickets").update({"ticket_email_sent": True, "ticket_sent_at": datetime.utcnow().isoformat()}).eq("id", ticket_id).execute()
        supabase.table("registrations").update({"ticket_email_sent": True, "ticket_generated": True, "ticket_sent_at": datetime.utcnow().isoformat()}).eq("id", reg['id']).execute()
        print("  Flags updated in DB.")

def main():
    parser = argparse.ArgumentParser(description="YATRA Ticket Issuer")
    parser.add_argument("email", nargs="?", help="Specific email to process")
    parser.add_argument("--batch", action="store_true", help="Process pending batch")
    parser.add_argument("--limit", type=int, default=5, help="Batch limit")
    parser.add_argument("--force", action="store_true", help="Resend even if sent")
    args = parser.parse_args()

    print(f"--- YATRA 2026 TICKET ISSUER ---")
    print(f"Dates configured: {VALID_DAYS}")
    
    if args.email:
        # Single mode
        res = supabase.table("registrations").select("*").eq("email", args.email).execute()
        if not res.data:
            print("Registration not found.")
            return
        process_registration(res.data[0], force=True) # Always force for explicit email
    
    elif args.batch:
        # Batch mode
        print(f"Fetching pending paid registrations (Limit: {args.limit})...")
        res = supabase.table("registrations").select("*")\
            .eq("payment_status", "paid")\
            .eq("ticket_email_sent", False)\
            .limit(args.limit)\
            .execute()
        
        if not res.data:
            print("No pending registrations found.")
            return
            
        print(f"Found {len(res.data)} pending.")
        for reg in res.data:
            process_registration(reg, force=args.force)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
