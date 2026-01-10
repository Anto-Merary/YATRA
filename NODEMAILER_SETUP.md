# Nodemailer-like Email Integration Setup

This guide explains how to set up confirmation emails using Gmail SMTP via Supabase Edge Functions (Nodemailer-like functionality).

## Overview

The email system uses Gmail SMTP to send confirmation emails. It's implemented as a Supabase Edge Function that uses Deno's native TLS capabilities to connect to Gmail's SMTP server, similar to how Nodemailer works in Node.js.

## Prerequisites

1. Gmail account with App Password enabled
2. Supabase project with Edge Functions enabled

## Step 1: Enable Gmail App Password

Since you're using Gmail (`meraryanto@gmail.com`), you need to enable 2-Step Verification and create an App Password:

1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Go to **Security** → **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "YATRA 2026" as the app name
6. Click **Generate**
7. Copy the 16-character app password (format: `xxxx xxxx xxxx xxxx`)

**Important:** Use the App Password, NOT your regular Gmail password.

## Step 2: Configure Supabase Edge Function Secrets

1. Go to your Supabase project dashboard: https://app.supabase.com/project/mnboyuyajxghqbbkdqhi
2. Navigate to: **Edge Functions** → **send-registration-email**
3. Click **Settings** tab
4. Scroll to **Secrets** section
5. Add these secrets:

   **Secret 1:**
   - Name: `EMAIL_USER`
   - Value: `meraryanto@gmail.com` (your Gmail address)

   **Secret 2:**
   - Name: `EMAIL_PASS`
   - Value: `ftdx ipus nbqo acvp` (your Gmail App Password - remove spaces if needed)

   **Secret 3 (Optional):**
   - Name: `FROM_EMAIL`
   - Value: `meraryanto@gmail.com` (defaults to EMAIL_USER if not set)

6. Click **Save** for each secret

## Step 3: Test the Integration

1. Submit a test registration through your form
2. Check the browser console (F12) for:
   - "Attempting to send confirmation email..."
   - "✅ Email sent successfully"
3. Check your email inbox (and spam folder)
4. Check Supabase Dashboard → Edge Functions → Logs for function execution

## How It Works

1. **User submits registration** → Data is saved to Supabase `registrations` table
2. **Frontend calls Edge Function** → After successful registration, the form calls the Edge Function
3. **Edge Function connects to Gmail SMTP** → Uses Deno's TLS to connect to `smtp.gmail.com:465`
4. **SMTP authentication** → Uses AUTH PLAIN with your Gmail credentials
5. **Email sent** → Confirmation email is delivered via Gmail SMTP
6. **User receives email** → Confirmation email with all registration details

## Email Template

The confirmation email includes:
- Beautiful HTML design with YATRA branding
- Registration details (name, email, phone, college, ticket type, price)
- RIT student discount indicator (if applicable)
- Professional footer with contact information

## Troubleshooting

### Error: "SMTP authentication failed"

**Solution:**
- Verify `EMAIL_USER` is your full Gmail address
- Verify `EMAIL_PASS` is your App Password (not regular password)
- Ensure 2-Step Verification is enabled
- Check that App Password was generated correctly

### Error: "Connection refused" or "Connection timeout"

**Solution:**
- Check your internet connection
- Verify Gmail SMTP settings:
  - Host: `smtp.gmail.com`
  - Port: `465` (SSL) or `587` (TLS)
- Check if your network/firewall blocks SMTP connections

### Emails Not Arriving

**Solution:**
1. Check spam/junk folder
2. Check Edge Function logs in Supabase Dashboard
3. Verify email address is correct
4. Check Gmail account for any security alerts

### "EMAIL_USER or EMAIL_PASS not set"

**Solution:**
- Go to Supabase Dashboard → Edge Functions → send-registration-email → Settings → Secrets
- Ensure both `EMAIL_USER` and `EMAIL_PASS` are set
- The function will automatically reload after adding secrets

## Security Notes

- **Never commit** `.env` file with credentials to git
- App Passwords are safer than regular passwords
- Edge Function secrets are encrypted and secure
- The function doesn't require JWT authentication (verify_jwt: false) for simplicity
- Registration data is sent in the request body (only after successful database insert)

## Gmail SMTP Settings

- **SMTP Server:** `smtp.gmail.com`
- **Port:** `465` (SSL) - used in the function
- **Authentication:** Required (AUTH PLAIN)
- **Security:** TLS/SSL encryption

## Alternative: Using Port 587 (TLS)

If port 465 doesn't work, you can modify the Edge Function to use port 587 with STARTTLS. The current implementation uses port 465 with direct TLS connection.

## Cost Considerations

- **Gmail:** Free (up to 500 emails/day for personal accounts)
- **Supabase Edge Functions:** Included in Supabase plan
- For higher volumes, consider Gmail Workspace or a dedicated email service

## Customization

To customize the email template, edit the Edge Function:
1. Go to Supabase Dashboard → Edge Functions → send-registration-email
2. Edit the `emailHtml` and `emailText` variables in the function code
3. Redeploy the function

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify Gmail App Password is correct
3. Test SMTP connection manually (using a mail client)
4. Check Gmail account for security alerts
