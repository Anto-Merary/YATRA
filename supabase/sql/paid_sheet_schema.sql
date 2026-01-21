-- Paid-sheet source-of-truth schema additions for YATRA 2026
-- Run this in Supabase SQL Editor (public schema).
-- Safe to re-run: uses IF NOT EXISTS where possible.

-- 1) Batches: each upload/import session
create table if not exists public.payment_batches (
  id uuid primary key default gen_random_uuid(),
  uploaded_by text not null,
  uploaded_at timestamptz not null default now(),
  source_filename text,
  row_count integer not null default 0,
  notes text
);

alter table public.payment_batches enable row level security;

-- 2) Batch rows: audit trail + reconciliation details per row
create table if not exists public.payment_batch_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.payment_batches(id) on delete cascade,
  row_number integer not null,
  raw_json jsonb not null,
  utr text,
  email text,
  phone text,
  registration_id uuid,
  row_status text not null default 'imported',
  error_text text,
  created_at timestamptz not null default now()
);

alter table public.payment_batch_rows enable row level security;

create index if not exists idx_payment_batch_rows_batch_id on public.payment_batch_rows(batch_id);
create index if not exists idx_payment_batch_rows_utr on public.payment_batch_rows(utr);
create index if not exists idx_payment_batch_rows_email on public.payment_batch_rows(email);
create index if not exists idx_payment_batch_rows_phone on public.payment_batch_rows(phone);

-- 3) Email events: verifiable send/failed state per attempt
create table if not exists public.ticket_email_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null,
  ticket_id uuid,
  to_email text not null,
  status text not null,
  error_text text,
  created_at timestamptz not null default now()
);

alter table public.ticket_email_events enable row level security;

create index if not exists idx_ticket_email_events_registration_id on public.ticket_email_events(registration_id);
create index if not exists idx_ticket_email_events_status on public.ticket_email_events(status);
create index if not exists idx_ticket_email_events_created_at on public.ticket_email_events(created_at);

-- 4) Extend registrations for payment + check-in
alter table public.registrations
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_utr text,
  add column if not exists payment_batch_id uuid,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by text;

-- Add FK to batches (if it doesn't already exist)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registrations_payment_batch_id_fkey'
  ) then
    alter table public.registrations
      add constraint registrations_payment_batch_id_fkey
      foreign key (payment_batch_id) references public.payment_batches(id) on delete set null;
  end if;
end $$;

-- Payment status check constraint (if it doesn't already exist)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registrations_payment_status_check'
  ) then
    alter table public.registrations
      add constraint registrations_payment_status_check
      check (payment_status in ('unpaid', 'paid', 'refunded'));
  end if;
end $$;

-- Unique UTR (allows multiple NULLs)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registrations_payment_utr_key'
  ) then
    alter table public.registrations
      add constraint registrations_payment_utr_key unique (payment_utr);
  end if;
end $$;

create index if not exists idx_registrations_payment_status on public.registrations(payment_status);
create index if not exists idx_registrations_checked_in_at on public.registrations(checked_in_at);

-- 5) Optional: mark ticket as used on check-in (no schema change needed if ticket_status exists)
-- If your tickets table does not have ticket_status, add it separately.

-- RLS policies (simple: authenticated users can read; edge functions use service role and bypass RLS)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_batches' and policyname = 'Allow authenticated read payment_batches'
  ) then
    create policy "Allow authenticated read payment_batches"
      on public.payment_batches for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_batch_rows' and policyname = 'Allow authenticated read payment_batch_rows'
  ) then
    create policy "Allow authenticated read payment_batch_rows"
      on public.payment_batch_rows for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ticket_email_events' and policyname = 'Allow authenticated read ticket_email_events'
  ) then
    create policy "Allow authenticated read ticket_email_events"
      on public.ticket_email_events for select
      to authenticated
      using (true);
  end if;
end $$;

