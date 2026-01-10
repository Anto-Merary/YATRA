# Edge Function Deployment Guide

## Current Status

The `send-registration-email` edge function has been updated locally with improved email automation. The function files are located in:
- `supabase/functions/send-registration-email/index.ts`
- `supabase/functions/send-registration-email/deno.json`

## Deployment Options

### Option 1: Deploy via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/mnboyuyajxghqbbkdqhi
2. Navigate to **Edge Functions** → **send-registration-email**
3. Click **Edit** or **Code Editor**
4. Copy the contents of `supabase/functions/send-registration-email/index.ts`
5. Paste it into the code editor
6. Click **Deploy** or **Save**

### Option 2: Deploy via Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref mnboyuyajxghqbbkdqhi

# Deploy the function
supabase functions deploy send-registration-email
```

### Option 3: Manual Copy-Paste

1. Open `supabase/functions/send-registration-email/index.ts`
2. Copy all the code
3. Go to Supabase Dashboard → Edge Functions → send-registration-email
4. Click **Edit** or use the code editor
5. Replace the existing code with the new code
6. Save/Deploy

## Function Features

The updated edge function includes:

✅ **Gmail SMTP Integration** - Uses Deno SMTP client library  
✅ **Beautiful HTML Email Template** - Professional design with YATRA branding  
✅ **Plain Text Fallback** - Ensures email compatibility  
✅ **Error Handling** - Comprehensive error messages and logging  
✅ **CORS Support** - Allows frontend to call the function  
✅ **Registration Details** - Includes all registration information  
✅ **RIT Student Discount Indicator** - Shows when discount is applied  

## Required Secrets

Make sure these secrets are configured in Supabase Dashboard:

1. **EMAIL_USER**: `meraryanto@gmail.com`
2. **EMAIL_PASS**: Your Gmail App Password (without spaces)
3. **FROM_EMAIL** (optional): `meraryanto@gmail.com`

To set secrets:
1. Go to Edge Functions → send-registration-email → Settings → Secrets
2. Add each secret with its value
3. Click Save

## Testing

After deployment, test the function:

1. Submit a test registration through your form
2. Check browser console for success messages
3. Check Supabase Dashboard → Edge Functions → Logs
4. Verify email is received

## Troubleshooting

If deployment fails:
- Check that all code is copied correctly
- Verify Deno.json imports are correct
- Check Supabase Dashboard logs for errors
- Ensure secrets are properly configured

## Next Steps

1. Deploy the function using one of the methods above
2. Verify secrets are set in Supabase Dashboard
3. Test with a registration submission
4. Monitor logs for any issues
