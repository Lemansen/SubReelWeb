# Account Database

The PostgreSQL auth schema is now split into normalized tables so one account can serve the website, launcher, and future mobile client.

## Main tables

- `auth_accounts`: core account identity, login/email, role, status, and activity timestamps.
- `auth_profiles`: profile-facing fields such as nickname and future avatar/locale data.
- `auth_credentials`: password hash metadata and provider flags like `microsoft_connected`.
- `auth_launcher_tokens`: launcher access token per account.
- `auth_sessions`: sign-in sessions for website, launcher, and mobile clients.
- `auth_devices`: known devices for launcher/mobile/web sessions.
- `auth_identities`: external provider links such as Microsoft or future OAuth providers.

## Current usage

- Website registration/login uses `auth_accounts`, `auth_profiles`, `auth_credentials`, `auth_launcher_tokens`, and `auth_sessions`.
- Launcher auth uses `auth_credentials`, `auth_launcher_tokens`, and `auth_accounts`.
- Mobile is not implemented yet, but `auth_sessions` and `auth_devices` are already prepared for it.

## Legacy compatibility

At startup, the app can migrate from:

1. legacy PostgreSQL tables `users` and `sessions`
2. local SQLite `SubReelSql/subreel-auth.sqlite`
3. old JSON `subreelsite/data/auth-store.json`
