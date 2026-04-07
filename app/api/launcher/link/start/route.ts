import { NextResponse } from "next/server";
import { startLauncherLink } from "@/lib/launcher-link-store";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await request.json().catch(() => ({})) as {
    clientName?: string;
    clientPlatform?: string;
  };

  const result = await startLauncherLink({
    clientName: body.clientName,
    clientPlatform: body.clientPlatform,
  });

  return NextResponse.json({
    ok: true,
    requestId: result.requestId,
    pollToken: result.pollToken,
    verificationUrl: `${origin}/launcher/connect?requestId=${encodeURIComponent(result.requestId)}`,
    expiresAt: result.expiresAt,
    intervalSeconds: result.intervalSeconds,
    clientName: result.clientName,
    clientPlatform: result.clientPlatform,
  });
}
