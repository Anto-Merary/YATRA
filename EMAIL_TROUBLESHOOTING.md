# Email Troubleshooting Guide

## Quick Fixes

### 1. Verify Secrets Are Set

Go to Supabase Dashboard → Edge Functions → send-registration-email → Settings → Secrets

**Required Secrets:**
- `EMAIL_USER`: `meraryanto@gmail.com`
- `EMAIL_PASS`: `ftdxipusnbqoacvp` (remove spaces from app password)

### 2. Check Gmail App Password

The password `ftdx ipus nbqo acvp` looks like a Gmail App Password. Make sure:
- ✅ 2-Step Verification is enabled on your Google Account
- ✅ App Password was generated for "Mail" app
- ✅ When adding to Supabase secrets, remove spaces: `ftdxipusnbqoacvp`

### 3. Common Errors

#### Error: "EMAIL_USER and EMAIL_PASS must be set"
**Solution:** Add secrets in Supabase Dashboard → Edge Functions → Settings → Secrets

#### Error: "Authentication failed" or "535"
**Solution:** 
- Verify you're using App Password (not regular password)
- Check that 2-Step Verification is enabled
- Regenerate App Password if needed

#### Error: "Connection refused" or timeout
**Solution:**
- Check internet connection
- Verify Gmail SMTP is accessible: `smtp.gmail.com:465`
- Check firewall settings

### 4. Test the Function Directly

You can test the Edge Function using curl:

```bash
curl -X POST https://mnboyuyajxghqbbkdqhi.supabase.co/functions/v1/send-registration-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "id": "test-123",
    "name": "Test User",
    "email": "your-email@example.com",
    "phone": "9876543210",
    "college": "Test College",
    "ticket_type": "Early Bird",
    "price": "₹750",
    "is_rit_student": false,
    "created_at": "2026-01-10T12:00:00Z"
  }'
```

### 5. Check Logs

1. Go to Supabase Dashboard → Edge Functions → send-registration-email → Logs
2. Look for:
   - Error messages
   - "Attempting to send email from..."
   - "Email sent successfully"
   - Authentication errors

### 6. Verify Gmail Settings

1. Go to https://myaccount.google.com
2. Security → 2-Step Verification (must be enabled)
3. Security → App passwords
4. Verify you have an app password for "Mail"
5. If not, create a new one

## Still Not Working?

Check the browser console (F12) for:
- Network errors
- CORS errors  
- Function call errors
- Response details

The Edge Function now uses a Deno SMTP library which should be more reliable than the raw implementation.
