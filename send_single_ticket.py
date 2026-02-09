"""
YATRA 2026 - Direct Ticket Email for Single User
Sends a ticket email with QR code as inline attachment.
"""

import os
import sys
import smtplib
import random
import qrcode
from io import BytesIO
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def generate_qr_bytes(payload: str) -> bytes:
    """Generate QR code and return as PNG bytes."""
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def send_ticket_email(to_email: str, name: str, ticket_code: str, qr_png_bytes: bytes):
    """Send ticket email via Gmail SMTP with QR as inline attachment."""
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    from_email = os.getenv("FROM_EMAIL", email_user)
    
    if not email_user or not email_pass:
        print("WARNING: EMAIL_USER or EMAIL_PASS not set in .env")
        print("Email would be sent to:", to_email)
        print("Ticket code:", ticket_code)
        return False
    
    # HTML with CID reference to inline image - BRUTALIST DESIGN
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Courier New', Courier, monospace; line-height: 1.4; color: #000000; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
      
      <!-- HEADER -->
      <div style="background: #000000; padding: 30px 25px; text-align: left; border-bottom: 6px solid #9b1799;">
        <h1 style="color: #ffffff; margin: 0; font-size: 42px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase;">YATRA</h1>
        <div style="color: #9b1799; margin: 5px 0 0 0; font-size: 20px; font-weight: 900; letter-spacing: 6px;">2026</div>
        <div style="color: #666666; margin: 12px 0 0 0; font-size: 10px; letter-spacing: 3px; text-transform: uppercase;">ENTRY PASS // RIT CHENNAI</div>
      </div>
      
      <!-- STATUS BANNER -->
      <div style="background: #00ff00; padding: 12px 25px; border-bottom: 3px solid #000000;">
        <span style="font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #000000;">✓ TICKET CONFIRMED</span>
      </div>
      
      <!-- CONTENT -->
      <div style="background: #ffffff; padding: 25px; border: 3px solid #000000; border-top: none;">
        
        <!-- ATTENDEE -->
        <div style="margin-bottom: 25px;">
          <div style="font-size: 10px; letter-spacing: 2px; color: #666666; text-transform: uppercase; margin-bottom: 6px;">ATTENDEE</div>
          <div style="font-size: 24px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -1px;">{name}</div>
        </div>
        
        <!-- TICKET SECTION -->
        <div style="background: #000000; padding: 20px; margin: 20px 0;">
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 10px; letter-spacing: 3px; color: #666666; text-transform: uppercase; margin-bottom: 6px;">ENTRY CODE</div>
            <div style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace;">{ticket_code}</div>
          </div>
          
          <div style="text-align: center; padding: 15px; background: #ffffff; border: 3px solid #9b1799;">
            <img src="cid:qrcode" alt="QR" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />
          </div>
          
          <div style="text-align: center; margin-top: 12px;">
            <span style="font-size: 10px; letter-spacing: 2px; color: #888888; text-transform: uppercase;">SCAN AT ENTRANCE</span>
          </div>
        </div>
        
        <!-- WARNING -->
        <div style="border: 3px solid #9b1799; background: #ffff00; padding: 12px; text-align: center;">
          <div style="font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #000000; text-transform: uppercase;">
            ⚠ VALID ID REQUIRED FOR ENTRY
          </div>
        </div>
        
      </div>
      
      <!-- FOOTER -->
      <div style="background: #000000; padding: 15px 25px; border-top: 6px solid #9b1799;">
        <div style="font-size: 9px; letter-spacing: 2px; color: #666666; text-transform: uppercase; margin-bottom: 4px;">VENUE</div>
        <div style="font-size: 12px; font-weight: 700; color: #ffffff; margin-bottom: 10px;">RAJALAKSHMI INSTITUTE OF TECHNOLOGY</div>
        <div style="font-size: 9px; color: #444444; letter-spacing: 1px;">YATRA 2026 // AUTOMATED NOTIFICATION</div>
      </div>
      
    </body>
    </html>
    """
    
    # Create multipart/related message for inline images
    msg = MIMEMultipart("related")
    msg["Subject"] = f"Your YATRA 2026 Ticket [{ticket_code}]"
    msg["From"] = f"YATRA 2026 <{from_email}>"
    msg["To"] = to_email
    
    # Create alternative part for text/html
    msg_alt = MIMEMultipart("alternative")
    msg.attach(msg_alt)
    
    # Plain text version
    text_part = MIMEText(f"Your YATRA 2026 Entry Ticket\n\nTicket Code: {ticket_code}\n\nPlease show this code and the attached QR at the entrance.\n\nVenue: Rajalakshmi Institute of Technology\nNote: Please carry a valid ID card.", "plain")
    msg_alt.attach(text_part)
    
    # HTML version
    html_part = MIMEText(html_body, "html")
    msg_alt.attach(html_part)
    
    # Attach QR code as inline image with Content-ID
    qr_image = MIMEImage(qr_png_bytes, _subtype="png")
    qr_image.add_header("Content-ID", "<qrcode>")
    qr_image.add_header("Content-Disposition", "inline", filename="ticket_qr.png")
    msg.attach(qr_image)
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(email_user, email_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        print(f"Email sent successfully to {to_email}!")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def main():
    from supabase import create_client
    
    target_email = sys.argv[1] if len(sys.argv) > 1 else "meraryanto@gmail.com"
    force_resend = "--force" in sys.argv
    
    # Get Supabase credentials
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        print("Error: Missing Supabase credentials")
        sys.exit(1)
    
    client = create_client(url, key)
    
    print(f"\n{'='*50}")
    print(f"Sending ticket to: {target_email}")
    print(f"{'='*50}")
    
    # Find registration
    result = client.table("registrations").select("*").eq("email", target_email).limit(1).execute()
    
    if not result.data or len(result.data) == 0:
        print(f"No registration found for {target_email}")
        sys.exit(1)
    
    reg = result.data[0]
    reg_id = reg["id"]
    
    print(f"Found: {reg['name']} ({reg.get('college', 'N/A')})")
    print(f"Payment Status: {reg.get('payment_status', 'unknown')}")
    print(f"Already Sent: {reg.get('ticket_email_sent', False)}")
    
    if reg.get('ticket_email_sent') and not force_resend:
        print("\nTicket already sent! Use --force to resend.")
        resend = input("Resend anyway? (y/N): ").strip().lower()
        if resend != 'y':
            print("Aborted.")
            sys.exit(0)
    
    # Check/create ticket
    ticket_result = client.table("tickets").select("*").eq("registration_id", reg_id).limit(1).execute()
    
    if ticket_result.data and len(ticket_result.data) > 0:
        ticket = ticket_result.data[0]
        ticket_code = ticket["code_6_digit"]
        print(f"Existing ticket code: {ticket_code}")
    else:
        # Generate new ticket
        ticket_code = str(random.randint(100000, 999999))
        ticket_id = os.urandom(16).hex()
        
        client.table("tickets").insert({
            "id": ticket_id,
            "registration_id": reg_id,
            "email": target_email,
            "name": reg["name"],
            "college": reg.get("college"),
            "code_6_digit": ticket_code,
            "qr_payload": reg_id,
            "ticket_status": "valid"
        }).execute()
        print(f"Created new ticket: {ticket_code}")
    
    # Generate QR as bytes
    qr_payload = reg_id  # QR contains the registration UUID
    qr_bytes = generate_qr_bytes(qr_payload)
    print(f"Generated QR code ({len(qr_bytes)} bytes)")
    
    # Send email
    success = send_ticket_email(target_email, reg["name"], ticket_code, qr_bytes)
    
    if success:
        # Update registration
        client.table("registrations").update({
            "ticket_generated": True,
            "ticket_email_sent": True,
            "ticket_sent_at": datetime.utcnow().isoformat()
        }).eq("id", reg_id).execute()
        print("\nRegistration updated - ticket marked as sent!")
    
    print(f"\n{'='*50}")
    print("Done!")


if __name__ == "__main__":
    main()
