import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import CryptoJS from "https://esm.sh/crypto-js@4.2.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Credentials from Environment Variables
const CCAVENUE_WORKING_KEY = Deno.env.get("CCAVENUE_WORKING_KEY")!;
if (!CCAVENUE_WORKING_KEY) console.error("Missing CCAVENUE_WORKING_KEY");

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
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

async function aes128CbcDecryptFromHex(encHex: string, workingKey: string): Promise<string> {
  // CCAvenue legacy scheme: key = MD5(workingKey), iv = 0..15, AES-128-CBC.
  const md5Hex = CryptoJS.MD5(workingKey).toString(CryptoJS.enc.Hex);
  const keyBytes = hexToBytes(md5Hex);
  const iv = new Uint8Array(16);
  for (let i = 0; i < 16; i++) iv[i] = i;

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"],
  );

  const cipherBytes = hexToBytes(encHex);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    cipherBytes,
  );

  return new TextDecoder().decode(new Uint8Array(decrypted));
}

function normalizeStatus(orderStatus: string | null): "success" | "failure" | "aborted" {
  const s = (orderStatus ?? "").toLowerCase();
  if (s === "success") return "success";
  if (s === "aborted") return "aborted";
  return "failure";
}

function htmlRedirect(url: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${url}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>Redirecting…</p>
    <a href="${url}">Continue</a>
    <script>window.location.href = ${JSON.stringify(url)};</script>
  </body>
</html>`;
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
    // Use hardcoded credential
    const workingKey = CCAVENUE_WORKING_KEY;
    const siteUrl = getEnv("SITE_URL").replace(/\/+$/, "");

    const supabase = createClient(supabaseUrl, serviceKey);

    // CCavenue posts form-urlencoded: encResp=<hex>
    const rawBody = await req.text();
    const form = new URLSearchParams(rawBody);
    const encResp = form.get("encResp") ?? "";
    if (!encResp) {
      const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("missing_encResp")}`;
      return new Response(htmlRedirect(failUrl), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    const decrypted = await aes128CbcDecryptFromHex(encResp, workingKey);
    const respParams = new URLSearchParams(decrypted);

    const orderId = respParams.get("order_id");
    const trackingId = respParams.get("tracking_id") ?? respParams.get("bank_ref_no");
    const orderStatusRaw = respParams.get("order_status");
    const statusNorm = normalizeStatus(orderStatusRaw);

    if (!orderId) {
      const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("missing_order_id")}`;
      return new Response(htmlRedirect(failUrl), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    // Load order row
    const { data: order, error: orderErr } = await supabase
      .from("ccavenue_orders")
      .select(
        "order_id,purpose,amount_inr,currency,status,tracking_id,yatra_registration_id,event_registration_id",
      )
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderErr) {
      throw new Error(`Failed to load order: ${orderErr.message}`);
    }
    if (!order) {
      const failUrl = `${siteUrl}/payment/failure?order_id=${encodeURIComponent(orderId)}&reason=${encodeURIComponent("order_not_found")}`;
      return new Response(htmlRedirect(failUrl), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    const nowIso = new Date().toISOString();

    // Update order ledger (idempotent-ish: always overwrite latest response)
    await supabase
      .from("ccavenue_orders")
      .update({
        status: statusNorm,
        tracking_id: trackingId,
        enc_response: encResp,
        callback_received_at: nowIso,
        updated_at: nowIso,
      })
      .eq("order_id", orderId);

    if (statusNorm === "success") {
      if (order.purpose === "yatra_entry" && order.yatra_registration_id) {
        await supabase
          .from("registrations")
          .update({
            payment_status: "paid",
            payment_confirmed_at: nowIso,
            payment_utr: trackingId,
            ticket_type: "Yatra Entry",
          })
          .eq("id", order.yatra_registration_id);

        // Best-effort: trigger ticket email generation
        try {
          const { data: reg } = await supabase
            .from("registrations")
            .select("*")
            .eq("id", order.yatra_registration_id)
            .single();

          await fetch(`${supabaseUrl.replace(/\/+$/, "")}/functions/v1/send-registration-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // send-registration-email is configured with verify_jwt by default; service role key works as JWT
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify(reg),
          });
        } catch {
          // ignore email failures (admin can batch-send later)
        }
      }

      if (order.purpose === "event" && order.event_registration_id) {
        await supabase
          .from("event_registrations")
          .update({
            payment_status: "paid",
            payment_confirmed_at: nowIso,
            payment_reference: trackingId,
          })
          .eq("id", order.event_registration_id);
      }
    }

    const destination =
      statusNorm === "success"
        ? `${siteUrl}/payment/success`
        : `${siteUrl}/payment/failure`;

    // Preserve context
    const qs = new URLSearchParams();
    qs.set("order_id", orderId);
    qs.set("purpose", String(order.purpose));
    if (order.purpose === "event") {
      const eventId = respParams.get("merchant_param2") ?? "";
      if (eventId) qs.set("event_id", eventId);
    }
    if (trackingId) qs.set("tracking_id", trackingId);
    if (orderStatusRaw) qs.set("order_status", orderStatusRaw);

    const redirectUrl = `${destination}?${qs.toString()}`;
    return new Response(htmlRedirect(redirectUrl), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    const siteUrl = (Deno.env.get("SITE_URL") ?? "https://www.rityatra.in").replace(/\/+$/, "");
    const msg = error instanceof Error ? error.message : String(error);
    const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("callback_error")}&message=${encodeURIComponent(msg)}`;
    return new Response(htmlRedirect(failUrl), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }
});

