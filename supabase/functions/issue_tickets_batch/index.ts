import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import QRCode from "https://esm.sh/qrcode@1.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- HMAC-SHA256 signing for QR tokens ----
async function signToken(
  ticketId: string,
  secret: string
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(ticketId));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${ticketId}.${hex}`;
}

// ---- Auth helper ----
async function requireAdminEmail(req: Request): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !supabaseKey)
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  if (!jwt) throw new Error("Missing Authorization bearer token");

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user?.email)
    throw new Error("Unauthorized: invalid user token");

  const email = data.user.email.toLowerCase();
  const masterAdmin = (
    Deno.env.get("MASTER_ADMIN_EMAIL") ?? "meraryanto@gmail.com"
  ).toLowerCase();
  if (email === masterAdmin) return email;

  const { data: isAdmin, error: rpcError } = await supabase.rpc(
    "check_is_admin",
    { user_email: email }
  );
  if (rpcError) throw new Error("Unauthorized: admin check failed");
  if (!isAdmin) throw new Error("Unauthorized: not an admin");

  return email;
}

// ---- SMTP ----
const EMAIL_USER = Deno.env.get("EMAIL_USER");
const EMAIL_PASS = Deno.env.get("EMAIL_PASS");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@yatra2026.com";

async function sendEmailViaSMTP(
  to: string,
  subject: string,
  html: string,
  text: string,
  qrDataUrl?: string
): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log("SMTP not configured. Mocking email send to:", to);
    return;
  }

  const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const write = async (cmd: string) =>
    await conn.write(encoder.encode(cmd + "\r\n"));
  const read = async () => {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    return n ? decoder.decode(buf.subarray(0, n)) : null;
  };

  await read();
  await write("EHLO localhost");
  await read();
  await write("AUTH LOGIN");
  await read();
  await write(btoa(EMAIL_USER));
  await read();
  await write(btoa(EMAIL_PASS));
  const authRes = await read();
  if (!authRes?.includes("235")) throw new Error(`SMTP Auth failed: ${authRes}`);

  await write(`MAIL FROM:<${FROM_EMAIL}>`);
  await read();
  await write(`RCPT TO:<${to}>`);
  await read();
  await write("DATA");
  await read();

  const relatedBoundary = "----=_Related_" + Date.now().toString();
  const altBoundary = "----=_Alt_" + Date.now().toString();
  const qrBase64 = qrDataUrl?.startsWith("data:image/png;base64,")
    ? qrDataUrl.slice("data:image/png;base64,".length).match(/.{1,76}/g)?.join("\r\n")
    : null;

  const messageParts = [
    `From: YATRA 2026 <${FROM_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    "",
    `--${relatedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    "",
    text,
    "",
    `--${altBoundary}`,
    `Content-Type: text/html; charset=utf-8`,
    "",
    html,
    "",
    `--${altBoundary}--`,
    "",
  ];

  if (qrBase64) {
    messageParts.push(
      `--${relatedBoundary}`,
      `Content-Type: image/png; name="qrcode.png"`,
      `Content-Transfer-Encoding: base64`,
      `Content-ID: <qrcode>`,
      `Content-Disposition: inline; filename="qrcode.png"`,
      "",
      qrBase64,
      ""
    );
  }

  messageParts.push(`--${relatedBoundary}--`, ".");
  const message = messageParts.join("\r\n");

  await write(message);
  await read();
  await write("QUIT");
  conn.close();
}

// ---- Category Labels ----
const CATEGORY_LABELS: Record<number, string> = {
  1: "Institution Student Pass",
  2: "Event-Specific Ticket",
  3: "General Audience (Single Day)",
  4: "General Audience Combo (2 Days)",
};

// ---- Email Templates ----
function generateEmailHtml(
  reg: { name: string, college: string },
  ticketCode: string,
  qrDataUrl: string,
  adminEmail: string,
  category: number,
  validDays: string[],
  eventId?: string | null
): string {
  // Hardcoded date string as requested
  const dateString = "FEB 13 AND 14";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YATRA 2026 // ENTRY PASS</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:'Courier New',Courier,monospace;color:#fff;">
  <div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #333;">
    
    <!-- HEADER -->
    <div style="background:#000;padding:40px 20px;text-align:center;border-bottom:2px solid #ff00ff;">
      <h1 style="color:#fff;margin:0;font-size:36px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">YATRA 2026</h1>
      <p style="color:#ff00ff;margin:10px 0 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">OFFICIAL ENTRY PASS</p>
    </div>

    <!-- ACKNOWLEDGMENT -->
    <div style="padding:40px 30px;background:#111;text-align:left;">
      <h2 style="color:#fff;margin:0 0 20px;font-size:20px;">Hey 👋</h2>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin-bottom:20px;">
        Your spot at Yatra 2026 is officially locked.<br>
        Get ready to step into a Korean-inspired cultural experience filled with energy, performances, lights, and moments you won’t forget.
      </p>
      <p style="color:#ccc;font-size:14px;line-height:1.6;margin-bottom:20px;">
        🎟️ Your pass is attached — keep it ready for entry.<br>
        📱 Bring your ID. Come charged. Come ready.
      </p>
      <p style="color:#fff;font-size:16px;font-weight:bold;margin-bottom:20px;border-left:4px solid #ff00ff;padding-left:15px;">
        This isn’t just a fest.<br>
        It’s a vibe.<br>
        See you inside.
      </p>
      <p style="color:#888;font-size:12px;margin-top:30px;">
        Team Yatra 2026<br>
        Raja Lakshmi Institutions of Technology
      </p>
    </div>

    <!-- TICKET DETAILS -->
    <div style="background:#fff;color:#000;padding:30px;margin:0 20px 20px;">
      
      <!-- ATTENDEE INFO -->
      <div style="margin-bottom:20px;border-bottom:2px dashed #000;padding-bottom:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;">COLLEGE NAME</p>
        <h3 style="margin:5px 0 0;font-size:18px;font-weight:900;text-transform:uppercase;">${reg.college || "N/A"}</h3>
      </div>

      <!-- UNIQUE ID & QR -->
      <div style="text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:2px;">UNIQUE 6 DIGIT ID</p>
        <div style="background:#000;color:#fff;display:inline-block;padding:10px 30px;font-size:32px;font-weight:900;letter-spacing:6px;margin-bottom:20px;">
          ${ticketCode}
        </div>
        
        <div style="display:block;margin:0 auto;width:200px;height:200px;background:#fff;padding:10px;border:2px solid #000;">
          <img src="cid:qrcode" alt="QR CODE" style="width:100%;height:100%;display:block;">
        </div>
        <p style="margin:10px 0 0;font-size:10px;color:#888;">SCAN FOR ENTRY</p>
      </div>

      <!-- EVENT INFO -->
      <div style="display:flex;justify-content:space-between;border-top:2px dashed #000;padding-top:20px;">
        <div style="text-align:left;">
          <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">DATES</p>
          <p style="margin:5px 0 0;font-size:14px;font-weight:900;">${dateString}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;">VENUE</p>
          <p style="margin:5px 0 0;font-size:14px;font-weight:700;">Rajalakshmi Institute<br>of Technology</p>
        </div>
      </div>

    </div>

    <!-- RULES -->
    <div style="padding:30px;background:#222;color:#ccc;font-size:12px;">
      <h4 style="margin:0 0 15px;color:#fff;text-transform:uppercase;border-bottom:1px solid #444;padding-bottom:10px;">RULES AND REGULATIONS</h4>
      <ol style="margin:0;padding-left:20px;line-height:1.8;">
        <li>College ID is a MUST.</li>
        <li>No outside food or beverages allowed.</li>
        <li>No ordering of food allowed inside campus.</li>
        <li>Do NOT delete this email.</li>
        <li>Maintain discipline inside the campus.</li>
        <li>Bags are NOT allowed (including slim bags).</li>
        <li>Entries not allowed after 5:00 PM.</li>
      </ol>
    </div>

    <!-- FOOTER -->
    <div style="background:#000;padding:20px;text-align:center;border-top:1px solid #333;">
      <p style="margin:0;color:#666;font-size:10px;">YATRA 2026 OFFICIAL TICKET SYSTEM</p>
    </div>

  </div>
</body>
</html>`;
}

