-- Allow developers to read all profiles so they can see user names in the chat list
create policy "Developers can read all profiles"
  on public.profiles
  for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_developer = true)
  );
