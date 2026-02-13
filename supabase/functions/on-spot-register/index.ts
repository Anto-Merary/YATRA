import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const {
            pin,
            name,
            email,
            phone,
            college,
            amount,
            payment_mode
        } = await req.json();

        // 1. PIN Verification
        const ADMIN_PIN = Deno.env.get("VITE_ADMIN_PIN") || "9876";
        if (pin !== ADMIN_PIN) {
            return new Response(JSON.stringify({ error: "Invalid Admin PIN" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // 2. Setup Supabase Client (Service Role for Admin Access)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const emailLower = email.trim().toLowerCase();

        // 3. Check if user exists
        let { data: existingUser, error: fetchError } = await supabase
            .from("registrations")
            .select("id, payment_status")
            .eq("email", emailLower)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let registrationId = existingUser?.id;
        let isNewUser = !existingUser;

        const uniqueUtr = `ONSPOT-${payment_mode.toUpperCase()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

        if (existingUser) {
            // Update existing user
            const { error: updateError } = await supabase
                .from("registrations")
                .update({
                    payment_status: "paid",
                    payment_confirmed_at: new Date().toISOString(),
                    payment_utr: uniqueUtr,
                    // Update basic details if provided? Let's keep it simple and just update payment for now as per python script logic which updates payment status
                    // Python script logic: updates payment_status, payment_confirmed_at, payment_utr
                })
                .eq("id", registrationId);

            if (updateError) throw updateError;
        } else {
            // Create new user
            const { data: newUser, error: createError } = await supabase
                .from("registrations")
                .insert({
                    name: name,
                    email: emailLower,
                    phone: phone,
                    college: college,
                    payment_status: "paid",
                    price: amount,
                    payment_confirmed_at: new Date().toISOString(),
                    payment_utr: uniqueUtr,
                    ticket_generated: false
                })
                .select("id")
                .single();

            if (createError) throw createError;
            registrationId = newUser.id;
        }

        // 4. Trigger Email Logic (Invoke existing function or internal logic)
        // We can directly invoke the other function via fetch to keep logic DRY
        // The previous python script called it after this.
        // However, since we are already in an Edge Function, we can just call the email function endpoint.

        // Construct the payload for send-registration-email
        const emailPayload = {
            id: registrationId,
            name: name,
            email: emailLower,
            phone: phone,
            college: college,
            ticket_type: "On Spot",
            price: amount,
            is_rit_student: false, // Defaulting to false for on-spot tool based on python script logic
            created_at: new Date().toISOString()
        };

        // Invoke send-registration-email
        const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-registration-email`;
        const emailResponse = await fetch(emailFunctionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`, // Use Service Key to bypass auth checks in invoked function if any
            },
            body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
            const errText = await emailResponse.text();
            console.error("Email function failed:", errText);
            // We still return success for registration, but warn about email
            return new Response(JSON.stringify({
                success: true,
                message: "Registration successful, but email sending failed. Please check logs.",
                registration_id: registrationId
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const emailResult = await emailResponse.json();

        return new Response(JSON.stringify({
            success: true,
            message: "Registration successful and Ticket Sent!",
            registration_id: registrationId,
            email_result: emailResult
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
