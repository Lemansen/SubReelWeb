# CurseForge Proxy for Vercel

This site now proxies the official CurseForge REST API through Vercel server routes.

## Security

Store the real key only in Vercel Environment Variables:

- `CURSEFORGE_API_KEY`

Optional fallback names:

- `CURSEFORGE_API_TOKEN`
- `CURSEFORGE_API_BASE`

Default API base:

- `https://api.curseforge.com/v1`

The proxy uses the `x-api-key` header server-side, so the launcher never exposes the real key.

## Available routes

- `GET /api/curseforge/mods/search`
- `GET /api/curseforge/mods/:modId`
- `GET /api/curseforge/mods/:modId/files`
- `GET /api/curseforge/games/minecraft/versions`
- `GET /api/curseforge/games/minecraft/version-types`

## Example requests

```text
/api/curseforge/mods/search?searchFilter=sodium&gameVersion=1.21.1&modLoaderType=4&pageSize=20
```

```text
/api/curseforge/mods/394468
```

```text
/api/curseforge/mods/394468/files?gameVersion=1.21.1&modLoaderType=4&pageSize=20
```

```text
/api/curseforge/games/minecraft/versions
```

## Diagnostics

If CurseForge returns plain text like `Forbidden`, the proxy now wraps it in JSON:

```json
{
  "ok": false,
  "error": "CurseForge request failed with status 403",
  "status": 403,
  "rawText": "Forbidden: ..."
}
```

That makes launcher-side debugging much easier.
