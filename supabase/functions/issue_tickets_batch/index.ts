import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import QRCode from "https://esm.sh/qrcode@1.5.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// SMTP Configuration
const EMAIL_USER = Deno.env.get("EMAIL_USER");
const EMAIL_PASS = Deno.env.get("EMAIL_PASS");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@yatra2026.com";

// Helper: Send Email via SMTP (Reused logic)
async function sendEmailViaSMTP(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log("SMTP not configured. Mocking email send to:", to);
    return;
  }

  try {
    const hostname = "smtp.gmail.com";
    const port = 465;
    const conn = await Deno.connectTls({ hostname, port });
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const write = async (cmd: string) => await conn.write(encoder.encode(cmd + "\r\n"));
    const read = async () => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : null;
    };

    // Handshake
    await read(); // Greeting
    await write("EHLO localhost"); await read();
    await write("AUTH LOGIN"); await read();
    await write(btoa(EMAIL_USER)); await read();
    await write(btoa(EMAIL_PASS)); 
    const authRes = await read();
    if (!authRes?.includes("235")) throw new Error(`SMTP Auth failed: ${authRes}`);

    await write(`MAIL FROM:<${FROM_EMAIL}>`); await read();
    await write(`RCPT TO:<${to}>`); await read();
    await write("DATA"); await read();

    const boundary = "----=_Part_" + Date.now().toString();
    const message = [
      `From: YATRA 2026 <${FROM_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      text,
      "",
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      "",
      html,
      "",
      `--${boundary}--`,
      "."
    ].join("\r\n");

    await write(message);
    await read(); // Queue success
    await write("QUIT");
    conn.close();
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    // 1. Validation
    const { registration_ids, issued_by_admin_email } = await req.json()

    if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
      throw new Error('registration_ids array is required')
    }
    if (!issued_by_admin_email) {
      throw new Error('issued_by_admin_email is required')
    }

    const uniqueIds = [...new Set(registration_ids)];
    console.log(`Processing ${uniqueIds.length} tickets. Issuer: ${issued_by_admin_email}`);

    // Init Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const results = {
      success: true,
      issued_count: 0,
      skipped_count: 0,
      failed: [] as any[]
    };

    // 2. Process Loop
    for (const regId of uniqueIds) {
      try {
        // A. Fetch Registration
        const { data: reg, error: fetchError } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', regId)
          .single();

        if (fetchError || !reg) {
          throw new Error(`Registration not found: ${fetchError?.message}`);
        }

        // B. Idempotency Check
        if (reg.ticket_email_sent) {
          console.log(`Skipping ${reg.email} - already sent`);
          results.skipped_count++;
          continue;
        }

        // C. Generate Unique 6-Digit Code
        let ticketCode = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
          // Generate 6-digit number
          ticketCode = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Check uniqueness
          const { data: existing } = await supabase
            .from('tickets')
            .select('id')
            .eq('six_digit_code', ticketCode)
            .maybeSingle();
            
          if (!existing) isUnique = true;
          attempts++;
        }

        if (!isUnique) throw new Error("Failed to generate unique ticket code");

        // D. Generate Ticket UUID and QR Payload
        const ticketId = crypto.randomUUID(); // Generate UUID upfront

        const qrPayload = JSON.stringify({
          uid: ticketId,       // ticket_uuid
          rid: regId,          // registration_id
          code: ticketCode     // six_digit_code
        });
        
        const qrDataUrl = await QRCode.toDataURL(qrPayload);

        // E. Insert Ticket (Atomic-ish)
        const { error: insertError } = await supabase
          .from('tickets')
          .insert({
            id: ticketId, // Explicitly set the ID
            registration_id: reg.id,
            email: reg.email,
            name: reg.name,
            college: reg.college,
            six_digit_code: ticketCode,
            qr_payload: qrPayload,
            ticket_status: 'valid'
          });

        if (insertError) throw new Error(`Ticket insert failed: ${insertError.message}`);

        // F. Send Email
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <div style="background: #4f46e5; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">YATRA 2026</h1>
              <p style="color: #e0e7ff; margin: 8px 0 0;">Your Entry Ticket</p>
            </div>
            <div style="padding: 24px; background: white;">
              <p>Hello <strong>${reg.name}</strong>,</p>
              <p>Your registration for YATRA 2026 is confirmed! Here is your ticket.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">ENTRY CODE</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827;">${ticketCode}</div>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <img src="${qrDataUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px;" />
                <p style="color: #6b7280; font-size: 12px; margin-top: 8px;">Scan at the entrance</p>
              </div>

              <p style="color: #4b5563; font-size: 14px;">
                <strong>Venue:</strong> Rajalakshmi Institute of Technology<br/>
                <strong>Note:</strong> Please carry a valid ID card along with this ticket.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
              Sent by YATRA 2026 Admin Team
            </div>
          </div>
        `;

        await sendEmailViaSMTP(
          reg.email,
          `Your YATRA 2026 Ticket [${ticketCode}]`,
          emailHtml,
          `Your Ticket Code: ${ticketCode}`
        );

        // G. Update Registration (Final State)
        const { error: updateError } = await supabase
          .from('registrations')
          .update({
            ticket_generated: true,
            ticket_email_sent: true,
            ticket_sent_at: new Date().toISOString()
          })
          .eq('id', regId);

        if (updateError) {
          console.error(`Failed to update registration status for ${regId}`, updateError);
          // Don't fail the batch, but log it. The ticket was sent.
        }

        results.issued_count++;
        console.log(`Issued ticket ${ticketCode} to ${reg.email}`);

      } catch (itemError) {
        console.error(`Failed for ${regId}:`, itemError);
        results.failed.push({ registration_id: regId, reason: itemError.message });
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
