import { NextRequest, NextResponse } from "next/server";
import { writeSyncedStatus, type SyncedStatusPayload } from "@/lib/server-sync-store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<SyncedStatusPayload>;

  const payload: SyncedStatusPayload = {
    ok: Boolean(body.ok ?? true),
    online: Boolean(body.online),
    host: body.host ?? "93.88.206.6:20633",
    ip: body.ip ?? "93.88.206.6",
    port: body.port ?? 20633,
    version: body.version ?? "1.21.11",
    playersOnline: body.playersOnline ?? 0,
    playersMax: body.playersMax ?? 0,
    samplePlayers: Array.isArray(body.samplePlayers) ? body.samplePlayers : [],
    motd: body.motd ?? "",
    tps: body.tps ?? "--",
    updatedAt: body.updatedAt ?? new Date().toISOString(),
  };

  await writeSyncedStatus(payload);
  return NextResponse.json({ ok: true });
}
