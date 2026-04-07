# Local PostgreSQL Setup

Subreelsite can now use PostgreSQL as the main account database when `DATABASE_URL` is set.
If `DATABASE_URL` is missing, the app falls back to the existing local SQLite file.

## 1. Install PostgreSQL

Install a local PostgreSQL server on Windows using the official installer.

## 2. Create the database

Create an empty database named `subreel_auth`.

Example SQL:

```sql
CREATE DATABASE subreel_auth;
```

## 3. Configure the app

Copy `local-postgres.example.env` to `.env.local` and adjust the password if needed.

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subreel_auth
SUBREEL_ENABLE_USER_DIRECTORY=0
```

## 4. Start the site

Run:

```powershell
npm run dev
```

On the first auth request, the app will:

- create the normalized auth tables automatically:
  - `auth_accounts`
  - `auth_profiles`
  - `auth_credentials`
  - `auth_launcher_tokens`
  - `auth_sessions`
  - `auth_devices`
  - `auth_identities`
- migrate data from legacy PostgreSQL `users` / `sessions` tables if they already exist;
- migrate data from `SubReelSql/subreel-auth.sqlite` if it exists;
- otherwise fall back to the older `subreelsite/data/auth-store.json`.

## Notes

- PostgreSQL becomes the primary auth storage only when `DATABASE_URL` is present.
- The old SQLite file can stay in place during migration.
- Legacy `users` and `sessions` tables can remain temporarily as a backup after migration.
- The `/api/account/users` directory endpoint still requires an authenticated session.
