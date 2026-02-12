import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailLog {
    created_at: string;
    status: string;
    to_email: string;
    error_text: string | null;
    registrations: {
        name: string;
        college: string;
        phone: string;
    } | null;
}

// Helper to escape CSV fields
function escapeCsvField(field: string | null | undefined): string {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (stringField.includes(",") || stringField.includes('"') || stringField.includes("\n")) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // 1. Auth Check
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        }

        const authHeader = req.headers.get("Authorization") ?? "";
        const jwt = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader;

        if (!jwt) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: userData, error: userError } = await supabase.auth.getUser(jwt);

        if (userError || !userData.user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const email = userData.user.email?.toLowerCase();
        const masterAdmin = (Deno.env.get("MASTER_ADMIN_EMAIL") ?? "meraryanto@gmail.com").toLowerCase();

        // Check if admin
        if (email !== masterAdmin) {
            const { data: isAdmin, error: rpcError } = await supabase.rpc(
                "check_is_admin",
                { user_email: email }
            );

            if (rpcError || !isAdmin) {
                return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 2. Fetch Data
        // Join ticket_email_events with registrations
        const { data, error } = await supabase
            .from("ticket_email_events")
            .select(`
        created_at,
        status,
        to_email,
        error_text,
        registrations (
          name,
          college,
          phone
        )
      `)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        // 3. Convert to CSV
        const csvRows = [
            ["Timestamp", "Status", "Email", "Name", "College", "Phone", "Error Reason"],
        ];

        const logs = data as unknown as EmailLog[];

        for (const log of logs) {
            csvRows.push([
                log.created_at,
                log.status,
                log.to_email,
                log.registrations?.name ?? "N/A",
                log.registrations?.college ?? "N/A",
                log.registrations?.phone ?? "N/A",
                log.error_text ?? ""
            ]);
        }

        const csvString = csvRows
            .map(row => row.map(escapeCsvField).join(","))
            .join("\n");

        // 4. Return CSV
        return new Response(csvString, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="email_logs_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: errorMsg }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
