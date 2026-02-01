import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// CCAvenue-compatible URL encoding helper
function ccavenueEncode(key: string, value: string | number | null | undefined): string {
    if (!value) return `${key}=`;
    const strValue = String(value);

    // Standard encode to handle &, =, and unicode
    let encoded = encodeURIComponent(strValue);

    // Custom fixes for CCAvenue legacy compatibility:
    encoded = encoded.replace(/%20/g, "+");  // Convert '%20' (space) to '+'
    encoded = encoded.replace(/%40/g, "@");  // Keep '@' clean for emails
    encoded = encoded.replace(/%2E/g, ".");  // Keep dots
    encoded = encoded.replace(/%2D/g, "-");  // Keep dashes

    return `${key}=${encoded}`;
}


// Vercel Serverless Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Headers
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

            // Sanitize name for CCAvenue billing (alphanumeric + spaces only)
            const safeBillingName = (name || "NA")
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
                ccavenueEncode("merchant_id", merchantId),
                ccavenueEncode("order_id", orderId),
                ccavenueEncode("currency", "INR"),
                ccavenueEncode("amount", formattedAmount),
                ccavenueEncode("redirect_url", callbackUrl),
                ccavenueEncode("cancel_url", callbackUrl),
                ccavenueEncode("language", "EN"),

                // Billing Details
                ccavenueEncode("billing_name", safeBillingName),
                ccavenueEncode("billing_email", email),
                ccavenueEncode("billing_tel", phone),
                ccavenueEncode("billing_address", ccavenueCollege),
                ccavenueEncode("billing_city", "Chennai"),
                ccavenueEncode("billing_state", "TN"),
                ccavenueEncode("billing_zip", "600001"),
                ccavenueEncode("billing_country", "India"),

                // Delivery Details (Mirror Billing)
                ccavenueEncode("delivery_name", safeBillingName),
                ccavenueEncode("delivery_address", ccavenueCollege),
                ccavenueEncode("delivery_city", "Chennai"),
                ccavenueEncode("delivery_state", "TN"),
                ccavenueEncode("delivery_zip", "600001"),
                ccavenueEncode("delivery_country", "India"),
                ccavenueEncode("delivery_tel", phone),

                // Merchant Params
                ccavenueEncode("merchant_param1", "yatra_entry"),
                ccavenueEncode("merchant_param2", upserted.id),
                ccavenueEncode("merchant_param3", siteUrl)
            ];

            // Join to create the final data string
            const merchantData = merchantParams.join('&');

            // DEBUG: Log this - should look like: billing_name=Anto+Merary+S&billing_email=anto@test.com
            console.log("Sanitized Merchant Data:", merchantData);

            // Native Node.js Crypto Implementation (matches ccavutil.js exactly)
            const crypto = await import("node:crypto");
            const m = crypto.createHash("md5");
            m.update(workingKey);
            // Use raw buffer digest - EXACTLY like official CCAvenue SDK
            const key = m.digest();  // Returns raw 16-byte Buffer, not hex string
            const iv = Buffer.from('\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f', 'binary');

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
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        return res.status(500).json({ error: message });
    }
}
