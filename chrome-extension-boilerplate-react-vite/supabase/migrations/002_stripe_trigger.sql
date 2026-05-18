-- Add Stripe columns
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists subscription_id text,
  add column if not exists subscription_status text default 'inactive';

-- Backfill profiles for existing auth users
insert into public.profiles (id, email, tier)
select id, email, 'free'
from auth.users
on conflict (id) do nothing;

-- Auto-create profile on new sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, tier)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
