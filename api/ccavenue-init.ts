import { createClient } from "@supabase/supabase-js";
import CryptoJS from "crypto-js";

// Vercel Serverless Function Handler
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST BE SET IN VERCEL
        const merchantId = process.env.CCAVENUE_MERCHANT_ID;
        const accessCode = process.env.CCAVENUE_ACCESS_CODE;
        const workingKey = process.env.CCAVENUE_WORKING_KEY;
        const siteUrl = (process.env.SITE_URL ?? "https://rityatra.in").replace(/\/+$/, "");

        if (!supabaseUrl || !serviceKey || !merchantId || !accessCode || !workingKey) {
            console.error("Missing environment variables");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const supabase = createClient(supabaseUrl, serviceKey);

        const body = req.body;
        const purpose = body?.purpose;

        if (!purpose || (purpose !== "yatra_entry" && purpose !== "event")) {
            return res.status(400).json({ error: "Invalid purpose" });
        }

        // Common fields
        const name = String(body?.name ?? "").trim();
        const email = String(body?.email ?? "").trim().toLowerCase();
        const phone = String(body?.phone ?? "").replace(/\D/g, "").trim();
        const college = String(body?.college ?? "").trim();
        const register_number = String(body?.register_number ?? "").trim() || null;

        if (!name || !email || !phone || phone.length !== 10) {
            return res.status(400).json({ error: "Missing/invalid name, email, or phone" });
        }

        // Callback URL points to the NEW Vercel API route
        const callbackUrl = `${siteUrl}/api/ccavenue-handle`;
        const orderId = `YATRA${Date.now()}${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;

        if (purpose === "yatra_entry") {
            const institutionType = String(body?.institution_type ?? "").toLowerCase();
            // Added rmchri
            if (!["rit", "rec", "rsb", "rsa", "rmchri", "other"].includes(institutionType)) {
                return res.status(400).json({ error: "Invalid institution_type" });
            }
            if (institutionType === "other" && !college) {
                return res.status(400).json({ error: "College name is required for Other" });
            }

            // Override price to 1 INR for all yatra entries as requested
            const amountInr = 1;

            // Idempotency: if already paid for yatra entry, short-circuit
            const { data: existing } = await supabase
                .from("registrations")
                .select("id,payment_status,ticket_type")
                .eq("email", email)
                .maybeSingle();

            if (existing?.payment_status === "paid" && String(existing.ticket_type ?? "") === "Yatra Entry") {
                return res.status(200).json({
                    ok: true,
                    already_paid: true,
                    purpose,
                    registration_id: existing.id,
                    redirect: `${siteUrl}/payment/success?purpose=yatra_entry&already_paid=1`,
                });
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
                        is_rit_student: institutionType === "rit",
                        payment_status: "unpaid",
                        payment_confirmed_at: null,
                        payment_utr: null,
                        payment_batch_id: null,
                        ticket_generated: false,
                        ticket_email_sent: false,
                        ticket_sent_at: null,
                        register_number: register_number,
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

            const merchantData = `merchant_id=${merchantId}&order_id=${orderId}&currency=INR&amount=${amountInr}&redirect_url=${callbackUrl}&cancel_url=${callbackUrl}&language=EN&billing_name=${name}&billing_email=${email}&billing_tel=${phone}&billing_address=${college}&billing_country=India&merchant_param1=yatra_entry&merchant_param2=${upserted.id}&merchant_param3=${siteUrl}`;

            // Encryption Logic (AES-128-CBC)
            const keyBytes = CryptoJS.MD5(workingKey);
            const iv = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607, 0x08090a0b, 0x0c0d0e0f]);
            const encrypted = CryptoJS.AES.encrypt(merchantData, keyBytes, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            const encRequest = encrypted.ciphertext.toString(CryptoJS.enc.Hex);

            await supabase
                .from("ccavenue_orders")
                .update({ enc_request: encRequest })
                .eq("order_id", orderId);

            const action = "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

            return res.status(200).json({
                ok: true,
                mode: "form",
                purpose,
                order_id: orderId,
                action,
                encRequest,
                access_code: accessCode,
            });
        }

        // Logic for other purposes (events) can be added here similarly if needed
        // ...

        return res.status(500).json({ error: "Not implemented fully for this purpose" });

    } catch (error) {
        console.error("Payment Init Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
