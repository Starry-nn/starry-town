-- Starry Town guest book. Run once in Supabase → SQL Editor.
-- Before running: replace YOUR_EMAIL below with the email you will sign in with in the private town.

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 24),
  species text not null check (species in ('cat', 'fox', 'bunny', 'bear', 'frog')),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  accent text not null check (accent ~ '^#[0-9a-fA-F]{6}$'),
  message text not null check (char_length(message) between 1 and 600),
  contact text check (char_length(contact) <= 120),
  postcard text check (char_length(postcard) <= 400000),
  lang text check (char_length(lang) <= 5)
);

alter table public.guests enable row level security;

-- Visitors may add a note. They can never read, change or delete one.
create policy "visitors can leave a note" on public.guests for insert to anon with check (true);

-- Only the owner, signed in with this exact email, can read and delete.
create policy "owner reads" on public.guests for select to authenticated using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL');
create policy "owner deletes" on public.guests for delete to authenticated using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL');
