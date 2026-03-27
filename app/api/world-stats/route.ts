import { NextResponse } from "next/server";
import { readSyncedWorldStats } from "@/lib/server-sync-store";

const SERVER_ADDRESS = "93.88.206.6:20633";
const CACHE_TTL_MS = 60_000;

type MCSrvStatusResponse = {
  online?: boolean;
  players?: {
    online?: number;
    list?: string[];
  };
};

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

function buildFallbackPayload(players: string[] = [], playersOnline = 0): WorldStatsPayload {
  return {
    ok: true,
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
      uniquePlayers: Math.max(playersOnline, players.length),
    },
    leaderboard: players.map((name) => ({
      name,
      online: true,
      playTicks: 0,
      deaths: 0,
      playerKills: 0,
      mobKills: 0,
      blocksBroken: 0,
      blocksPlaced: 0,
      distanceWalkedCm: 0,
      distanceSwumCm: 0,
    })),
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

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${SERVER_ADDRESS}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      const payload = buildFallbackPayload();
      cachedPayload = { timestamp: Date.now(), payload };
      return NextResponse.json(payload);
    }

    const data = (await response.json()) as MCSrvStatusResponse;
    const players = data.players?.list ?? [];
    const payload = buildFallbackPayload(players, data.players?.online ?? 0);

    cachedPayload = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  } catch {
    const payload = buildFallbackPayload();
    cachedPayload = { timestamp: Date.now(), payload };
    return NextResponse.json(payload);
  }
}
