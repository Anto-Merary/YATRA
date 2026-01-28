import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
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

async function sendEmailViaSMTP(to: string, subject: string, html: string, text: string): Promise<SmtpSendResult> {
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

    // Construct email message with proper MIME encoding
    const boundary = "----=_Part_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    const message = [
      `From: YATRA 2026 <${FROM_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      text,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``,
      `--${boundary}--`,
      `.`,
    ].join("\r\n");

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
    let ticketGenerated = false;
    let ticketUuid: string | null = null;

    try {
      // Check if ticket already exists for this registration
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id, six_digit_code, qr_payload')
        .eq('registration_id', registration.id)
        .maybeSingle();

      if (existingTicket) {
        // Ticket already exists, use existing code
        ticketCode = existingTicket.six_digit_code;
        ticketUuid = existingTicket.id;
        ticketId = existingTicket.id;
        
        // Regenerate QR code URL
        qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(existingTicket.qr_payload)}`;
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
            .eq('six_digit_code', ticketCode)
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
        qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;

        // Insert ticket into database
        const { error: insertError } = await supabase
          .from('tickets')
          .insert({
            id: ticketId,
            registration_id: registration.id,
            email: registration.email,
            name: registration.name,
            college: registration.college,
            six_digit_code: ticketCode,
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

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>YATRA 2026 Registration Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 2px;">YATRA 2026</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 15px 0 0 0; font-size: 18px; font-weight: 300;">Registration Confirmation</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin-top: 0; font-size: 24px; font-weight: 600;">Hello ${registration.name}!</h2>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 25px;">Thank you for registering for <strong style="color: #667eea;">YATRA 2026</strong> - Rajalakshmi Institute of Technology's Cultural Festival!</p>
            
            <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h3 style="margin-top: 0; color: #333; font-size: 20px; font-weight: 600; margin-bottom: 20px;">Registration Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500; width: 40%;">Name:</td>
                  <td style="padding: 10px 0; color: #333; font-weight: 600;">${registration.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">Email:</td>
                  <td style="padding: 10px 0; color: #333;">${registration.email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">Phone:</td>
                  <td style="padding: 10px 0; color: #333;">${registration.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">College:</td>
                  <td style="padding: 10px 0; color: #333;">${registration.college}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">Ticket Type:</td>
                  <td style="padding: 10px 0; color: #333;">${registration.ticket_type || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">Price:</td>
                  <td style="padding: 10px 0; font-size: 20px; color: #667eea; font-weight: 700;">${registration.price || "N/A"}</td>
                </tr>
                ${registration.is_rit_student ? '<tr><td style="padding: 10px 0; color: #666; font-weight: 500;">Student Status:</td><td style="padding: 10px 0; color: #10b981; font-weight: 600;">✓ RIT Student Discount Applied</td></tr>' : ''}
              </table>
            </div>
            
            ${ticketGenerated ? `
            <div style="background: #f0f9ff; padding: 30px; border-radius: 8px; margin: 30px 0; border: 2px solid #3b82f6; text-align: center;">
              <h3 style="margin-top: 0; color: #1e40af; font-size: 22px; font-weight: 600; margin-bottom: 15px;">🎫 Your Entry Ticket</h3>
              
              <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dbeafe;">
                <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; font-weight: 500;">ENTRY CODE</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #1e40af; margin: 10px 0;">${ticketCode}</div>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <img src="${qrDataUrl}" alt="Ticket QR Code" style="width: 220px; height: 220px; border: 2px solid #3b82f6; border-radius: 8px; padding: 10px; background: white;" />
                <p style="color: #64748b; font-size: 13px; margin-top: 12px; font-weight: 500;">📱 Scan this QR code at the entrance</p>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                  ⚠️ Important: Please carry a valid ID card along with this ticket for entry verification.
                </p>
              </div>
            </div>
            ` : ''}
            
            <p style="margin-top: 30px; font-size: 16px; color: #555;">We're excited to have you join us for this amazing cultural celebration!</p>
            
            <p style="font-size: 16px; color: #555; margin-bottom: 30px;">If you have any questions or need assistance, please don't hesitate to contact us.</p>
            
            <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 14px;">
              <p style="margin: 8px 0; font-weight: 600; color: #333;">Rajalakshmi Institute of Technology</p>
              <p style="margin: 8px 0;">YATRA 2026 Organizing Committee</p>
              <p style="margin: 8px 0; color: #999; font-size: 12px;">This is an automated confirmation email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
YATRA 2026 - Registration Confirmation

Hello ${registration.name}!

Thank you for registering for YATRA 2026 - Rajalakshmi Institute of Technology's Cultural Festival!

Registration Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${registration.name}
Email: ${registration.email}
Phone: ${registration.phone}
College: ${registration.college}
Ticket Type: ${registration.ticket_type || "N/A"}
Price: ${registration.price || "N/A"}
${registration.is_rit_student ? "Student Status: ✓ RIT Student Discount Applied\n" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ticketGenerated ? `
🎫 YOUR ENTRY TICKET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTRY CODE: ${ticketCode}

Please scan the QR code at the entrance or present this code for entry.
Important: Please carry a valid ID card along with this ticket for verification.

` : ''}
We're excited to have you join us for this amazing cultural celebration!

If you have any questions or need assistance, please don't hesitate to contact us.

---
Rajalakshmi Institute of Technology
YATRA 2026 Organizing Committee

This is an automated confirmation email. Please do not reply.
    `.trim();

    // Send email using native Deno TLS
    console.log(`Attempting to send email from: ${FROM_EMAIL} to: ${registration.email}`);

    const smtpResult = await sendEmailViaSMTP(
      registration.email,
      "YATRA 2026 - Registration Confirmation",
      emailHtml,
      emailText
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
