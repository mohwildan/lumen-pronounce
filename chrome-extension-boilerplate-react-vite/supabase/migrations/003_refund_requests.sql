-- Migration: create refund_requests table
-- Run: supabase db push

create table if not exists public.refund_requests (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  reason      text not null,
  note        text not null default '',
  status      text not null default 'pending',  -- pending | approved | rejected
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: only service role can read/write (no public access)
alter table public.refund_requests enable row level security;

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_refund_requests_updated_at
  before update on public.refund_requests
  for each row execute procedure public.set_updated_at();

-- Index for quick lookup by email
create index if not exists idx_refund_requests_email on public.refund_requests (email);
