import os
import io
import qrcode
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv


load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL") or EMAIL_USER or "noreply@yatra2026.com"

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

TEST_EMAIL = "m.andrewdominic9b@gmail.com"


def require_env() -> None:
    if not EMAIL_USER or not EMAIL_PASS:
        raise SystemExit("ERROR: Missing EMAIL_USER or EMAIL_PASS in .env")


def generate_qr_png_bytes(payload: str) -> bytes:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def send_test_email() -> None:
    qr_payload = "YATRA-TEST-" + TEST_EMAIL
    qr_bytes = generate_qr_png_bytes(qr_payload)

    subject = "YATRA 2026 // TEST ENTRY PASS"

    text_body = f"""YATRA 2026 - TEST EMAIL
========================

This is a test ticket email.

To: {TEST_EMAIL}
QR payload: {qr_payload}

If you can see the QR in the HTML version, the system is ready.
"""

    html_body = f"""<!DOCTYPE html>
<html>
  <body style="margin:0;padding:20px;background:#f5f5f5;font-family:'Courier New',monospace;">
    <div style="max-width:600px;margin:0 auto;">
      <p style="margin:0 0 8px 0;font-size:14px;color:#111;">Hey,</p>
      <p style="margin:0 0 8px 0;font-size:14px;color:#333;">
        This is a <strong>YATRA 2026</strong> test email sent from <strong>{FROM_EMAIL}</strong>.
      </p>
      <p style="margin:0 0 12px 0;font-size:14px;color:#333;">
        Below is a test QR. If you can see it clearly, the production emails will show their QR correctly.
      </p>

      <div style="background:#000;border-radius:4px 4px 0 0;padding:20px 18px 16px 18px;border-bottom:3px solid #9b1799;">
        <h1 style="margin:0;font-size:24px;color:#fff;letter-spacing:3px;text-transform:uppercase;">YATRA 2026</h1>
        <div style="margin-top:6px;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;">
          Test Ticket Email
        </div>
      </div>

      <div style="background:#fff;border:1px solid #000;border-top:none;border-radius:0 0 4px 4px;padding:18px 16px 20px 16px;">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:11px;letter-spacing:2px;color:#777;text-transform:uppercase;margin-bottom:6px;">
            Test QR Code
          </div>
          <img src="cid:qrcode" alt="QR" style="width:200px;height:200px;display:block;margin:0 auto;" />
          <div style="margin-top:8px;font-size:11px;color:#777;">Payload: {qr_payload}</div>
        </div>
      </div>
    </div>
  </body>
</html>
"""

    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = TEST_EMAIL

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text_body, "plain"))
    alt.attach(MIMEText(html_body, "html"))
    msg.attach(alt)

    img_part = MIMEImage(qr_bytes, _subtype="png")
    img_part.add_header("Content-ID", "<qrcode>")
    img_part.add_header("Content-Disposition", "inline", filename="qrcode.png")
    msg.attach(img_part)

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(FROM_EMAIL, TEST_EMAIL, msg.as_string())

    print(f"Sent test email with QR from {FROM_EMAIL} to {TEST_EMAIL}")


def main():
    require_env()
    send_test_email()


if __name__ == "__main__":
    main()

