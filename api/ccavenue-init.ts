import { createClient } from "@supabase/supabase-js";


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
        const merchantId = process.env.CCAVENUE_MERCHANT_ID?.trim();
        const accessCode = process.env.CCAVENUE_ACCESS_CODE?.trim();
        const workingKey = process.env.CCAVENUE_WORKING_KEY?.trim();
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

        // Common fields - sanitize for CCAvenue (alphanumeric + basic punctuation only)
        const rawName = String(body?.name ?? "").trim();
        const rawEmail = String(body?.email ?? "").trim().toLowerCase();
        const rawPhone = String(body?.phone ?? "").replace(/\D/g, "").trim();

        // Sanitize name for CCAvenue: only letters, numbers, spaces, and basic punctuation
        const name = rawName.replace(/[^a-zA-Z0-9\s.'-]/g, " ").replace(/\s+/g, " ").trim();
        const email = rawEmail; // Email format is standardized, keep as-is
        const phone = rawPhone;
        const college = typeof body?.college === "string" ? body.college.trim() : "";
        const register_number = typeof body?.register_number === "string"
            ? body.register_number.trim() || null
            : null;

        if (!name || !email || !phone || phone.length !== 10) {
            return res.status(400).json({ error: "Missing/invalid name, email, or phone" });
        }

        // Callback URL points to the NEW Vercel API route
        // Hardcoded to match the whitelist EXACTLY: https://www.rityatra.in
        const callbackUrl = `https://www.rityatra.in/api/ccavenue-handle`;
        // Numeric-only order id to satisfy CCAvenue validation (keep it short: 14 digits).
        const orderId = `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

        if (purpose === "yatra_entry") {
            const institutionType = String(body?.institution_type ?? "").toLowerCase();
            const institutionNameByType = {
                rit: "Rajalakshmi Institute of Technology (RIT)",
                rec: "Rajalakshmi Engineering College (REC)",
                rsb: "Rajalakshmi School of Business (RSB)",
                rsa: "Rajalakshmi School of Architecture (RSA)",
                rmchri: "Rajalakshmi Medical College (RMCHRI)",
                other: "",
            };
            // Added rmchri
            if (!["rit", "rec", "rsb", "rsa", "rmchri", "other"].includes(institutionType)) {
                return res.status(400).json({ error: "Invalid institution_type" });
            }
            if (institutionType === "other" && !college) {
                return res.status(400).json({ error: "College name is required for Other" });
            }
            const normalizedCollege = college || institutionNameByType[institutionType] || "";
            const ccavenueCollege = (normalizedCollege || "NA")
                .replace(/[^a-zA-Z0-9\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

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
                        college: normalizedCollege,
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

            const formattedAmount = Number(amountInr).toFixed(2);

            const merchantParams = [
                `merchant_id=${merchantId}`,
                `order_id=${orderId}`,
                `currency=INR`,
                `amount=${formattedAmount}`,
                `redirect_url=${callbackUrl}`,
                `cancel_url=${callbackUrl}`,
                `language=EN`,
                `billing_name=${safeBillingName}`,
                `billing_email=${email}`,
                `billing_tel=${phone}`,
                `billing_address=${ccavenueCollege}`,
                `billing_city=Chennai`,
                `billing_state=TN`,
                `billing_zip=600001`,
                `billing_country=India`,
                `delivery_name=${safeBillingName}`,
                `delivery_address=${ccavenueCollege}`,
                `delivery_city=Chennai`,
                `delivery_state=TN`,
                `delivery_zip=600001`,
                `delivery_country=India`,
                `delivery_tel=${phone}`,
                `merchant_param1=yatra_entry`,
                `merchant_param2=${upserted.id}`,
                `merchant_param3=${siteUrl}`
            ];

            // Join with '&' directly. 
            // No extra encoding for @ or spaces (unless you explicitly add it).
            const merchantData = merchantParams.join('&');

            // DEBUG: Log this to see exactly what is being encrypted
            console.log("Raw Merchant Data:", merchantData);

            // Native Node.js Crypto Implementation (matches ccavutil.js exactly)
            const crypto = await import("node:crypto");
            const m = crypto.createHash("md5");
            m.update(workingKey);
            // Use 'binary' encoding to match CCAvenue SDK exactly
            const key = Buffer.from(m.digest('hex'), 'hex');
            const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);

            const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
            let encRequest = cipher.update(merchantData, "utf8", "hex");
            encRequest += cipher.final("hex");

            await supabase
                .from("ccavenue_orders")
                .update({ enc_request: encRequest })
                .eq("order_id", orderId);

            // TEST URL - credentials from email are for TEST environment only
            const action = "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

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
