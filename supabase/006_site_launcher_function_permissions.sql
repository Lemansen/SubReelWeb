revoke execute on function public.ensure_profile_for_auth_user() from public;
revoke execute on function public.ensure_profile_for_auth_user() from anon;
revoke execute on function public.ensure_profile_for_auth_user() from authenticated;

revoke execute on function public.is_staff(uuid) from public;
revoke execute on function public.is_staff(uuid) from anon;
revoke execute on function public.is_staff(uuid) from authenticated;
