import { NextResponse } from "next/server";
import { pollLauncherLink } from "@/lib/launcher-link-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId") ?? undefined;
  const pollToken = searchParams.get("pollToken") ?? undefined;
  const result = await pollLauncherLink(requestId, pollToken);

  if (result.status === "invalid") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    request: result.request ?? null,
    user: result.user ?? null,
  });
}
