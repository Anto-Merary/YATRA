import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import CryptoJS from "https://esm.sh/crypto-js@4.2.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Purpose = "yatra_entry" | "event";

type CreateOrderBody =
  | {
      purpose: "yatra_entry";
      name: string;
      email: string;
      phone: string;
      institution_type: "rit" | "rec" | "rsb" | "rsa" | "other";
      college: string;
    }
  | {
      purpose: "event";
      event_id: string;
      event_display_name?: string;
      event_variant?: string;
      name: string;
      email: string;
      phone: string;
      college: string;
    };

type FeeUnit = "per_person" | "per_team" | "per_sport" | "free" | "tba";

const EVENT_FEES: Record<string, { amountInr: number; unit: FeeUnit }> = {
  // Day 1
  "group-dance": { amountInr: 800, unit: "per_team" },
  "kids-solo-dance": { amountInr: 150, unit: "per_person" },
  "solo-dance": { amountInr: 250, unit: "per_person" },
  "adaptune-solo": { amountInr: 250, unit: "per_person" },
  "lyric-quest": { amountInr: 150, unit: "per_person" },
  "rj-hunt": { amountInr: 250, unit: "per_person" },
  "k-drama-vs-anime-quiz": { amountInr: 150, unit: "per_team" },
  "balloon-bursting-challenge": { amountInr: 150, unit: "per_person" },
  "avatar-portfolio": { amountInr: 0, unit: "free" },
  "cricket-commentary": { amountInr: 200, unit: "per_person" },
  "red-light-green-light": { amountInr: 200, unit: "per_person" },
  "brain-teasers-arena": { amountInr: 200, unit: "per_team" },
  "short-film": { amountInr: 200, unit: "per_team" },
  "ethnic-food-contest": { amountInr: 200, unit: "per_team" },
  "brawl-stars": { amountInr: 200, unit: "per_sport" },
  "pubg": { amountInr: 200, unit: "per_sport" },
  "photography": { amountInr: 200, unit: "per_person" },
  "mehandi": { amountInr: 200, unit: "per_team" },
  "mega-origami": { amountInr: 200, unit: "per_team" },
  "poster-designing": { amountInr: 200, unit: "per_person" },
  "box-cricket": { amountInr: 200, unit: "per_team" },
  "tug-of-war": { amountInr: 250, unit: "per_team" },
  "gonggi-pebble-toss": { amountInr: 150, unit: "per_person" },
  "dont-laugh": { amountInr: 150, unit: "per_person" },
  "channel-surfing": { amountInr: 250, unit: "per_team" },

  // Day 2
  "classical-dance": { amountInr: 250, unit: "per_person" },
  "battle-of-beats": { amountInr: 600, unit: "per_team" },
  "jam": { amountInr: 150, unit: "per_person" },
  "beat-box-battle": { amountInr: 200, unit: "per_person" },
  "singing": { amountInr: 250, unit: "per_person" },
  "tongue-twister-tournament": { amountInr: 150, unit: "per_person" },
  "mono-acting-challenge": { amountInr: 150, unit: "per_person" },
  "adzap": { amountInr: 150, unit: "per_person" },
  "mime": { amountInr: 300, unit: "per_team" },
  "meme-creation-challenge": { amountInr: 200, unit: "per_person" },
  "mock-parliament": { amountInr: 200, unit: "per_team" },
  "stand-up-comedy-solo": { amountInr: 150, unit: "per_person" },
  "the-opposite": { amountInr: 150, unit: "per_person" },
  "debate": { amountInr: 200, unit: "per_team" },
  "free-fire": { amountInr: 200, unit: "per_team" },
  "valorant": { amountInr: 200, unit: "per_team" },
  "rangoli": { amountInr: 200, unit: "per_team" },
  "stumble-guys": { amountInr: 200, unit: "per_person" },
  "treasure-hunt": { amountInr: 200, unit: "per_team" },
  "oratory-english-tamil": { amountInr: 150, unit: "per_person" },
  "face-fiesta": { amountInr: 150, unit: "per_team" },
  "pencil-art-painting": { amountInr: 150, unit: "per_person" },
  "tower-build": { amountInr: 200, unit: "per_team" },
  "drone-challenge-bioscope": { amountInr: 200, unit: "per_team" },
  "fake-news-or-fact": { amountInr: 200, unit: "per_team" },
};

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) throw new Error("Invalid hex length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function aes128CbcEncryptToHex(plainText: string, workingKey: string): Promise<string> {
  // CCAvenue legacy scheme: key = MD5(workingKey), iv = 0..15, AES-128-CBC, hex output.
  const md5Hex = CryptoJS.MD5(workingKey).toString(CryptoJS.enc.Hex);
  const keyBytes = hexToBytes(md5Hex);
  const iv = new Uint8Array(16);
  for (let i = 0; i < 16; i++) iv[i] = i;

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"],
  );

  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encoded,
  );
  return bytesToHex(new Uint8Array(encrypted));
}

