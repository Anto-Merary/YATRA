import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
async function sendEmailViaSMTP(to: string, subject: string, html: string, text: string): Promise<void> {
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
    
    // Read server greeting
    let n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    let response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("220")) {
      throw new Error(`SMTP greeting failed: ${response}`);
    }

    // Send EHLO
    await conn.write(encoder.encode("EHLO localhost\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("250")) {
      throw new Error(`EHLO failed: ${response}`);
    }

    // Send AUTH LOGIN
    await conn.write(encoder.encode("AUTH LOGIN\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("334")) {
      throw new Error(`AUTH LOGIN failed: ${response}`);
    }

    // Send username (base64)
    const usernameB64 = btoa(EMAIL_USER);
    await conn.write(encoder.encode(usernameB64 + "\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("334")) {
      throw new Error(`Username auth failed: ${response}`);
    }

    // Send password (base64)
    const passwordB64 = btoa(EMAIL_PASS);
    await conn.write(encoder.encode(passwordB64 + "\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("235")) {
      throw new Error(`Authentication failed: ${response}`);
    }

    // Send MAIL FROM
    await conn.write(encoder.encode(`MAIL FROM:<${FROM_EMAIL}>\r\n`));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("250")) {
      throw new Error(`MAIL FROM failed: ${response}`);
    }

    // Send RCPT TO
    await conn.write(encoder.encode(`RCPT TO:<${to}>\r\n`));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
    if (!response.startsWith("250")) {
      throw new Error(`RCPT TO failed: ${response}`);
    }

    // Send DATA
    await conn.write(encoder.encode("DATA\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
    response = decoder.decode(buffer.subarray(0, n));
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
    if (!response.startsWith("250")) {
      throw new Error(`Message send failed: ${response}`);
    }

    // Send QUIT
    await conn.write(encoder.encode("QUIT\r\n"));
    n = await conn.read(buffer);
    if (n === null) throw new Error("Connection closed");
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

  try {
    // Parse request body
    const registration: RegistrationData = await req.json();

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
          message: "Email service not configured. Registration logged.",
          registration,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

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

We're excited to have you join us for this amazing cultural celebration!

If you have any questions or need assistance, please don't hesitate to contact us.

---
Rajalakshmi Institute of Technology
YATRA 2026 Organizing Committee

This is an automated confirmation email. Please do not reply.
    `.trim();

    // Send email using native Deno TLS
    console.log(`Attempting to send email from: ${FROM_EMAIL} to: ${registration.email}`);

    await sendEmailViaSMTP(
      registration.email,
      "YATRA 2026 - Registration Confirmation",
      emailHtml,
      emailText
    );

    console.log("Email sent successfully to:", registration.email);

    return new Response(
      JSON.stringify({
        message: "Confirmation email sent successfully",
        to: registration.email,
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
