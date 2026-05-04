# Site + Launcher Database

This database layout is designed to let the website and launcher share one Supabase project without mixing unrelated concerns.

## Main areas

- `auth.users` + `public.user_profiles`
  - Supabase Auth identities and the public profile for each user.
- `public.feature_ideas`, `public.bug_reports`, `public.idea_votes`
  - Community feedback and moderation flow.
- `public.auth_*`
  - Legacy-compatible website / launcher auth tables used by the current custom server routes.
- `public.launcher_languages`
  - Launcher language studio storage.
- `public.launcher_user_settings`
  - User preferences that can be shared across devices.
- `public.launcher_build_profiles`, `public.launcher_build_favorites`, `public.launcher_installations`
  - Build catalog and per-user launcher installation state.
- `public.official_servers`
  - Server cards for the site and launcher.
- `public.launcher_announcements`
  - News, update banners, and launcher notices.

## Important note

The current codebase still contains two auth directions:

- Supabase Auth flow (`auth.users`, `user_profiles`)
- legacy custom auth flow (`auth_accounts`, `auth_sessions`, `auth_launcher_tokens`)

The migration keeps both so the project can work now without breaking launcher endpoints. The next cleanup step is to migrate the remaining custom auth routes to Supabase Auth and then retire the legacy `auth_*` tables if desired.
