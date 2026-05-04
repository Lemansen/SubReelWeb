create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_login(value text)
returns text
language sql
immutable
as $$
  select trim(both '_' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9_]+', '_', 'g'));
$$;

create or replace function public.ensure_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  login_candidate text;
  nickname_candidate text;
  providers_text text;
begin
  login_candidate := public.normalize_login(
    coalesce(
      new.raw_user_meta_data ->> 'login',
      split_part(coalesce(new.email, ''), '@', 1),
      replace(new.id::text, '-', '')
    )
  );

  if login_candidate = '' then
    login_candidate := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  nickname_candidate := coalesce(
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    nullif(new.raw_user_meta_data ->> 'login', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    login_candidate
  );

  providers_text := coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb)::text;

  insert into public.user_profiles (
    id,
    login,
    email,
    nickname,
    role,
    microsoft_connected,
    created_at,
    updated_at,
    last_login_at
  )
  values (
    new.id,
    login_candidate,
    coalesce(new.email, ''),
    nickname_candidate,
    'player',
    providers_text ilike '%azure%',
    coalesce(new.created_at, timezone('utc', now())),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    email = excluded.email,
    nickname = excluded.nickname,
    microsoft_connected = excluded.microsoft_connected,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_created on auth.users;
create trigger on_auth_user_profile_created
after insert or update on auth.users
for each row execute function public.ensure_profile_for_auth_user();

create table if not exists public.auth_accounts (
  id text primary key,
  login text not null,
  email text not null,
  role text not null default 'player' check (role in ('player', 'moderator', 'admin')),
  status text not null default 'active' check (status in ('active', 'blocked', 'deleted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists auth_accounts_login_lower_idx on public.auth_accounts ((lower(login)));
create unique index if not exists auth_accounts_email_lower_idx on public.auth_accounts ((lower(email)));

create table if not exists public.auth_profiles (
  account_id text primary key references public.auth_accounts(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  locale text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_credentials (
  account_id text primary key references public.auth_accounts(id) on delete cascade,
  password_hash text not null,
  password_updated_at timestamptz not null default timezone('utc', now()),
  microsoft_connected boolean not null default false
);

create table if not exists public.auth_launcher_tokens (
  account_id text primary key references public.auth_accounts(id) on delete cascade,
  token text not null unique,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_devices (
  id text primary key,
  account_id text not null references public.auth_accounts(id) on delete cascade,
  client_kind text not null check (client_kind in ('website', 'launcher', 'mobile')),
  platform text not null check (platform in ('web', 'windows', 'android', 'ios', 'linux', 'macos', 'unknown')),
  device_name text,
  device_key text unique,
  push_token text,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create index if not exists auth_devices_account_idx on public.auth_devices(account_id);

create table if not exists public.auth_identities (
  id text primary key,
  account_id text not null references public.auth_accounts(id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  provider_email text,
  linked_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(provider, provider_account_id)
);

create index if not exists auth_identities_account_idx on public.auth_identities(account_id);

create table if not exists public.auth_sessions (
  token text primary key,
  account_id text not null references public.auth_accounts(id) on delete cascade,
  client_kind text not null check (client_kind in ('website', 'launcher', 'mobile')),
  device_id text references public.auth_devices(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz
);

create index if not exists auth_sessions_account_idx on public.auth_sessions(account_id);
create index if not exists auth_sessions_active_idx on public.auth_sessions(account_id, client_kind) where revoked_at is null;

create table if not exists public.auth_account_links (
  account_id text primary key references public.auth_accounts(id) on delete cascade,
  supabase_user_id uuid not null unique references auth.users(id) on delete cascade,
  linked_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_launcher_link_requests (
  id text primary key,
  poll_token text not null unique,
  account_id text references public.auth_accounts(id) on delete set null,
  client_name text not null,
  client_platform text not null,
  status text not null check (status in ('pending', 'approved', 'expired')),
  requested_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  approved_at timestamptz,
  completed_at timestamptz
);

create index if not exists auth_launcher_link_requests_status_idx on public.auth_launcher_link_requests(status, expires_at);

create table if not exists public.launcher_languages (
  code text primary key,
  name text not null,
  native_name text not null,
  short_label text not null,
  accent_hex text not null,
  translations_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists launcher_languages_code_lower_idx on public.launcher_languages ((lower(code)));

create table if not exists public.launcher_user_settings (
  profile_id uuid primary key references public.user_profiles(id) on delete cascade,
  preferred_language text not null default 'ru-RU',
  theme_mode text not null default 'system' check (theme_mode in ('system', 'light', 'dark')),
  news_channel text not null default 'stable' check (news_channel in ('stable', 'beta', 'dev')),
  install_root text not null default '',
  show_test_sections boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.launcher_build_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.user_profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  summary text not null default '',
  game_version text not null default '',
  loader_kind text not null default 'vanilla' check (loader_kind in ('vanilla', 'fabric', 'forge', 'neoforge', 'quilt', 'custom')),
  loader_version text not null default '',
  hero_image_url text not null default '',
  cover_image_url text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  is_featured boolean not null default false,
  last_played_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists launcher_build_profiles_owner_idx on public.launcher_build_profiles(owner_profile_id);
create index if not exists launcher_build_profiles_visibility_idx on public.launcher_build_profiles(visibility, is_featured);

create table if not exists public.launcher_build_favorites (
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  build_id uuid not null references public.launcher_build_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, build_id)
);

create table if not exists public.launcher_installations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  build_id uuid not null references public.launcher_build_profiles(id) on delete cascade,
  platform text not null default 'windows' check (platform in ('windows', 'linux', 'macos', 'android', 'ios', 'unknown')),
  install_path text not null default '',
  installed_version text not null default '',
  sync_state text not null default 'pending' check (sync_state in ('pending', 'ready', 'broken', 'archived')),
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists launcher_installations_profile_idx on public.launcher_installations(profile_id);
create unique index if not exists launcher_installations_profile_build_idx on public.launcher_installations(profile_id, build_id, platform);

create table if not exists public.official_servers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  host text not null,
  port integer not null default 25565 check (port between 1 and 65535),
  game_version text not null default '',
  summary text not null default '',
  description text not null default '',
  status_endpoint text not null default '',
  icon_url text not null default '',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists official_servers_featured_idx on public.official_servers(is_featured, sort_order);

create table if not exists public.launcher_announcements (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('launcher', 'server', 'site', 'global')),
  kind text not null default 'info' check (kind in ('info', 'update', 'warning', 'event')),
  title text not null,
  summary text not null default '',
  body text not null default '',
  cta_label text not null default '',
  cta_url text not null default '',
  is_pinned boolean not null default false,
  published_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists launcher_announcements_scope_idx on public.launcher_announcements(scope, published_at desc);

alter table public.launcher_user_settings enable row level security;
alter table public.launcher_build_profiles enable row level security;
alter table public.launcher_build_favorites enable row level security;
alter table public.launcher_installations enable row level security;
alter table public.official_servers enable row level security;
alter table public.launcher_announcements enable row level security;

drop policy if exists "users manage own launcher settings" on public.launcher_user_settings;
create policy "users manage own launcher settings"
on public.launcher_user_settings
for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

drop policy if exists "users read visible launcher builds" on public.launcher_build_profiles;
create policy "users read visible launcher builds"
on public.launcher_build_profiles
for select
to authenticated
using (owner_profile_id = auth.uid() or visibility in ('public', 'unlisted'));

drop policy if exists "users create own launcher builds" on public.launcher_build_profiles;
create policy "users create own launcher builds"
on public.launcher_build_profiles
for insert
to authenticated
with check (owner_profile_id = auth.uid());

drop policy if exists "users update own launcher builds" on public.launcher_build_profiles;
create policy "users update own launcher builds"
on public.launcher_build_profiles
for update
to authenticated
using (owner_profile_id = auth.uid())
with check (owner_profile_id = auth.uid());

drop policy if exists "users delete own launcher builds" on public.launcher_build_profiles;
create policy "users delete own launcher builds"
on public.launcher_build_profiles
for delete
to authenticated
using (owner_profile_id = auth.uid());

drop policy if exists "users manage own launcher favorites" on public.launcher_build_favorites;
create policy "users manage own launcher favorites"
on public.launcher_build_favorites
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "users manage own launcher installations" on public.launcher_installations;
create policy "users manage own launcher installations"
on public.launcher_installations
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "official servers are readable" on public.official_servers;
create policy "official servers are readable"
on public.official_servers
for select
to anon, authenticated
using (true);

drop policy if exists "staff can manage official servers" on public.official_servers;
create policy "staff can manage official servers"
on public.official_servers
for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

drop policy if exists "launcher announcements are readable" on public.launcher_announcements;
create policy "launcher announcements are readable"
on public.launcher_announcements
for select
to anon, authenticated
using (
  published_at <= timezone('utc', now())
  and (expires_at is null or expires_at > timezone('utc', now()))
);

drop policy if exists "staff can manage launcher announcements" on public.launcher_announcements;
create policy "staff can manage launcher announcements"
on public.launcher_announcements
for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

drop trigger if exists auth_accounts_set_updated_at on public.auth_accounts;
create trigger auth_accounts_set_updated_at
before update on public.auth_accounts
for each row execute function public.handle_updated_at();

drop trigger if exists auth_profiles_set_updated_at on public.auth_profiles;
create trigger auth_profiles_set_updated_at
before update on public.auth_profiles
for each row execute function public.handle_updated_at();

drop trigger if exists launcher_user_settings_set_updated_at on public.launcher_user_settings;
create trigger launcher_user_settings_set_updated_at
before update on public.launcher_user_settings
for each row execute function public.handle_updated_at();

drop trigger if exists launcher_languages_set_updated_at on public.launcher_languages;
create trigger launcher_languages_set_updated_at
before update on public.launcher_languages
for each row execute function public.handle_updated_at();

drop trigger if exists launcher_build_profiles_set_updated_at on public.launcher_build_profiles;
create trigger launcher_build_profiles_set_updated_at
before update on public.launcher_build_profiles
for each row execute function public.handle_updated_at();

drop trigger if exists launcher_installations_set_updated_at on public.launcher_installations;
create trigger launcher_installations_set_updated_at
before update on public.launcher_installations
for each row execute function public.handle_updated_at();

drop trigger if exists official_servers_set_updated_at on public.official_servers;
create trigger official_servers_set_updated_at
before update on public.official_servers
for each row execute function public.handle_updated_at();

drop trigger if exists launcher_announcements_set_updated_at on public.launcher_announcements;
create trigger launcher_announcements_set_updated_at
before update on public.launcher_announcements
for each row execute function public.handle_updated_at();
