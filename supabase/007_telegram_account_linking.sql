alter table public.user_profiles
  add column if not exists telegram_user_id bigint unique,
  add column if not exists telegram_username text not null default '',
  add column if not exists telegram_verified_at timestamptz;

create table if not exists public.telegram_link_tokens (
  token text primary key,
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  telegram_user_id bigint,
  telegram_username text not null default ''
);

create index if not exists telegram_link_tokens_profile_idx
  on public.telegram_link_tokens(profile_id, created_at desc);

alter table public.telegram_link_tokens enable row level security;

drop policy if exists "telegram_link_tokens_owner_select" on public.telegram_link_tokens;
create policy "telegram_link_tokens_owner_select"
  on public.telegram_link_tokens
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "telegram_link_tokens_owner_insert" on public.telegram_link_tokens;
create policy "telegram_link_tokens_owner_insert"
  on public.telegram_link_tokens
  for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "telegram_link_tokens_owner_delete" on public.telegram_link_tokens;
create policy "telegram_link_tokens_owner_delete"
  on public.telegram_link_tokens
  for delete
  to authenticated
  using (profile_id = auth.uid());
