# Subreel Status Plugin

Paper plugin for exposing a protected local HTTP endpoint with live Minecraft server data for the website.

## What it sends

- online/offline
- Minecraft version
- online players / max players
- sample online player names
- MOTD
- TPS
- updatedAt

Second endpoint:

- world totals
- leaderboard by playtime
- deaths
- player kills
- mob kills
- broken / placed blocks
- crafted items
- walked / swam distance
- chat messages counted after plugin install
- completed advancements for online players

The plugin can also push data directly to your website over HTTPS, which is the recommended mode for hosts that do not allow extra ports.

## Files

- `src/main/java/online/subreel/status/SubreelStatusPlugin.java`
- `src/main/resources/plugin.yml`
- `src/main/resources/config.yml`

## Build

Wrapper is already included in this project, so the simplest way is:

```bash
./gradlew build
```

or on Windows:

```powershell
gradlew.bat build
```

You can also use a system `gradle` installation, but it is no longer required.

## Plugin config

Default local HTTP endpoint:

- host: `127.0.0.1`
- port: `8127`
- path: `/status`
- statsPath: `/world-stats`

Push mode config:

- `push.enabled`
- `push.baseUrl`
- `push.statusPath`
- `push.worldStatsPath`
- `push.token`
- `push.intervalSeconds`

Example request:

```bash
curl -H "Authorization: Bearer change-me-subreel-token" http://127.0.0.1:8127/status
```

```bash
curl -H "Authorization: Bearer change-me-subreel-token" http://127.0.0.1:8127/world-stats
```

## Site env

Set these variables for the Next.js site:

```env
SERVER_STATUS_PLUGIN_URL=http://127.0.0.1:8127/status
SERVER_WORLD_STATS_PLUGIN_URL=http://127.0.0.1:8127/world-stats
SERVER_STATUS_PLUGIN_TOKEN=change-me-subreel-token
SERVER_SYNC_TOKEN=change-me-subreel-token
```

Then the website can either:

- read from the plugin directly
- or accept pushed sync payloads from the plugin and store them locally

## Quick setup

1. Build the plugin jar.

If you have Gradle:

```powershell
cd subreel-status-plugin
gradlew.bat build
```

If you do not have the wrapper yet, the fastest practical option is to open this folder in IntelliJ IDEA and build the jar there, or generate a Gradle wrapper locally.

2. Copy the built jar into your Paper server `plugins` folder.

Expected output path after build:

```text
subreel-status-plugin/build/libs/subreel-status-plugin-0.1.0.jar
```

Important:

- upload exactly the jar from `build/libs`
- do not upload the project folder
- do not upload a jar made only from compiled `.class` files
- the final jar must contain `plugin.yml` in the root

You can check it by opening the jar as an archive and confirming this file exists:

```text
plugin.yml
```

3. Start the server once so the plugin creates its config.

4. Open the plugin config and change the token:

```text
plugins/SubreelStatusBridge/config.yml
```

Recommended values:

- host: `127.0.0.1`
- port: `8127`
- path: `/status`
- statsPath: `/world-stats`
- token: your long random secret

For restricted hosting, enable push mode instead of relying on the public HTTP port:

- `push.enabled: true`
- `push.baseUrl: https://your-site.example`
- `push.statusPath: /api/internal/server-sync/status`
- `push.worldStatsPath: /api/internal/server-sync/world-stats`
- `push.token: the same token as SERVER_SYNC_TOKEN`

5. In the site project, create `.env.local` from `.env.example` and set the same URL/token.

Example:

```env
SERVER_STATUS_PLUGIN_URL=http://127.0.0.1:8127/status
SERVER_WORLD_STATS_PLUGIN_URL=http://127.0.0.1:8127/world-stats
SERVER_STATUS_PLUGIN_TOKEN=your long random secret
```

6. Restart the website.

After that:

- the server page will read live players, version, MOTD, TPS, and last update time
- the stats page will read world totals and the player leaderboard

## Notes

- `chatMessages` starts counting after the plugin is installed
- `achievements` are counted from completed advancements of players who are currently online
- all other totals are aggregated from Bukkit statistics of online/offline players
