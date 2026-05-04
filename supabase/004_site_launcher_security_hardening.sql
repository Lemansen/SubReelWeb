create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
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
set search_path = public
as $$
  select trim(both '_' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9_]+', '_', 'g'));
$$;

alter table public.auth_accounts enable row level security;
alter table public.auth_profiles enable row level security;
alter table public.auth_credentials enable row level security;
alter table public.auth_launcher_tokens enable row level security;
alter table public.auth_devices enable row level security;
alter table public.auth_identities enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.auth_account_links enable row level security;
alter table public.auth_launcher_link_requests enable row level security;
alter table public.launcher_languages enable row level security;
