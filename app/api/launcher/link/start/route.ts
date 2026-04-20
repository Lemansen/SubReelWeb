import { NextResponse } from "next/server";
import { sanitizeLauncherRedirect } from "@/lib/supabase/shared";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await request.json().catch(() => ({})) as {
    clientName?: string;
    clientPlatform?: string;
    redirect?: string;
  };
  const redirect = sanitizeLauncherRedirect(body.redirect);
  const verificationUrl = `${origin}/launcher/connect?redirect=${encodeURIComponent(redirect)}${
    body.clientName ? `&clientName=${encodeURIComponent(body.clientName)}` : ""
  }${body.clientPlatform ? `&clientPlatform=${encodeURIComponent(body.clientPlatform)}` : ""}`;

  return NextResponse.json({
    ok: true,
    requestId: "callback-flow",
    pollToken: "callback-flow",
    verificationUrl,
    redirect,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    intervalSeconds: 0,
    clientName: body.clientName ?? "SubReel Launcher",
    clientPlatform: body.clientPlatform ?? "desktop",
  });
}
