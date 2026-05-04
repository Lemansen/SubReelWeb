drop policy if exists "deny direct auth_accounts api access" on public.auth_accounts;
create policy "deny direct auth_accounts api access"
on public.auth_accounts
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_profiles api access" on public.auth_profiles;
create policy "deny direct auth_profiles api access"
on public.auth_profiles
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_credentials api access" on public.auth_credentials;
create policy "deny direct auth_credentials api access"
on public.auth_credentials
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_launcher_tokens api access" on public.auth_launcher_tokens;
create policy "deny direct auth_launcher_tokens api access"
on public.auth_launcher_tokens
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_devices api access" on public.auth_devices;
create policy "deny direct auth_devices api access"
on public.auth_devices
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_identities api access" on public.auth_identities;
create policy "deny direct auth_identities api access"
on public.auth_identities
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_sessions api access" on public.auth_sessions;
create policy "deny direct auth_sessions api access"
on public.auth_sessions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_account_links api access" on public.auth_account_links;
create policy "deny direct auth_account_links api access"
on public.auth_account_links
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct auth_launcher_link_requests api access" on public.auth_launcher_link_requests;
create policy "deny direct auth_launcher_link_requests api access"
on public.auth_launcher_link_requests
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "launcher languages are readable" on public.launcher_languages;
create policy "launcher languages are readable"
on public.launcher_languages
for select
to anon, authenticated
using (true);

drop policy if exists "staff can manage launcher languages" on public.launcher_languages;
create policy "staff can manage launcher languages"
on public.launcher_languages
for all
to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));
