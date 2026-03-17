import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import QRCode from "https://esm.sh/qrcode@1.5.1";
// Get email credentials from environment variables (Supabase secrets)
// Get email credentials from environment variables (Supabase secrets)
// OVERRIDE: User requested tickets3 account matching Python tool
const EMAIL_USER = "tickets3.yatra@ritchennai.edu.in";
const EMAIL_PASS = "qgxw gzgj tild fcyx";
const FROM_EMAIL = EMAIL_USER;
const QR_SECRET = "yatra-2026-production-secret-key-do-not-share"; // From local .env match

interface RegistrationData {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  ticket_type: string | null;
  price: string | null;
  is_rit_student: boolean | null;
  created_at: string;
}

// Native SMTP implementation using Deno's built-in TLS
type SmtpSendResult = {
  greeting: string;
  ehlo: string;
  authLogin: string;
  authUser: string;
  authPass: string;
  mailFrom: string;
  rcptTo: string;
  data: string;
  messageAccepted: string;
};

// HMAC-SHA256 Signing Logic matching Python's hmac.new(key, msg, digestmod=hashlib.sha256).hexdigest()
async function signToken(ticketId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(ticketId);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return `${ticketId}.${hashHex}`;
}

function extractBase64FromPngDataUrl(dataUrl: string): string {
  const prefix = "data:image/png;base64,";
  if (!dataUrl.startsWith(prefix)) {
    throw new Error("QR data URL is not PNG base64");
  }
  return dataUrl.slice(prefix.length);
}

function wrapBase64(base64: string): string {
  return base64.match(/.{1,76}/g)?.join("\r\n") ?? base64;
}