function generateEmailText(
  ticketCode: string,
  category: number,
  validDays: string[]
): string {
  return `YATRA 2026 - OFFICIAL ENTRY PASS
================================
Hey 👋
Your spot at Yatra 2026 is officially locked.
Get ready to step into a Korean-inspired cultural experience filled with energy, performances, lights, and moments you won’t forget.

🎟️ Your pass is attached — keep it ready for entry.
📱 Bring your ID. Come charged. Come ready.

This isn’t just a fest.
It’s a vibe.
See you inside.

Team Yatra 2026
Raja Lakshmi Institutions of Technology

--------------------------------
YOUR TICKET DETAILS
--------------------------------
UNIQUE ID: ${ticketCode}
DATES: FEB 13 AND 14
VENUE: Rajalakshmi Institute of Technology

--------------------------------
RULES AND REGULATIONS
--------------------------------
1. College ID is a MUST.
2. No outside food or beverages allowed.
3. No ordering of food allowed inside campus.
4. Do NOT delete this email.
5. Maintain discipline inside the campus.
6. Bags are NOT allowed (including slim bags).
7. Entries not allowed after 5:00 PM.
`;
}

// ---- Main Handler ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminEmail = await requireAdminEmail(req);
    const body = await req.json();
    const { registration_ids, category, valid_days, event_id } = body;

    const ticketCategory: number = category ?? 1;
    const ticketValidDays: string[] = valid_days ?? [];
    const ticketEventId: string | null = event_id ?? null;

    if (
      !registration_ids ||
      !Array.isArray(registration_ids) ||
      registration_ids.length === 0
    ) {
      throw new Error("registration_ids array is required");
    }

    if (ticketCategory === 2 && !ticketEventId) {
      throw new Error("event_id is required for category 2 (event tickets)");
    }

    if (ticketValidDays.length === 0) {
      throw new Error("valid_days array is required (e.g. ['2026-03-14'])");
    }

    const QR_SECRET =
      Deno.env.get("QR_SIGNING_SECRET") || "yatra-2026-qr-secret-default";

    const uniqueIds = [...new Set(registration_ids as string[])];
    console.log(
      `Processing ${uniqueIds.length} tickets. Category: ${ticketCategory}. Issuer: ${adminEmail}`
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      success: true,
      issued_count: 0,
      skipped_count: 0,
      not_paid_count: 0,
      already_sent_count: 0,
      failed: [] as { registration_id: string; reason: string }[],
    };

    for (const regId of uniqueIds) {
      try {
        // A. Fetch Registration
        const { data: reg, error: fetchError } = await supabase
          .from("registrations")
          .select("*")
          .eq("id", regId)
          .single();

        if (fetchError || !reg)
          throw new Error(
            `Registration not found: ${fetchError?.message}`
          );

        // B. Must be paid
        if ((reg.payment_status ?? "unpaid") !== "paid") {
          results.not_paid_count++;
          results.failed.push({
            registration_id: regId,
            reason: "Not eligible: payment_status is not paid",
          });
          continue;
        }

        // C. Already sent?
        if (reg.ticket_email_sent) {
          console.log(`Skipping ${reg.email} - already sent`);
          results.skipped_count++;
          results.already_sent_count++;
          continue;
        }

        // D. Secondary idempotency
        try {
          const { data: latestEvent } = await supabase
            .from("ticket_email_events")
            .select("status, created_at")
            .eq("registration_id", regId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestEvent?.status === "sent") {
            results.skipped_count++;
            results.already_sent_count++;
            await supabase
              .from("registrations")
              .update({ ticket_email_sent: true })
              .eq("id", regId);
            continue;
          }
        } catch {
          // ignore
        }

        // E. Ticket: reuse if exists, otherwise create
        let ticketId = "";
        let ticketCode = "";
        let qrToken = "";

        const { data: existingTicket, error: ticketFetchError } =
          await supabase
            .from("tickets")
            .select("id, code_6_digit, qr_token")
            .eq("registration_id", regId)
            .maybeSingle();

        if (ticketFetchError)
          throw new Error(
            `Failed to check existing ticket: ${ticketFetchError.message}`
          );

        if (existingTicket) {
          ticketId = String(existingTicket.id);
          ticketCode = String(existingTicket.code_6_digit);
          qrToken = existingTicket.qr_token || "";

          // If no qr_token yet, generate one
          if (!qrToken) {
            qrToken = await signToken(ticketId, QR_SECRET);
            await supabase
              .from("tickets")
              .update({
                qr_token: qrToken,
                category: ticketCategory,
                valid_days: ticketValidDays,
                event_id: ticketEventId,
              })
              .eq("id", ticketId);
          }
        } else {
          // Generate Unique 6-Digit Code
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 10) {
            ticketCode = Math.floor(
              100000 + Math.random() * 900000
            ).toString();
            const { data: existing } = await supabase
              .from("tickets")
              .select("id")
              .eq("code_6_digit", ticketCode)
              .maybeSingle();
            if (!existing) isUnique = true;
            attempts++;
          }

          if (!isUnique) throw new Error("Failed to generate unique ticket code");

          ticketId = crypto.randomUUID();
          qrToken = await signToken(ticketId, QR_SECRET);

          const { error: insertError } = await supabase
            .from("tickets")
            .insert({
              id: ticketId,
              registration_id: reg.id,
              email: reg.email,
              name: reg.name,
              college: reg.college,
              phone: reg.phone,
              code_6_digit: ticketCode,
              qr_payload: qrToken,
              qr_token: qrToken,
              ticket_status: "valid",
              category: ticketCategory,
              valid_days: ticketValidDays,
              event_id: ticketEventId,
              status: "active",
              ticket_type:
                reg.ticket_type || CATEGORY_LABELS[ticketCategory],
              price: reg.price,
              is_rit_student: reg.is_rit_student ?? false,
            });

          if (insertError)
            throw new Error(`Ticket insert failed: ${insertError.message}`);
        }

        // QR encodes signed token only (NOT plain UUID)
        const qrDataUrl = await QRCode.toDataURL(qrToken);

        // F. Send Email
        const emailHtml = generateEmailHtml(
          reg,
          ticketCode,
          qrDataUrl,
          adminEmail,
          ticketCategory,
          ticketValidDays,
          ticketEventId
        );
        const emailText = generateEmailText(
          ticketCode,
          ticketCategory,
          ticketValidDays
        );

        try {
          await sendEmailViaSMTP(
            reg.email,
            `YATRA 2026 // ENTRY PASS [${ticketCode}]`,
            emailHtml,
            emailText,
            qrDataUrl
          );

          try {
            await supabase.from("ticket_email_events").insert({
              registration_id: regId,
              ticket_id: ticketId,
              to_email: reg.email,
              status: "sent",
              error_text: null,
            });
          } catch {
            // ignore
          }
        } catch (emailError) {
          const errText =
            emailError instanceof Error
              ? emailError.message
              : String(emailError);
          try {
            await supabase.from("ticket_email_events").insert({
              registration_id: regId,
              ticket_id: ticketId,
              to_email: reg.email,
              status: "failed",
              error_text: errText,
            });
          } catch {
            // ignore
          }
          throw new Error(`Email send failed: ${errText}`);
        }

        // G. Mark registration as sent
        const { error: updateError } = await supabase
          .from("registrations")
          .update({
            ticket_generated: true,
            ticket_email_sent: true,
            ticket_sent_at: new Date().toISOString(),
          })
          .eq("id", regId);

        if (updateError) {
          console.error(
            `Failed to update registration status for ${regId}`,
            updateError
          );
        }

        results.issued_count++;
        console.log(
          `Issued ticket ${ticketCode} (cat ${ticketCategory}) to ${reg.email}`
        );
      } catch (itemError) {
        console.error(`Failed for ${regId}:`, itemError);
        const reason =
          itemError instanceof Error ? itemError.message : String(itemError);
        results.failed.push({ registration_id: regId, reason });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
