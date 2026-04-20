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

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.handle_updated_at();

drop trigger if exists feature_ideas_set_updated_at on public.feature_ideas;
create trigger feature_ideas_set_updated_at
before update on public.feature_ideas
for each row execute function public.handle_updated_at();

drop trigger if exists bug_reports_set_updated_at on public.bug_reports;
create trigger bug_reports_set_updated_at
before update on public.bug_reports
for each row execute function public.handle_updated_at();

create or replace function public.is_staff(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = user_id
      and role in ('moderator', 'admin')
  );
$$;

create table if not exists public.idea_votes (
  idea_id uuid not null references public.feature_ideas(id) on delete cascade,
  voter_id uuid not null references public.user_profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (idea_id, voter_id)
);

alter table public.idea_votes enable row level security;

drop trigger if exists idea_votes_set_updated_at on public.idea_votes;
create trigger idea_votes_set_updated_at
before update on public.idea_votes
for each row execute function public.handle_updated_at();

drop policy if exists "votes readable by authenticated" on public.idea_votes;
create policy "votes readable by authenticated"
on public.idea_votes
for select
to authenticated
using (true);

drop policy if exists "users manage own votes" on public.idea_votes;
create policy "users manage own votes"
on public.idea_votes
for all
to authenticated
using (auth.uid() = voter_id)
with check (auth.uid() = voter_id);

drop policy if exists "staff can update ideas" on public.feature_ideas;
create policy "staff can update ideas"
on public.feature_ideas
for update
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

drop policy if exists "staff can read all bugs" on public.bug_reports;
create policy "staff can read all bugs"
on public.bug_reports
for select
to authenticated
using (auth.uid() = author_id or public.is_staff(auth.uid()));

drop policy if exists "staff can update bugs" on public.bug_reports;
create policy "staff can update bugs"
on public.bug_reports
for update
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));
