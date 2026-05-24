-- Drop the bad policy causing infinite recursion
drop policy if exists "Developers can read all profiles" on public.profiles;

-- Create a security definer function to check developer status safely
create or replace function public.is_current_user_developer()
returns boolean
language plpgsql
security definer
as $$
declare
  is_dev boolean;
begin
  select is_developer into is_dev from public.profiles where id = auth.uid();
  return coalesce(is_dev, false);
end;
$$;

-- Add a safe policy for developers
create policy "Developers can read all profiles"
  on public.profiles
  for select
  using (
    public.is_current_user_developer()
  );

-- Update messages policy to also use the safe function
drop policy if exists "Users can read their own messages or devs can read all" on public.messages;
create policy "Users can read their own messages or devs can read all" 
  on public.messages
  for select 
  using (
    auth.uid() = user_id 
    or public.is_current_user_developer()
  );
