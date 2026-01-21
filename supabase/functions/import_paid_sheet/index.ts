import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PaidSheetRow = {
  name?: string;
  email?: string;
  phone?: string;
  college?: string;
  utr?: string;
  [key: string]: unknown;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

function normalizeUtr(utr: string): string {
  return utr.trim();
}

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

  // Master admin bypass (kept consistent with frontend)
  const masterAdmin = (Deno.env.get("MASTER_ADMIN_EMAIL") ?? "meraryanto@gmail.com")
    .toLowerCase();
  if (email === masterAdmin) return email;

  // Optional: server-side admin check via RPC (recommended)
  const { data: isAdmin, error: rpcError } = await supabase.rpc(
    "check_is_admin",
    { user_email: email },
  );
  if (rpcError) {
    throw new Error("Unauthorized: admin check failed");
  }
  if (!isAdmin) {
    throw new Error("Unauthorized: not an admin");
  }

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
    const rows = (body?.rows ?? []) as PaidSheetRow[];
    const sourceFilename = (body?.source_filename ?? null) as string | null;
    const notes = (body?.notes ?? null) as string | null;

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "rows array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create batch
    const { data: batch, error: batchError } = await supabase
      .from("payment_batches")
      .insert({
        uploaded_by: adminEmail,
        source_filename: sourceFilename,
        row_count: rows.length,
        notes,
      })
      .select("id")
      .single();

    if (batchError || !batch?.id) {
      throw new Error(`Failed to create payment batch: ${batchError?.message ?? "unknown"}`);
    }

    const batchId = batch.id as string;

    // Pre-scan UTRs for file-level duplicates and DB duplicates
    const fileUtrToFirstRow = new Map<string, number>();
    const uniqueUtrs: string[] = [];
    const fileDuplicateUtrs = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const utrRaw = rows[i]?.utr ? String(rows[i].utr) : "";
      const utr = utrRaw ? normalizeUtr(utrRaw) : "";
      if (!utr) continue;
      if (fileUtrToFirstRow.has(utr)) {
        fileDuplicateUtrs.add(utr);
      } else {
        fileUtrToFirstRow.set(utr, i + 1);
        uniqueUtrs.push(utr);
      }
    }

    // Fetch existing UTRs in DB for idempotency
    const existingByUtr = new Map<string, { id: string; email: string | null }>();
    if (uniqueUtrs.length > 0) {
      // Chunk to avoid URL limits
      const chunkSize = 200;
      for (let i = 0; i < uniqueUtrs.length; i += chunkSize) {
        const chunk = uniqueUtrs.slice(i, i + chunkSize);
        const { data: existingRegs, error: existingErr } = await supabase
          .from("registrations")
          .select("id,email,payment_utr")
          .in("payment_utr", chunk);
        if (existingErr) {
          throw new Error(`Failed to check existing UTRs: ${existingErr.message}`);
        }
        for (const r of existingRegs ?? []) {
          if (r.payment_utr) {
            existingByUtr.set(String(r.payment_utr), {
              id: String(r.id),
              email: r.email ? String(r.email) : null,
            });
          }
        }
      }
    }

    const nowIso = new Date().toISOString();
    const batchRowsToInsert: any[] = [];

    const summary = {
      batch_id: batchId,
      total_rows: rows.length,
      created_or_updated: 0,
      already_imported_utr: 0,
      duplicate_utr_in_file: 0,
      invalid_rows: 0,
      errors: [] as Array<{ row_number: number; reason: string }>,
    };

    for (let idx = 0; idx < rows.length; idx++) {
      const rowNumber = idx + 1;
      const row = rows[idx] ?? {};

      const name = row.name ? String(row.name).trim() : "";
      const emailRaw = row.email ? String(row.email) : "";
      const phoneRaw = row.phone ? String(row.phone) : "";
      const college = row.college ? String(row.college).trim() : "";
      const utrRaw = row.utr ? String(row.utr) : "";

      const utr = utrRaw ? normalizeUtr(utrRaw) : "";
      const email = emailRaw ? normalizeEmail(emailRaw) : "";
      const phone = phoneRaw ? normalizePhone(phoneRaw) : "";

      const baseAudit = {
        batch_id: batchId,
        row_number: rowNumber,
        raw_json: row,
        utr: utr || null,
        email: email || null,
        phone: phone || null,
      } as any;

      if (!utr) {
        summary.invalid_rows++;
        summary.errors.push({ row_number: rowNumber, reason: "Missing UTR" });
        batchRowsToInsert.push({
          ...baseAudit,
          row_status: "invalid",
          error_text: "Missing UTR",
        });
        continue;
      }

      if (fileDuplicateUtrs.has(utr)) {
        summary.duplicate_utr_in_file++;
        batchRowsToInsert.push({
          ...baseAudit,
          row_status: "duplicate_utr_in_file",
          error_text:
            `Duplicate UTR within file (first seen at row ${fileUtrToFirstRow.get(utr)})`,
        });
        continue;
      }

      if (!email || !phone || !college || !name) {
        summary.invalid_rows++;
        const missing = [
          !name ? "name" : null,
          !email ? "email" : null,
          !phone ? "phone" : null,
          !college ? "college" : null,
        ].filter(Boolean).join(", ");
        const reason = `Missing required fields: ${missing}`;
        summary.errors.push({ row_number: rowNumber, reason });
        batchRowsToInsert.push({
          ...baseAudit,
          row_status: "invalid",
          error_text: reason,
        });
        continue;
      }

      // Idempotency: UTR already present in DB
      const existing = existingByUtr.get(utr);
      if (existing) {
        summary.already_imported_utr++;
        batchRowsToInsert.push({
          ...baseAudit,
          registration_id: existing.id,
          row_status: "already_imported_utr",
          error_text: null,
        });
        continue;
      }

      // Upsert registration keyed by email (sheet is source of truth)
      const { data: upserted, error: upsertError } = await supabase
        .from("registrations")
        .upsert(
          [{
            name,
            email,
            phone,
            college,
            ticket_type: "Event",
            price: null,
            is_rit_student: null,
            payment_status: "paid",
            payment_confirmed_at: nowIso,
            payment_utr: utr,
            payment_batch_id: batchId,
          }],
          { onConflict: "email" },
        )
        .select("id,email");

      if (upsertError || !upserted || upserted.length === 0) {
        summary.invalid_rows++;
        const reason = `Registration upsert failed: ${upsertError?.message ?? "unknown"}`;
        summary.errors.push({ row_number: rowNumber, reason });
        batchRowsToInsert.push({
          ...baseAudit,
          row_status: "upsert_failed",
          error_text: reason,
        });
        continue;
      }

      const regId = String(upserted[0].id);
      summary.created_or_updated++;
      batchRowsToInsert.push({
        ...baseAudit,
        registration_id: regId,
        row_status: "imported",
        error_text: null,
      });

      // Mark this UTR as taken for the remainder of the import loop
      existingByUtr.set(utr, { id: regId, email });
    }

    // Insert audit rows in chunks
    const auditChunkSize = 500;
    for (let i = 0; i < batchRowsToInsert.length; i += auditChunkSize) {
      const chunk = batchRowsToInsert.slice(i, i + auditChunkSize);
      const { error: auditError } = await supabase
        .from("payment_batch_rows")
        .insert(chunk);
      if (auditError) {
        throw new Error(`Failed to write payment_batch_rows audit: ${auditError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...summary }),
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