function buildMerchantData(params: Record<string, string>): string {
  // CCAvenue expects key=value pairs joined by &
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) usp.set(k, v);
  return usp.toString();
}

function generateOrderId(): string {
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
  return `YATRA${Date.now()}${rand}`;
}

function htmlAutoPostToCcavenue(encRequest: string, accessCode: string): string {
  const action =
    "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting to payment…</title>
  </head>
  <body>
    <form id="ccavenue_redirect" method="post" action="${action}">
      <input type="hidden" name="encRequest" value="${encRequest}" />
      <input type="hidden" name="access_code" value="${accessCode}" />
    </form>
    <script>
      document.getElementById('ccavenue_redirect').submit();
    </script>
    <noscript>
      <p>JavaScript is required. Please click Continue.</p>
      <button type="submit" form="ccavenue_redirect">Continue</button>
    </noscript>
  </body>
</html>`;
}

function wantsJson(req: Request, body: any): boolean {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json")) return true;
  const mode = String(body?.response_mode ?? "").toLowerCase();
  return mode === "json";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const merchantId = getEnv("CCAVENUE_MERCHANT_ID");
    const accessCode = getEnv("CCAVENUE_ACCESS_CODE");
    const workingKey = getEnv("CCAVENUE_WORKING_KEY");
    const siteUrl = getEnv("SITE_URL").replace(/\/+$/, "");

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => ({}))) as Partial<CreateOrderBody> & {
      response_mode?: "json" | "html";
    };
    const preferJson = wantsJson(req, body);
    const purpose = (body as any)?.purpose as Purpose | undefined;
    if (!purpose || (purpose !== "yatra_entry" && purpose !== "event")) {
      return new Response(JSON.stringify({ error: "Invalid purpose" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Common fields
    const name = String((body as any)?.name ?? "").trim();
    const email = normalizeEmail(String((body as any)?.email ?? ""));
    const phone = normalizePhone(String((body as any)?.phone ?? ""));
    const college = String((body as any)?.college ?? "").trim();

    if (!name || !email || !phone || phone.length !== 10) {
      return new Response(JSON.stringify({ error: "Missing/invalid name, email, or phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callbackUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/ccavenue_callback`;
    const orderId = generateOrderId();

    if (purpose === "yatra_entry") {
      const institutionType = String((body as any)?.institution_type ?? "").toLowerCase();
      if (!["rit", "rec", "rsb", "rsa", "other"].includes(institutionType)) {
        return new Response(JSON.stringify({ error: "Invalid institution_type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (institutionType === "other" && !college) {
        return new Response(JSON.stringify({ error: "College name is required for Other" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const amountInr = institutionType === "other" ? 800 : 500;

      // Idempotency: if already paid for yatra entry, short-circuit
      const { data: existing } = await supabase
        .from("registrations")
        .select("id,payment_status,ticket_type")
        .eq("email", email)
        .maybeSingle();

      if (existing?.payment_status === "paid" && String(existing.ticket_type ?? "") === "Yatra Entry") {
        return new Response(
          JSON.stringify({
            ok: true,
            already_paid: true,
            purpose,
            registration_id: existing.id,
            redirect: `${siteUrl}/payment/success?purpose=yatra_entry&already_paid=1`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: upserted, error: upsertError } = await supabase
        .from("registrations")
        .upsert(
          [{
            name,
            email,
            phone,
            college,
            institution_type: institutionType,
            ticket_type: "Yatra Entry",
            price: `₹${amountInr}`,
            is_rit_student: null,
            payment_status: "unpaid",
            payment_confirmed_at: null,
            payment_utr: null,
            payment_batch_id: null,
            ticket_generated: false,
            ticket_email_sent: false,
            ticket_sent_at: null,
          }],
          { onConflict: "email" },
        )
        .select("id")
        .single();

      if (upsertError || !upserted?.id) {
        throw new Error(`Failed to upsert registration: ${upsertError?.message ?? "unknown"}`);
      }

      const { error: orderErr } = await supabase
        .from("ccavenue_orders")
        .insert({
          order_id: orderId,
          purpose: "yatra_entry",
          yatra_registration_id: upserted.id,
          event_registration_id: null,
          amount_inr: amountInr,
          currency: "INR",
          status: "pending",
          enc_request: null,
          enc_response: null,
        });
      if (orderErr) throw new Error(`Failed to create order: ${orderErr.message}`);

      const merchantData = buildMerchantData({
        merchant_id: merchantId,
        order_id: orderId,
        currency: "INR",
        amount: String(amountInr),
        redirect_url: callbackUrl,
        cancel_url: callbackUrl,
        language: "EN",
        billing_name: name,
        billing_email: email,
        billing_tel: phone,
        billing_address: college,
        billing_country: "India",
        merchant_param1: "yatra_entry",
        merchant_param2: String(upserted.id),
        merchant_param3: siteUrl,
      });

      const encRequest = await aes128CbcEncryptToHex(merchantData, workingKey);
      await supabase
        .from("ccavenue_orders")
        .update({ enc_request: encRequest })
        .eq("order_id", orderId);

      const action =
        "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
      if (preferJson) {
        return new Response(
          JSON.stringify({
            ok: true,
            mode: "form",
            purpose,
            order_id: orderId,
            action,
            encRequest,
            access_code: accessCode,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(htmlAutoPostToCcavenue(encRequest, accessCode), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // purpose === "event"
    const eventId = String((body as any)?.event_id ?? "").trim();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "event_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce: yatra entry must be paid first
    const { data: yatra } = await supabase
      .from("registrations")
      .select("id,payment_status,ticket_type")
      .eq("email", email)
      .maybeSingle();

    const hasPaidYatra =
      yatra?.payment_status === "paid" && String(yatra.ticket_type ?? "") === "Yatra Entry";

    if (!hasPaidYatra) {
      return new Response(
        JSON.stringify({ error: "Yatra Entry Pass (paid) is required before event registration." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fee = EVENT_FEES[eventId];
    if (!fee) {
      return new Response(JSON.stringify({ error: `Fee not configured for event_id: ${eventId}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventDisplayName = String((body as any)?.event_display_name ?? "").trim() || null;
    const eventVariant = String((body as any)?.event_variant ?? "").trim() || null;

    const paymentStatus: string = fee.unit === "free" || fee.amountInr === 0 ? "free" : "unpaid";
    const confirmedAt = paymentStatus === "free" ? new Date().toISOString() : null;

    const { data: eventReg, error: eventRegErr } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        event_display_name: eventDisplayName,
        event_variant: eventVariant,
        name,
        email,
        phone,
        college,
        amount_inr: fee.amountInr,
        unit: fee.unit,
        payment_status: paymentStatus,
        payment_confirmed_at: confirmedAt,
      })
      .select("id")
      .single();
    if (eventRegErr || !eventReg?.id) {
      throw new Error(`Failed to create event registration: ${eventRegErr?.message ?? "unknown"}`);
    }

    if (paymentStatus === "free") {
      // Keep an order record for auditing, but mark success immediately.
      await supabase.from("ccavenue_orders").insert({
        order_id: orderId,
        purpose: "event",
        yatra_registration_id: yatra?.id ?? null,
        event_registration_id: eventReg.id,
        amount_inr: 0,
        currency: "INR",
        status: "success",
        tracking_id: "FREE",
        enc_request: null,
        enc_response: null,
        callback_received_at: new Date().toISOString(),
      });

      const redirect = `${siteUrl}/payment/success?purpose=event&event_id=${encodeURIComponent(eventId)}&order_id=${encodeURIComponent(orderId)}&free=1`;
      return new Response(JSON.stringify({ ok: true, free: true, redirect }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("ccavenue_orders").insert({
      order_id: orderId,
      purpose: "event",
      yatra_registration_id: yatra?.id ?? null,
      event_registration_id: eventReg.id,
      amount_inr: fee.amountInr,
      currency: "INR",
      status: "pending",
      enc_request: null,
      enc_response: null,
    });

    const merchantData = buildMerchantData({
      merchant_id: merchantId,
      order_id: orderId,
      currency: "INR",
      amount: String(fee.amountInr),
      redirect_url: callbackUrl,
      cancel_url: callbackUrl,
      language: "EN",
      billing_name: name,
      billing_email: email,
      billing_tel: phone,
      billing_address: college,
      billing_country: "India",
      merchant_param1: "event",
      merchant_param2: eventId,
      merchant_param3: String(eventReg.id),
    });

    const encRequest = await aes128CbcEncryptToHex(merchantData, workingKey);
    await supabase
      .from("ccavenue_orders")
      .update({ enc_request: encRequest })
      .eq("order_id", orderId);

    const action =
      "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";
    if (preferJson) {
      return new Response(
        JSON.stringify({
          ok: true,
          mode: "form",
          purpose,
          order_id: orderId,
          action,
          encRequest,
          access_code: accessCode,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(htmlAutoPostToCcavenue(encRequest, accessCode), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

