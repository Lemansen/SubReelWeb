import { NextRequest, NextResponse } from "next/server";
import { writeSyncedWorldStats, type SyncedWorldStatsPayload } from "@/lib/server-sync-store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<SyncedWorldStatsPayload>;

  const payload: SyncedWorldStatsPayload = {
    ok: Boolean(body.ok ?? true),
    totals: {
      playTicks: body.totals?.playTicks ?? 0,
      deaths: body.totals?.deaths ?? 0,
      playerKills: body.totals?.playerKills ?? 0,
      mobKills: body.totals?.mobKills ?? 0,
      blocksBroken: body.totals?.blocksBroken ?? 0,
      blocksPlaced: body.totals?.blocksPlaced ?? 0,
      itemsCrafted: body.totals?.itemsCrafted ?? 0,
      distanceWalkedCm: body.totals?.distanceWalkedCm ?? 0,
      distanceSwumCm: body.totals?.distanceSwumCm ?? 0,
      chatMessages: body.totals?.chatMessages ?? 0,
      achievements: body.totals?.achievements ?? 0,
      uniquePlayers: body.totals?.uniquePlayers ?? 0,
    },
    leaderboard: Array.isArray(body.leaderboard) ? body.leaderboard : [],
    updatedAt: body.updatedAt ?? new Date().toISOString(),
  };

  await writeSyncedWorldStats(payload);
  return NextResponse.json({ ok: true });
}
