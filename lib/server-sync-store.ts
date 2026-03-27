import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SyncedStatusPayload = {
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

export type SyncedWorldStatsPayload = {
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

type ServerSyncStore = {
  status: SyncedStatusPayload | null;
  worldStats: SyncedWorldStatsPayload | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __subreelServerSyncStore: ServerSyncStore | undefined;
}

const storeDir = path.join(process.cwd(), "data");
const storePath = path.join(storeDir, "server-sync.json");

function emptyStore(): ServerSyncStore {
  return {
    status: null,
    worldStats: null,
  };
}

function getMemoryStore(): ServerSyncStore {
  if (!globalThis.__subreelServerSyncStore) {
    globalThis.__subreelServerSyncStore = emptyStore();
  }

  return globalThis.__subreelServerSyncStore;
}

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

async function readStore(): Promise<ServerSyncStore> {
  const memoryStore = getMemoryStore();

  try {
    await ensureStore();
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<ServerSyncStore>;

    const store = {
      status: parsed.status ?? null,
      worldStats: parsed.worldStats ?? null,
    };

    globalThis.__subreelServerSyncStore = store;
    return store;
  } catch {
    return memoryStore;
  }
}

async function writeStore(store: ServerSyncStore) {
  globalThis.__subreelServerSyncStore = store;

  try {
    await ensureStore();
    await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Ignore filesystem failures in restricted/serverless environments.
  }
}

export async function readSyncedStatus() {
  const store = await readStore();
  return store.status;
}

export async function writeSyncedStatus(payload: SyncedStatusPayload) {
  const store = await readStore();
  store.status = payload;
  await writeStore(store);
}

export async function readSyncedWorldStats() {
  const store = await readStore();
  return store.worldStats;
}

export async function writeSyncedWorldStats(payload: SyncedWorldStatsPayload) {
  const store = await readStore();
  store.worldStats = payload;
  await writeStore(store);
}
