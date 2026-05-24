-- Add is_developer flag to profiles
alter table public.profiles
  add column if not exists is_developer boolean default false;

-- Create messages table for chat
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null, -- The normal user involved in the chat
    sender_id uuid references public.profiles(id) on delete cascade not null, -- Who actually sent the message
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Drop existing policies if they exist (for rerunnability)
drop policy if exists "Users can read their own messages or devs can read all" on public.messages;
drop policy if exists "Users can insert their own messages" on public.messages;

-- Policy: Users can see messages where they are the user_id, OR if they are a developer
create policy "Users can read their own messages or devs can read all" 
  on public.messages
  for select 
  using (
    auth.uid() = user_id 
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_developer = true)
  );

-- Policy: Users can insert messages if they are the sender, AND (they are the user_id OR they are a developer)
create policy "Users can insert their own messages" 
  on public.messages
  for insert 
  with check (
    auth.uid() = sender_id and
    (
      auth.uid() = user_id
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_developer = true)
    )
  );
