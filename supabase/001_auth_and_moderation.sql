create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login text not null unique,
  email text not null,
  nickname text not null,
  role text not null default 'player' check (role in ('player', 'moderator', 'admin')),
  microsoft_connected boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz
);

create table if not exists public.feature_ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  summary text not null,
  details text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'in_progress', 'done')),
  moderator_note text not null default '',
  votes_up integer not null default 0,
  votes_down integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  location text not null default '',
  summary text not null,
  details text not null,
  severity text not null default 'normal' check (severity in ('low', 'normal', 'high', 'critical')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'in_progress', 'fixed', 'rejected')),
  moderator_note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_profiles enable row level security;
alter table public.feature_ideas enable row level security;
alter table public.bug_reports enable row level security;

drop policy if exists "profiles readable by authenticated" on public.user_profiles;
create policy "profiles readable by authenticated"
on public.user_profiles
for select
to authenticated
using (true);

drop policy if exists "users manage own profile" on public.user_profiles;
create policy "users manage own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "ideas readable by authenticated" on public.feature_ideas;
create policy "ideas readable by authenticated"
on public.feature_ideas
for select
to authenticated
using (true);

drop policy if exists "users create own ideas" on public.feature_ideas;
create policy "users create own ideas"
on public.feature_ideas
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "users read own bugs" on public.bug_reports;
create policy "users read own bugs"
on public.bug_reports
for select
to authenticated
using (auth.uid() = author_id);

drop policy if exists "users create own bugs" on public.bug_reports;
create policy "users create own bugs"
on public.bug_reports
for insert
to authenticated
with check (auth.uid() = author_id);
