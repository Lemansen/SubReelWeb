import { NextResponse } from "next/server";
import { readSyncedStatus } from "@/lib/server-sync-store";

const SERVER_ADDRESS = "93.88.206.6:20633";
const SERVER_IP = "93.88.206.6";
const SERVER_PORT = 20633;
const CACHE_TTL_MS = 60_000;

type StatusPayload = {
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

let cachedStatus:
  | {
      timestamp: number;
      payload: StatusPayload;
    }
  | null = null;

function fallbackPayload(): StatusPayload {
  return {
    ok: false,
    online: false,
    host: SERVER_ADDRESS,
    ip: SERVER_IP,
    port: SERVER_PORT,
    version: "1.21.11",
    playersOnline: 0,
    playersMax: 0,
    samplePlayers: [],
    motd: "",
    tps: "--",
    updatedAt: new Date().toISOString(),
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
    const response = await fetch(`https://api.mcsrvstat.us/3/${SERVER_ADDRESS}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      const payload = fallbackPayload();
      cachedStatus = { timestamp: Date.now(), payload };
      return NextResponse.json(payload);
    }

    const data = (await response.json()) as MCSrvStatusResponse;
    const payload: StatusPayload = {
      ok: true,
      online: Boolean(data.online),
      host: data.hostname ?? SERVER_ADDRESS,
      ip: data.ip ?? SERVER_IP,
      port: data.port ?? SERVER_PORT,
      version: data.version ?? "1.21.11",
      playersOnline: data.players?.online ?? 0,
      playersMax: data.players?.max ?? 0,
      samplePlayers: data.players?.list ?? [],
      motd: data.motd?.clean?.join(" ").trim() ?? "",
      tps: Boolean(data.online) ? "20.0" : "--",
      updatedAt: new Date().toISOString(),
    };

    cachedStatus = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  } catch {
    const payload = fallbackPayload();
    cachedStatus = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  }
}
