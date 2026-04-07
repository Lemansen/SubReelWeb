import { NextResponse } from "next/server";
import { getLauncherLinkRequest } from "@/lib/launcher-link-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId") ?? undefined;
  const launcherRequest = await getLauncherLinkRequest(requestId);

  if (!launcherRequest) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, request: launcherRequest });
}
