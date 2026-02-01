import { createClient } from "@supabase/supabase-js";
import CryptoJS from "crypto-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Vercel Serverless Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Headers (though this is typically a direct POST from CCAvenue, accessed by browser)
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Helper for redirect
    const htmlRedirect = (url: string) => {
        return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${url}" />
    <title>Redirecting...</title>
  </head>
  <body>
    <p>Redirecting...</p>
    <script>window.location.href = ${JSON.stringify(url)};</script>
  </body>
</html>`;
    };

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const workingKey = process.env.CCAVENUE_WORKING_KEY;
        const siteUrl = (process.env.SITE_URL ?? "https://rityatra.in").replace(/\/+$/, "");

        const wk = workingKey?.trim();
        if (!supabaseUrl || !serviceKey || !wk) {
            console.error("Missing env vars in callback");
            const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("server_config_error")}`;
            return res.status(200).send(htmlRedirect(failUrl));
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        // CCAvenue POSTs application/x-www-form-urlencoded with 'encResp' (hex-encoded ciphertext)
        let encResp: string | undefined;
        if (typeof req.body === "object" && req.body !== null) {
            encResp = (req.body as Record<string, unknown>).encResp ?? (req.body as Record<string, unknown>).enc_resp;
            if (typeof encResp !== "string") encResp = undefined;
        }
        if (!encResp && typeof req.body === "string") {
            try {
                const params = new URLSearchParams(req.body);
                encResp = params.get("encResp") ?? params.get("enc_resp") ?? undefined;
            } catch {
                encResp = undefined;
            }
        }

        if (!encResp || encResp.length < 32) {
            const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("missing_encResp")}`;
            return res.status(200).send(htmlRedirect(failUrl));
        }

        // CCAvenue AES-128-CBC decryption (per official ccavutil.js): key = MD5(workingKey), IV = 0x00..0x0f, ciphertext hex
        const keyBytes = CryptoJS.MD5(wk); // 16-byte WordArray
        const iv = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f]);
        const ciphertext = CryptoJS.enc.Hex.parse(encResp);
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext } as CryptoJS.lib.CipherParams,
            keyBytes,
            { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        );
        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

        // Parse the decrypted string (key=value&...)
        const respParams = new URLSearchParams(decryptedText);

        const orderId = respParams.get("order_id");
        const trackingId = respParams.get("tracking_id") || respParams.get("bank_ref_no");
        const orderStatusRaw = respParams.get("order_status");
        let statusNorm = "failure";
        if (orderStatusRaw?.toLowerCase() === "success") statusNorm = "success";
        else if (orderStatusRaw?.toLowerCase() === "aborted") statusNorm = "aborted";

        if (!orderId) {
            const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("missing_order_id")}`;
            return res.status(200).send(htmlRedirect(failUrl));
        }

        // Load order
        const { data: order, error: orderErr } = await supabase
            .from("ccavenue_orders")
            .select("order_id,purpose,amount_inr,currency,status,tracking_id,yatra_registration_id,event_registration_id")
            .eq("order_id", orderId)
            .maybeSingle();

        if (orderErr || !order) {
            const failUrl = `${siteUrl}/payment/failure?order_id=${encodeURIComponent(orderId)}&reason=${encodeURIComponent("order_not_found")}`;
            return res.status(200).send(htmlRedirect(failUrl));
        }

        const nowIso = new Date().toISOString();

        // Update order
        await supabase
            .from("ccavenue_orders")
            .update({
                status: statusNorm,
                tracking_id: trackingId,
                enc_response: encResp, // storing the hex response
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

                // Trigger email if possible later
            }

            // Handle event payment similarly if implemented...
        }

        const destination = statusNorm === "success"
            ? `${siteUrl}/payment/success`
            : `${siteUrl}/payment/failure`;

        const qs = new URLSearchParams();
        qs.set("order_id", orderId);
        qs.set("purpose", order.purpose);
        if (trackingId) qs.set("tracking_id", trackingId);
        if (orderStatusRaw) qs.set("order_status", orderStatusRaw);

        const redirectUrl = `${destination}?${qs.toString()}`;
        return res.status(200).send(htmlRedirect(redirectUrl));

    } catch (error) {
        console.error("Payment Handle Error:", error);
        const siteUrl = (process.env.SITE_URL ?? "https://rityatra.in").replace(/\/+$/, "");
        const failUrl = `${siteUrl}/payment/failure?reason=${encodeURIComponent("callback_error")}`;
        return res.status(200).send(htmlRedirect(failUrl));
    }
}
