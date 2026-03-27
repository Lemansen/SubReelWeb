import { NextResponse } from "next/server";
import { readSyncedWorldStats } from "@/lib/server-sync-store";

const STATUS_PLUGIN_URL = process.env.SERVER_STATUS_PLUGIN_URL;
const WORLD_STATS_PLUGIN_URL =
  process.env.SERVER_WORLD_STATS_PLUGIN_URL ??
  (STATUS_PLUGIN_URL ? STATUS_PLUGIN_URL.replace(/\/status$/, "/world-stats") : undefined);
const PLUGIN_TOKEN = process.env.SERVER_STATUS_PLUGIN_TOKEN;
const CACHE_TTL_MS = 60_000;

type WorldStatsPayload = {
  ok: boolean;
  totals: {
    playTicks: number;
    deaths: number;
    playerKills: number;
    mobKills: number;
    blocksBroken: number;
    blocksPlaced: number;
    itemsCrafted: number;
    distanceWalkedCm: number;
    distanceSwumCm: number;
    chatMessages: number;
    achievements: number;
    uniquePlayers: number;
  };
  leaderboard: Array<{
    name: string;
    online: boolean;
    playTicks: number;
    deaths: number;
    playerKills: number;
    mobKills: number;
    blocksBroken: number;
    blocksPlaced: number;
    distanceWalkedCm: number;
    distanceSwumCm: number;
  }>;
  updatedAt: string;
};

let cachedPayload:
  | {
      timestamp: number;
      payload: WorldStatsPayload;
    }
  | null = null;

function fallbackPayload(): WorldStatsPayload {
  return {
    ok: false,
    totals: {
      playTicks: 0,
      deaths: 0,
      playerKills: 0,
      mobKills: 0,
      blocksBroken: 0,
      blocksPlaced: 0,
      itemsCrafted: 0,
      distanceWalkedCm: 0,
      distanceSwumCm: 0,
      chatMessages: 0,
      achievements: 0,
      uniquePlayers: 0,
    },
    leaderboard: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  const syncedWorldStats = await readSyncedWorldStats();

  if (syncedWorldStats) {
    return NextResponse.json(syncedWorldStats);
  }

  if (cachedPayload && Date.now() - cachedPayload.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedPayload.payload);
  }

  if (!WORLD_STATS_PLUGIN_URL) {
    const payload = fallbackPayload();
    cachedPayload = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  }

  try {
    const response = await fetch(WORLD_STATS_PLUGIN_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
      headers: PLUGIN_TOKEN
        ? {
            Authorization: `Bearer ${PLUGIN_TOKEN}`,
          }
        : undefined,
    });

    if (!response.ok) {
      const payload = fallbackPayload();
      cachedPayload = { timestamp: Date.now(), payload };
      return NextResponse.json(payload);
    }

    const data = (await response.json()) as Partial<WorldStatsPayload>;
    const payload: WorldStatsPayload = {
      ok: Boolean(data.ok),
      totals: {
        playTicks: data.totals?.playTicks ?? 0,
        deaths: data.totals?.deaths ?? 0,
        playerKills: data.totals?.playerKills ?? 0,
        mobKills: data.totals?.mobKills ?? 0,
        blocksBroken: data.totals?.blocksBroken ?? 0,
        blocksPlaced: data.totals?.blocksPlaced ?? 0,
        itemsCrafted: data.totals?.itemsCrafted ?? 0,
        distanceWalkedCm: data.totals?.distanceWalkedCm ?? 0,
        distanceSwumCm: data.totals?.distanceSwumCm ?? 0,
        chatMessages: data.totals?.chatMessages ?? 0,
        achievements: data.totals?.achievements ?? 0,
        uniquePlayers: data.totals?.uniquePlayers ?? 0,
      },
      leaderboard: data.leaderboard ?? [],
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };

    cachedPayload = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  } catch {
    const payload = fallbackPayload();
    cachedPayload = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  }
}
