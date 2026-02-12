import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import QRCode from "https://esm.sh/qrcode@1.5.1";
// Get email credentials from environment variables (Supabase secrets)
const EMAIL_USER = Deno.env.get("EMAIL_USER");
const EMAIL_PASS = Deno.env.get("EMAIL_PASS");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || EMAIL_USER || "noreply@yatra2026.com";

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

    try {
      // Check if ticket already exists for this registration
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id, code_6_digit, qr_payload')
        .eq('registration_id', registration.id)
        .maybeSingle();

      if (existingTicket) {
        // Ticket already exists, use existing code
        ticketCode = existingTicket.code_6_digit;
        ticketUuid = existingTicket.id;
        ticketId = existingTicket.id;

        // Regenerate QR code URL
        qrPayloadForRender = existingTicket.qr_payload || existingTicket.id;
        qrDataUrl = await QRCode.toDataURL(qrPayloadForRender, { width: 250, margin: 1 });
        ticketGenerated = true;
        console.log(`Using existing ticket code ${ticketCode} for registration ${registration.id}`);
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

        // Create QR payload
        const qrPayload = JSON.stringify({
          id: ticketId,       // ticket_uuid
          code: ticketCode     // six_digit_code
        });

        // Generate QR code URL using public API (more reliable for emails than base64)
        qrPayloadForRender = qrPayload;
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
            qr_payload: qrPayload,
            ticket_status: 'valid'
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

    // Prepare email content:
    // 1) Plain acknowledgement as normal email text
    // 2) Ticket card below, in a clean brutalist block
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>YATRA 2026 // ENTRY PASS</title>
        </head>
        <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Courier New',Courier,monospace;color:#000000;">
          
          <!-- OUTSIDE NORMAL EMAIL MESSAGE -->
          <div style="max-width:600px;margin:0 auto;padding:24px 16px 8px 16px;background:#f5f5f5;">
            <p style="margin:0 0 8px 0;font-size:14px;color:#111;">Hey ${registration.name || ""},</p>
            <p style="margin:0 0 8px 0;font-size:14px;color:#333;">
              Your registration for <strong>YATRA 2026</strong> is confirmed.
            </p>
            <p style="margin:0 0 8px 0;font-size:14px;color:#333;">
              Below is your official entry pass with QR code and unique ID.
            </p>
          </div>

          <!-- TICKET CARD -->
          <div style="max-width:600px;margin:8px auto 24px auto;padding:0 16px 24px 16px;background:#f5f5f5;">
            <div style="background:#000000;border-radius:4px 4px 0 0;padding:32px 24px 28px 24px;text-align:left;border-bottom:4px solid #9b1799;">
              <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">YATRA 2026</h1>
              <div style="color:#9b1799;margin:6px 0 0 0;font-size:17px;font-weight:900;letter-spacing:6px;text-transform:uppercase;">ENTRY PASS</div>
              <div style="color:#777777;margin:14px 0 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">RIT CHENNAI // CULTURAL FEST</div>
            </div>

            <div style="background:#ffffff;border:1px solid #000000;border-top:none;border-radius:0 0 4px 4px;padding:24px 20px 20px 20px;">
              <!-- SMALL CONFIRM STRIP -->
              <div style="background:#00ff00;padding:8px 12px;margin:0 0 18px 0;border:1px solid #000000;text-align:center;">
                <span style="font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#000;">✓ Registration Confirmed</span>
              </div>

              <!-- ATTENDEE INFO -->
              <div style="margin-bottom:18px;">
                <div style="font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;margin-bottom:4px;">Attendee</div>
                <div style="font-size:20px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:0.5px;word-break:break-word;">
                  ${registration.name}
                </div>
              </div>

              <!-- GRID -->
              <div style="border:2px solid #000;margin-bottom:20px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr style="border-bottom:2px solid #000;">
                    <td style="padding:10px 12px;font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;width:32%;border-right:2px solid #000;">Email</td>
                    <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#000;word-break:break-all;">${registration.email}</td>
                  </tr>
                  <tr style="border-bottom:2px solid #000;">
                    <td style="padding:10px 12px;font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;border-right:2px solid #000;">Phone</td>
                    <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#000;">${registration.phone}</td>
                  </tr>
                  <tr style="border-bottom:2px solid #000;">
                    <td style="padding:10px 12px;font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;border-right:2px solid #000;">College</td>
                    <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#000;">${registration.college}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;font-size:10px;letter-spacing:2px;color:#666;text-transform:uppercase;border-right:2px solid #000;">Pass / Amount</td>
                    <td style="padding:10px 12px;font-size:13px;font-weight:900;color:#000;text-transform:uppercase;">
                      ${(registration.ticket_type || "GENERAL")} &nbsp;•&nbsp; ${registration.price || "—"}
                    </td>
                  </tr>
                </table>
              </div>

              ${registration.is_rit_student ? `
              <div style="background:#000;color:#00ff00;padding:8px 10px;margin-bottom:18px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-align:center;">
                ▸ RIT Student – Internal Pass Configuration Applied
              </div>
              ` : ''}

              ${ticketGenerated ? `
              <!-- TICKET STRIP -->
              <div style="background:#000;padding:18px 14px;margin:0 0 16px 0;">
                <div style="font-size:10px;letter-spacing:3px;color:#777;text-transform:uppercase;text-align:center;margin-bottom:6px;">Unique 6 Digit ID</div>
                <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#fff;font-family:'Courier New',monospace;text-align:center;">
                  ${ticketCode}
                </div>
              </div>

              <!-- QR BLOCK -->
              <div style="background:#fff;border:2px solid #9b1799;padding:14px 10px;text-align:center;margin-bottom:8px;">
                <img src="cid:qrcode" alt="QR" style="width:200px;height:200px;display:block;margin:0 auto;" />
              </div>
              <div style="text-align:center;margin-bottom:18px;">
                <span style="font-size:10px;letter-spacing:2px;color:#777;text-transform:uppercase;">Show this QR at the gate</span>
              </div>
              ` : ''}

              <!-- EVENT INFO -->
              <div style="display:flex;justify-content:space-between;border-top:2px dashed #000;padding-top:12px;margin-top:8px;">
                <div>
                  <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">Dates</p>
                  <p style="margin:4px 0 0 0;font-size:13px;font-weight:900;">FEB 13 &amp; 14</p>
                </div>
                <div style="text-align:right;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">Venue</p>
                  <p style="margin:4px 0 0 0;font-size:13px;font-weight:700;">Rajalakshmi Institute<br/>of Technology</p>
                </div>
              </div>
            </div>

            <!-- RULES -->
            <div style="background:#111;color:#ccc;font-size:12px;padding:18px 18px 16px 18px;border-radius:4px;margin-top:10px;">
              <h4 style="margin:0 0 10px 0;color:#fff;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:6px;font-size:11px;letter-spacing:1px;">
                Rules &amp; Regulations
              </h4>
              <ol style="margin:0;padding-left:18px;line-height:1.6;">
                <li>College ID is a must.</li>
                <li>No outside food or beverages allowed.</li>
                <li>No ordering of food allowed inside campus.</li>
                <li>Do not delete this email.</li>
                <li>Maintain discipline inside the campus.</li>
                <li>Bags are not allowed (including slim bags).</li>
                <li>Entries not allowed after 5:00 PM.</li>
              </ol>
            </div>

            <!-- FOOTER -->
            <div style="text-align:center;margin-top:12px;font-size:10px;color:#666;">
              YATRA 2026 • Automated Ticket System • RIT Chennai
            </div>
          </div>

        </body>
      </html>
    `;

    const emailText = `
═══════════════════════════════════════════════════
YATRA 2026 // ENTRY PASS
═══════════════════════════════════════════════════

✓ REGISTRATION CONFIRMED

ATTENDEE: ${registration.name.toUpperCase()}

───────────────────────────────────────────────────
DETAILS
───────────────────────────────────────────────────
EMAIL     : ${registration.email}
PHONE     : ${registration.phone}
COLLEGE   : ${registration.college}
PASS TYPE : ${registration.ticket_type || "GENERAL"}
AMOUNT    : ${registration.price || "—"}
${registration.is_rit_student ? "STATUS    : ▸ RIT STUDENT DISCOUNT APPLIED\n" : ""}
${ticketGenerated ? `
═══════════════════════════════════════════════════
ENTRY CODE
═══════════════════════════════════════════════════

>>> ${ticketCode} <<<

SCAN QR CODE AT ENTRANCE

⚠ VALID ID REQUIRED FOR ENTRY
` : ''}
───────────────────────────────────────────────────
VENUE: RAJALAKSHMI INSTITUTE OF TECHNOLOGY
───────────────────────────────────────────────────
YATRA 2026 // AUTOMATED NOTIFICATION
    `.trim();

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
