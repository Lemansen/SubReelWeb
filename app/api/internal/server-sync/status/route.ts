import { NextRequest, NextResponse } from "next/server";
import { writeSyncedStatus, type SyncedStatusPayload } from "@/lib/server-sync-store";

const SYNC_TOKEN = process.env.SERVER_SYNC_TOKEN ?? process.env.SERVER_STATUS_PLUGIN_TOKEN;

function isAuthorized(request: NextRequest) {
  if (!SYNC_TOKEN) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${SYNC_TOKEN}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

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
