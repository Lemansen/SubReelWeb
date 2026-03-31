# CurseForge Proxy for Vercel

This project now includes a server-side proxy for CurseForge:

- `GET /api/curseforge/mods/search`
- `GET /api/curseforge/mods/:modId`
- `GET /api/curseforge/mods/:modId/files`

## Vercel setup

Add this Environment Variable in Vercel:

- `CURSEFORGE_API_KEY`

Do not store the real key in the repository, in `.env.example`, or in launcher code.

## Example requests

Search mods:

```text
/api/curseforge/mods/search?gameVersion=1.21.1&modLoaderType=4&pageSize=20
```

Search with text:

```text
/api/curseforge/mods/search?searchFilter=sodium&gameVersion=1.21.1&modLoaderType=4&pageSize=20
```

Get mod details:

```text
/api/curseforge/mods/12345
```

Get files for a mod:

```text
/api/curseforge/mods/12345/files?gameVersion=1.21.1&modLoaderType=4&pageSize=20
```

## Launcher usage

The launcher should call your Vercel domain instead of CurseForge directly, for example:

```csharp
using var client = new HttpClient();
var json = await client.GetStringAsync(
    "https://your-site.vercel.app/api/curseforge/mods/search?searchFilter=sodium&gameVersion=1.21.1&modLoaderType=4&pageSize=20");
```

This keeps the real CurseForge API key on the server only.
