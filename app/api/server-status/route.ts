import { NextResponse } from "next/server";
import { readSyncedStatus } from "@/lib/server-sync-store";

const SERVER_HOST = "mc.subreel.online";
const CACHE_TTL_MS = 60_000;
const PLUGIN_URL = process.env.SERVER_STATUS_PLUGIN_URL;
const PLUGIN_TOKEN = process.env.SERVER_STATUS_PLUGIN_TOKEN;

let cachedStatus:
  | {
      timestamp: number;
      payload: {
        ok: boolean;
        online: boolean;
        host: string;
        ip: string;
        port: number;
        version: string;
        playersOnline: number;
        playersMax: number;
        samplePlayers: string[];
        motd: string;
        tps: string;
        updatedAt: string;
      };
    }
  | null = null;

type MCSrvStatusResponse = {
  online?: boolean;
  hostname?: string;
  ip?: string;
  port?: number;
  version?: string;
  players?: {
    online?: number;
    max?: number;
    list?: string[];
  };
  motd?: {
    clean?: string[];
  };
};

type PluginStatusResponse = {
  ok?: boolean;
  online?: boolean;
  version?: string;
  playersOnline?: number;
  playersMax?: number;
  samplePlayers?: string[];
  motd?: string;
  tps?: string;
  updatedAt?: string;
};

async function fetchPluginStatus() {
  if (!PLUGIN_URL) {
    return null;
  }

  const response = await fetch(PLUGIN_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(1200),
    headers: PLUGIN_TOKEN
      ? {
          Authorization: `Bearer ${PLUGIN_TOKEN}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("plugin_unavailable");
  }

  const data = (await response.json()) as PluginStatusResponse;

  return {
    ok: Boolean(data.ok ?? true),
    online: Boolean(data.online),
    host: SERVER_HOST,
    ip: SERVER_HOST,
    port: 25565,
    version: data.version ?? "1.21.11",
    playersOnline: data.playersOnline ?? 0,
    playersMax: data.playersMax ?? 0,
    samplePlayers: data.samplePlayers ?? [],
    motd: data.motd ?? "",
    tps: data.tps ?? "--",
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function GET() {
  const syncedStatus = await readSyncedStatus();

  if (syncedStatus) {
    return NextResponse.json(syncedStatus);
  }

  if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedStatus.payload);
  }

  try {
    const pluginPayload = await fetchPluginStatus();

    if (pluginPayload) {
      cachedStatus = {
        timestamp: Date.now(),
        payload: pluginPayload,
      };

      return NextResponse.json(pluginPayload);
    }
  } catch {
    // Fall back to the public status service.
  }

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${SERVER_HOST}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, online: false, error: "upstream_failed" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as MCSrvStatusResponse;

    const payload = {
      ok: true,
      online: Boolean(data.online),
      host: data.hostname ?? SERVER_HOST,
      ip: data.ip ?? SERVER_HOST,
      port: data.port ?? 25565,
      version: data.version ?? "1.21.11",
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? 0,
      samplePlayers: data.players?.list ?? [],
      motd: data.motd?.clean?.join(" ").trim() ?? "",
      tps: Boolean(data.online) ? "20.0" : "--",
      updatedAt: new Date().toISOString(),
    };

    cachedStatus = {
      timestamp: Date.now(),
      payload,
    };

    return NextResponse.json(payload);
  } catch {
    const payload = {
      ok: false,
      online: false,
      host: SERVER_HOST,
      ip: SERVER_HOST,
      port: 25565,
      version: "1.21.11",
      playersOnline: 0,
      playersMax: 0,
      samplePlayers: [],
      motd: "",
      tps: "--",
      updatedAt: new Date().toISOString(),
    };

    cachedStatus = {
      timestamp: Date.now(),
      payload,
    };

    return NextResponse.json(payload, { status: 200 });
  }
}
