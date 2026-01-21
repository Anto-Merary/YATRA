import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function requireAdminEmail(req: Request): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : authHeader;
  if (!jwt) throw new Error("Missing Authorization bearer token");

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user?.email) {
    throw new Error("Unauthorized: invalid user token");
  }

  const email = data.user.email.toLowerCase();
  const masterAdmin = (Deno.env.get("MASTER_ADMIN_EMAIL") ?? "meraryanto@gmail.com")
    .toLowerCase();
  if (email === masterAdmin) return email;

  const { data: isAdmin, error: rpcError } = await supabase.rpc(
    "check_is_admin",
    { user_email: email },
  );
  if (rpcError) throw new Error("Unauthorized: admin check failed");
  if (!isAdmin) throw new Error("Unauthorized: not an admin");

  return email;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminEmail = await requireAdminEmail(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const registrationId = (body?.registration_id ?? "") as string;

    if (!registrationId) {
      return new Response(
        JSON.stringify({ error: "registration_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch registration
    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("id,email,name,payment_status,checked_in_at")
      .eq("id", registrationId)
      .maybeSingle();

    if (regErr) throw new Error(`Failed to fetch registration: ${regErr.message}`);
    if (!reg) {
      return new Response(
        JSON.stringify({ ok: false, status: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if ((reg.payment_status ?? "unpaid") !== "paid") {
      return new Response(
        JSON.stringify({ ok: false, status: "not_paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ticket exists and is valid
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select("id,ticket_status,code_6_digit")
      .eq("registration_id", registrationId)
      .maybeSingle();

    if (ticketErr) throw new Error(`Failed to fetch ticket: ${ticketErr.message}`);
    if (!ticket) {
      return new Response(
        JSON.stringify({ ok: false, status: "no_ticket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (ticket.ticket_status && String(ticket.ticket_status) !== "valid" && String(ticket.ticket_status) !== "used") {
      return new Response(
        JSON.stringify({ ok: false, status: "ticket_invalid", ticket_status: ticket.ticket_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (reg.checked_in_at) {
      return new Response(
        JSON.stringify({ ok: true, status: "already_checked_in", checked_in_at: reg.checked_in_at }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const nowIso = new Date().toISOString();

    // Atomic check-in: only update if checked_in_at is still null
    const { data: updated, error: updErr } = await supabase
      .from("registrations")
      .update({
        checked_in_at: nowIso,
        checked_in_by: adminEmail,
      })
      .eq("id", registrationId)
      .is("checked_in_at", null)
      .select("id,checked_in_at")
      .maybeSingle();

    if (updErr) throw new Error(`Failed to check in: ${updErr.message}`);

    if (!updated) {
      // Race / already checked in
      return new Response(
        JSON.stringify({ ok: true, status: "already_checked_in" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Best-effort: mark ticket used
    try {
      await supabase
        .from("tickets")
        .update({ ticket_status: "used" })
        .eq("registration_id", registrationId);
    } catch {
      // ignore
    }

    return new Response(
      JSON.stringify({
        ok: true,
        status: "checked_in",
        checked_in_at: updated.checked_in_at,
        ticket_code: ticket.code_6_digit,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