async function sendEmailViaSMTP(to: string, subject: string, html: string, text: string, qrDataUrl?: string): Promise<SmtpSendResult> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS not configured");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Connect to Gmail SMTP with TLS
  const conn = await Deno.connectTls({
    hostname: "smtp.gmail.com",
    port: 465,
  });

  try {
    const buffer = new Uint8Array(4096);
    const result: SmtpSendResult = {
      greeting: "",
      ehlo: "",
      authLogin: "",
      authUser: "",
      authPass: "",
      mailFrom: "",
      rcptTo: "",
      data: "",
      messageAccepted: "",
    };

    // Read server greeting
    let n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    let response = decoder.decode(buffer.subarray(0, n));
    result.greeting = response;
    if (!response.startsWith("220")) {
      throw new Error(`SMTP greeting failed: ${response}`);
    }

    // Send EHLO
    await conn.write(encoder.encode("EHLO localhost\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.ehlo = response;
    if (!response.startsWith("250")) {
      throw new Error(`EHLO failed: ${response}`);
    }

    // Send AUTH LOGIN
    await conn.write(encoder.encode("AUTH LOGIN\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.authLogin = response;
    if (!response.startsWith("334")) {
      throw new Error(`AUTH LOGIN failed: ${response}`);
    }

    // Send username (base64)
    const usernameB64 = btoa(EMAIL_USER);
    await conn.write(encoder.encode(usernameB64 + "\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.authUser = response;
    if (!response.startsWith("334")) {
      throw new Error(`Username auth failed: ${response}`);
    }

    // Send password (base64)
    const passwordB64 = btoa(EMAIL_PASS);
    await conn.write(encoder.encode(passwordB64 + "\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.authPass = response;
    if (!response.startsWith("235")) {
      throw new Error(`Authentication failed: ${response}`);
    }

    // Send MAIL FROM
    await conn.write(encoder.encode(`MAIL FROM:<${FROM_EMAIL}>\r\n`));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.mailFrom = response;
    if (!response.startsWith("250")) {
      throw new Error(`MAIL FROM failed: ${response}`);
    }

    // Send RCPT TO
    await conn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.rcptTo = response;
    if (!response.startsWith("250")) {
      throw new Error(`RCPT TO failed: ${response}`);
    }

    // Send DATA
    await conn.write(encoder.encode("DATA\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.data = response;
    if (!response.startsWith("354")) {
      throw new Error(`DATA command failed: ${response}`);
    }

    // Construct email message with nested MIME and inline QR image.
    const relatedBoundary = "----=_Related_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    const altBoundary = "----=_Alt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    const qrBase64 = qrDataUrl ? wrapBase64(extractBase64FromPngDataUrl(qrDataUrl)) : null;

    const messageParts = [
      `From: YATRA 2026 <${FROM_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
      ``,
      `--${relatedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      text,
      ``,
      `--${altBoundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``,
      `--${altBoundary}--`,
      ``,
    ];

    if (qrBase64) {
      messageParts.push(
        `--${relatedBoundary}`,
        `Content-Type: image/png; name="qrcode.png"`,
        `Content-Transfer-Encoding: base64`,
        `Content-ID: <qrcode>`,
        `Content-Disposition: inline; filename="qrcode.png"`,
        ``,
        qrBase64,
        ``
      );
    }

    messageParts.push(`--${relatedBoundary}--`, `.`);
    const message = messageParts.join("\r\n");

    // Send message
    await conn.write(encoder.encode(message + "\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    result.messageAccepted = response;
    if (!response.startsWith("250")) {
      throw new Error(`Message send failed: ${response}`);
    }

    // Send QUIT
    await conn.write(encoder.encode("QUIT\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");

    return result;
  } finally {
    conn.close();
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  let registrationForLog: { id: string; email: string } | null = null;

  try {
    // Parse request body
    const registration: RegistrationData = await req.json();
    registrationForLog = { id: registration.id, email: registration.email };

    // Validate required fields
    if (!registration.email || !registration.name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and name" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check if email credentials are configured
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.log("EMAIL_USER or EMAIL_PASS not set. Email would be sent to:", registration.email);
      console.log("Registration details:", registration);
      return new Response(
        JSON.stringify({
          error: "Email service not configured. Cannot send email.",
          configured: false,
          to: registration.email,
        }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate ticket and QR code
    let ticketCode = '';
    let ticketId = '';
    let qrDataUrl = '';
    let qrPayloadForRender = '';
    let ticketGenerated = false;
    let ticketUuid: string | null = null;
    let qrToken = '';

    try {
      // Check if ticket already exists for this registration
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id, code_6_digit, qr_payload, qr_token')
        .eq('registration_id', registration.id)
        .maybeSingle();

      if (existingTicket) {
        // Ticket already exists, use existing code
        ticketCode = existingTicket.code_6_digit;
        ticketUuid = existingTicket.id;
        ticketId = existingTicket.id;
        qrToken = existingTicket.qr_token || await signToken(ticketId, QR_SECRET);

        // Regenerate QR code URL
        // Match Python: qr.add_data(qr_token)
        qrPayloadForRender = qrToken;
        qrDataUrl = await QRCode.toDataURL(qrPayloadForRender, { width: 250, margin: 1 });
        ticketGenerated = true;
        console.log(`Using existing ticket code ${ticketCode} for registration ${registration.id}`);

        // Update if token was missing
        if (!existingTicket.qr_token) {
          await supabase.from('tickets').update({ qr_token: qrToken }).eq('id', ticketId);
        }

      } else {
        // Generate unique 6-digit code
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          ticketCode = Math.floor(100000 + Math.random() * 900000).toString();

          // Check uniqueness
          const { data: existing } = await supabase
            .from('tickets')
            .select('id')
            .eq('code_6_digit', ticketCode)
            .maybeSingle();

          if (!existing) isUnique = true;
          attempts++;
        }

        if (!isUnique) {
          throw new Error("Failed to generate unique ticket code after 10 attempts");
        }

        // Generate Ticket UUID
        ticketId = crypto.randomUUID();

        // SIGN TOKEN matching Python logic
        qrToken = await signToken(ticketId, QR_SECRET);

        // Create QR payload - Python uses the token itself as payload
        qrPayloadForRender = qrToken;
        qrDataUrl = await QRCode.toDataURL(qrPayloadForRender, { width: 250, margin: 1 });

        // Insert ticket into database
        const { error: insertError } = await supabase
          .from('tickets')
          .insert({
            id: ticketId,
            registration_id: registration.id,
            email: registration.email,
            name: registration.name,
            college: registration.college,
            code_6_digit: ticketCode,
            qr_payload: qrToken, // Python tool sets payload = token
            qr_token: qrToken,
            ticket_status: 'valid',
            ticket_type: registration.ticket_type || 'On Spot',
            pass_category: (parseFloat(registration.price || "0") >= 850) ? "Combo Pass" : "Single Day Pass",
            price: registration.price,
            is_rit_student: registration.is_rit_student || false
          });

        if (insertError) {
          console.error('Failed to insert ticket:', insertError);
          throw new Error(`Ticket creation failed: ${insertError.message}`);
        }

        ticketUuid = ticketId;

        ticketGenerated = true;
        console.log(`Generated ticket ${ticketCode} for registration ${registration.id}`);
      }
    } catch (ticketError) {
      console.error('Ticket generation error:', ticketError);
      console.error('Error details:', JSON.stringify(ticketError, null, 2));
      // Store error for debug response
      // @ts-ignore
      globalThis.ticketDebugError = ticketError;
      // Continue with email send even if ticket generation fails
      // The email will be sent without QR code
    }

    console.log(`Ticket generation status: ${ticketGenerated ? 'SUCCESS' : 'FAILED'}`);
    console.log(`QR Data URL length: ${qrDataUrl ? qrDataUrl.length : 0}`);

    // Capture error for debug response if failed
    const debugError = !ticketGenerated ?
      // @ts-ignore
      (globalThis.ticketDebugError ? (globalThis.ticketDebugError.message || JSON.stringify(globalThis.ticketDebugError)) : "Unknown error")
      : null;

    // Prepare email content matching Python on_spot_tool.py
    const emailHtml = `<!DOCTYPE html>
<html>
<head><title>YATRA 2026</title></head>
<body style="margin:0;padding:20px;background:#000;font-family:monospace;color:#fff;">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #333;">
    <div style="padding:40px 20px;text-align:center;border-bottom:2px solid #ff00ff;">
      <h1 style="color:#fff;margin:0;">YATRA 2026</h1>
      <p style="color:#ff00ff;margin:10px 0 0;">OFFICIAL ENTRY PASS</p>
    </div>
    <div style="padding:30px;">
      <h2>Hey ${registration.name} 👋</h2>
      <p>Your spot is locked. Payment Received (On-Spot).</p>
      <div style="background:#fff;color:#000;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#666;">UNIQUE ID</p>
        <div style="font-size:32px;font-weight:900;letter-spacing:6px;margin:10px 0;">${ticketCode}</div>
        <img src="cid:qrcode" style="width:200px;height:200px;display:block;margin:0 auto;">
      </div>
    </div>
  </div>
</body>
</html>`;

    const emailText = `YATRA 2026 PASS\nName: ${registration.name}\nCode: ${ticketCode}\nVenue: Rajalakshmi Institute of Technology`;


    // Send email using native Deno TLS
    console.log(`Attempting to send email from: ${FROM_EMAIL} to: ${registration.email}`);

    const smtpResult = await sendEmailViaSMTP(
      registration.email,
      "YATRA 2026 - Registration Confirmation",
      emailHtml,
      emailText,
      ticketGenerated ? qrDataUrl : undefined
    );

    console.log("Email sent successfully to:", registration.email);

    // Persist verifiable email state (service role bypasses RLS)
    try {
      await supabase.from('ticket_email_events').insert({
        registration_id: registration.id,
        ticket_id: ticketUuid,
        to_email: registration.email,
        status: 'sent',
        error_text: null,
      });
    } catch (e) {
      console.error('Failed to insert ticket_email_events (sent):', e);
    }

    try {
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          ticket_generated: ticketGenerated,
          ticket_email_sent: true,
          ticket_sent_at: new Date().toISOString(),
        })
        .eq('id', registration.id);
      if (updateError) console.error('Failed to update registration email flags:', updateError);
    } catch (e) {
      console.error('Failed to update registrations email flags:', e);
    }

    return new Response(
      JSON.stringify({
        message: "Confirmation email sent successfully",
        to: registration.email,
        ticket_generated: ticketGenerated,
        smtp: smtpResult,
        debug_error: debugError
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);

    // Best-effort: log failed send attempt
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      if (registrationForLog?.id && registrationForLog?.email) {
        await supabase.from('ticket_email_events').insert({
          registration_id: registrationForLog.id,
          ticket_id: null,
          to_email: registrationForLog.email,
          status: 'failed',
          error_text: error instanceof Error ? error.message : String(error),
        });
      }
    } catch (e) {
      console.error('Failed to log ticket_email_events (failed):', e);
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send confirmation email",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
