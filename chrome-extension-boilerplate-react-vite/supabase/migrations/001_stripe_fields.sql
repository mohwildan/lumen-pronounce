alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_id text,
  add column if not exists subscription_status text default 'inactive';
