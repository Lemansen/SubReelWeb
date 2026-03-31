# CurseForge Proxy for Vercel

This proxy is now aligned with the official CurseForge support article for the Upload API:

- it uses the `X-Api-Token` header
- it reads the token from Vercel Environment Variables
- it returns safe JSON diagnostics even when CurseForge answers with plain text like `Forbidden`

## Vercel setup

Add one of these Environment Variables:

- `CURSEFORGE_API_TOKEN`
- or keep using `CURSEFORGE_API_KEY` as a fallback name

Optional override:

- `CURSEFORGE_API_BASE`

Default base:

- `https://minecraft.curseforge.com/api`

## Available proxy routes

Official-style routes:

- `GET /api/curseforge/game/versions`
- `GET /api/curseforge/game/version-types`
- `GET /api/curseforge/game/dependencies`

Legacy mod-browser routes:

- `GET /api/curseforge/mods/search`
- `GET /api/curseforge/mods/:modId`
- `GET /api/curseforge/mods/:modId/files`

Those legacy mod routes are intentionally disabled with `501`, because the official Upload API token from the support article is not the same thing as the public mod search API flow.

## Why this matters

The support article you linked describes the official author-side CurseForge API. It is useful for authenticated service access, but it should not be confused with the old public-style `mods/search` flow.

Because of that, the proxy now does two things:

1. Uses the correct auth header and server-only token handling.
2. Returns honest JSON errors instead of pretending public mod search is already working through this token.

## Example checks

```text
/api/curseforge/game/versions
```

```text
/api/curseforge/game/version-types
```

```text
/api/curseforge/game/dependencies
```
