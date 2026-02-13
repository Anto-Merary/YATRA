import tkinter as tk
from tkinter import messagebox, ttk
import os
import sys
import uuid
import random
import string
import hmac
import hashlib
import io
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import qrcode
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv
import threading

# Load Environment Variables
load_dotenv()

# Configuration
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

class OnSpotApp:
    def __init__(self, root):
        self.root = root
        self.root.title("YATRA 2026 - On-Spot Registration")
        self.root.geometry("500x650")
        self.root.configure(bg="#f0f0f0")

        # Styles
        style = ttk.Style()
        style.configure("TLabel", font=("Helvetica", 11))
        style.configure("TButton", font=("Helvetica", 12, "bold"), padding=10)

        # Header
        header = tk.Label(root, text="On-Spot Registration", font=("Helvetica", 18, "bold"), bg="#f0f0f0", fg="#333")
        header.pack(pady=20)

        # Form Frame
        form_frame = tk.Frame(root, bg="#f0f0f0")
        form_frame.pack(pady=10, padx=40, fill="x")

        # Name
        self.add_field(form_frame, "Name:", "name_entry")
        
        # Email
        self.add_field(form_frame, "Email:", "email_entry")

        # Phone
        self.add_field(form_frame, "Phone:", "phone_entry")

        # College
        self.add_field(form_frame, "College:", "college_entry")

        # Amount
        self.add_field(form_frame, "Amount Paid (₹):", "amount_entry")
        self.entries["amount_entry"].insert(0, "300")

        # Payment Mode
        tk.Label(form_frame, text="Payment Mode:", bg="#f0f0f0", anchor="w").pack(fill="x", pady=(10, 0))
        self.payment_mode = ttk.Combobox(form_frame, values=["Cash", "UPI", "Other"], state="readonly")
        self.payment_mode.current(0)
        self.payment_mode.pack(fill="x", pady=5)

        # Submit Button
        self.submit_btn = tk.Button(root, text="REGISTER & SEND TICKET", command=self.start_processing, 
                                    bg="#007bff", fg="white", font=("Helvetica", 12, "bold"), relief="flat", height=2)
        self.submit_btn.pack(pady=30, padx=40, fill="x")

        # Status Label
        self.status_label = tk.Label(root, text="Ready", bg="#f0f0f0", fg="#666")
        self.status_label.pack(side="bottom", pady=10)

        # Initialize Session with Retry Logic
        self.setup_session()

    def add_field(self, parent, label_text, entry_name):
        if not hasattr(self, "entries"):
            self.entries = {}
        tk.Label(parent, text=label_text, bg="#f0f0f0", anchor="w").pack(fill="x", pady=(10, 0))
        entry = ttk.Entry(parent, font=("Helvetica", 11))
        entry.pack(fill="x", pady=5)
        self.entries[entry_name] = entry

    def get_headers(self):
        return {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def setup_session(self):
        retry_strategy = Retry(
            total=5,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST", "PATCH"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session = requests.Session()
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    def sign_token(self, ticket_id, secret):
        msg = ticket_id.encode('utf-8')
        key = secret.encode('utf-8')
        sig = hmac.new(key, msg, hashlib.sha256).hexdigest()
        return f"{ticket_id}.{sig}"

    def generate_qr_bytes(self, qr_token):
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_token)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def generate_unique_ticket_code(self, headers):
        for _ in range(5):
            code = ''.join(random.choices(string.digits, k=6))
            r = self.session.get(f"{SUPABASE_URL}/rest/v1/tickets?code_6_digit=eq.{code}&select=id", headers=headers, timeout=10)
            if r.status_code == 200 and not r.json():
                return code
        return ''.join(random.choices(string.digits, k=6))

    def get_email_content(self, name, college, ticket_code):
        html = f"""<!DOCTYPE html>
<html>
<head><title>YATRA 2026</title></head>
<body style="margin:0;padding:20px;background:#000;font-family:monospace;color:#fff;">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #333;">
    <div style="padding:40px 20px;text-align:center;border-bottom:2px solid #ff00ff;">
      <h1 style="color:#fff;margin:0;">YATRA 2026</h1>
      <p style="color:#ff00ff;margin:10px 0 0;">OFFICIAL ENTRY PASS</p>
    </div>
    <div style="padding:30px;">
      <h2>Hey {name} 👋</h2>
      <p>Your spot is locked. Payment Received (On-Spot).</p>
      <div style="background:#fff;color:#000;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#666;">UNIQUE ID</p>
        <div style="font-size:32px;font-weight:900;letter-spacing:6px;margin:10px 0;">{ticket_code}</div>
        <img src="cid:qrcode" style="width:200px;height:200px;display:block;margin:0 auto;">
      </div>
    </div>
  </div>
</body>
</html>"""
        text = f"YATRA 2026 PASS\nName: {name}\nCode: {ticket_code}\nVenue: {EVENT_VENUE}"
        return html, text

    def send_email(self, to_email, subject, html, text, qr_bytes):
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
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

    def start_processing(self):
        # Disable button
        self.submit_btn.config(state="disabled", text="Processing...")
        
        # Run in thread to not freeze GUI
        threading.Thread(target=self.process_registration, daemon=True).start()

    def process_registration(self):
        try:
            name = self.entries["name_entry"].get().strip()
            email = self.entries["email_entry"].get().strip().lower()
            phone = self.entries["phone_entry"].get().strip()
            college = self.entries["college_entry"].get().strip()
            amount = self.entries["amount_entry"].get().strip()
            mode = self.payment_mode.get()

            if not all([name, email, phone, college, amount]):
                raise Exception("All fields are required!")

            self.update_status("Connecting to Database...")
            headers = self.get_headers()

            # 1. Check if email exists
            r = self.session.get(f"{SUPABASE_URL}/rest/v1/registrations?email=eq.{email}&select=id", headers=headers, timeout=10)
            if r.json():
                # Allow update? Or Error? Let's error to be safe, or just pull ID
                reg_id = r.json()[0]['id']
                self.update_status("Email exists. Updating payment status...")
                # Update to paid
                
                # Generate unique UTR
                unique_utr = f"ONSPOT-{mode.upper()}-{uuid.uuid4().hex[:6].upper()}"
                
                self.session.patch(f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}", headers=headers, timeout=10, json={
                    "payment_status": "paid",
                    "payment_confirmed_at": datetime.utcnow().isoformat(),
                    "payment_utr": unique_utr
                })
            else:
                self.update_status("Creating Registration...")
                # Create Registration
                new_reg = {
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "college": college,
                    "payment_status": "paid",
                    # "amount": amount, # ERROR: Column does not exist
                    "price": amount,    # CORRECT: Schema uses 'price'
                    # "source": "on_spot_tool", # ERROR: Column does not exist
                    "payment_confirmed_at": datetime.utcnow().isoformat(),
                    "payment_utr": f"ONSPOT-{mode.upper()}-{uuid.uuid4().hex[:6].upper()}",
                    "ticket_generated": False
                }
                r = self.session.post(f"{SUPABASE_URL}/rest/v1/registrations", headers=headers, json=new_reg, timeout=10)
                if r.status_code != 201:
                    raise Exception(f"Registration Failed: {r.text}")
                
                # Fetch ID
                r = self.session.get(f"{SUPABASE_URL}/rest/v1/registrations?email=eq.{email}&select=id", headers=headers, timeout=10)
                reg_id = r.json()[0]['id']

            # 2. Check/Generate Ticket
            self.update_status("Processing Ticket...")
            
            # Check if ticket already exists for this registration
            r_check_ticket = self.session.get(f"{SUPABASE_URL}/rest/v1/tickets?registration_id=eq.{reg_id}&select=*", headers=headers, timeout=10)
            existing_tickets = r_check_ticket.json()
            
            if existing_tickets:
                self.update_status("Existing Ticket Found. Reusing...")
                ticket = existing_tickets[0]
                ticket_id = ticket['id']
                code = ticket['code_6_digit']
                qr_token = ticket['qr_token']
                
                # If QR token missing, regenerate
                if not qr_token:
                    qr_token = self.sign_token(ticket_id, QR_SECRET)
                    self.session.patch(f"{SUPABASE_URL}/rest/v1/tickets?id=eq.{ticket_id}", headers=headers, json={"qr_token": qr_token}, timeout=10)
            else:
                self.update_status("Generating New Ticket...")
                ticket_id = str(uuid.uuid4())
                qr_token = self.sign_token(ticket_id, QR_SECRET)
                code = self.generate_unique_ticket_code(headers)
            
            
            # Determine Pass Category based on Amount
            try:
                amt_val = float(amount)
                pass_cat = "Combo Pass" if amt_val >= 850 else "Single Day Pass"
            except:
                pass_cat = "Single Day Pass"

            ticket_data = {
                "id": ticket_id,
                "registration_id": reg_id,
                "email": email,
                "name": name,
                "college": college,
                "phone": phone,
                "code_6_digit": code,
                "qr_token": qr_token,
                "qr_payload": qr_token,
                "ticket_status": "valid",
                "status": "active",
                "ticket_type": "On Spot",
                "pass_category": pass_cat,
                "price": amount,
                "is_rit_student": False
            }
            
            
            if not existing_tickets:
                r = self.session.post(f"{SUPABASE_URL}/rest/v1/tickets", headers=headers, json=ticket_data, timeout=10)
                if r.status_code != 201:
                    # Check if ticket already exists? 
                    raise Exception(f"Ticket Creation Failed: {r.text}")

            # 3. Send Email
            self.update_status("Sending Email...")
            qr_bytes = self.generate_qr_bytes(qr_token)
            html, text = self.get_email_content(name, college, code)
            
            self.send_email(email, f"YATRA 2026 // ENTRY PASS [{code}]", html, text, qr_bytes)

            # 4. Mark Sent
            self.session.patch(f"{SUPABASE_URL}/rest/v1/registrations?id=eq.{reg_id}", headers=headers, timeout=10, json={
                "ticket_generated": True,
                "ticket_email_sent": True,
                "ticket_sent_at": datetime.utcnow().isoformat()
            })
            
            # Log Event
            self.session.post(f"{SUPABASE_URL}/rest/v1/ticket_email_events", headers=headers, timeout=10, json={
                "registration_id": reg_id, "ticket_id": ticket_id, "to_email": email, "status": "sent", "source": "on_spot_tool"
            })

            self.update_status("Success!", "green")
            self.root.after(0, lambda: messagebox.showinfo("Success", f"Ticket Sent to {email}\nCode: {code}"))
            self.root.after(0, self.clear_form)

        except Exception as e:
            err_msg = str(e)
            self.update_status(f"Error: {err_msg}", "red")
            self.root.after(0, lambda: messagebox.showerror("Error", err_msg))
        
        finally:
            self.root.after(0, lambda: self.submit_btn.config(state="normal", text="REGISTER & SEND TICKET"))

    def update_status(self, text, color="#666"):
        self.root.after(0, lambda: self.status_label.config(text=text, fg=color))

    def clear_form(self):
        for entry in self.entries.values():
            entry.delete(0, tk.END)
        self.entries["amount_entry"].insert(0, "300")
        self.status_label.config(text="Ready")

if __name__ == "__main__":
    if not SUPABASE_URL or not SUPABASE_KEY:
        messagebox.showerror("Configuration Error", "Missing Supabase Credentials in .env")
        sys.exit(1)
        
    root = tk.Tk()
    app = OnSpotApp(root)
    root.mainloop()
