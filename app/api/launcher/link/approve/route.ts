import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { approveLauncherLink } from "@/lib/launcher-link-store";

const sessionCookieName = "subreel_session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    requestId?: string;
  };
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const result = await approveLauncherLink(sessionToken, body.requestId);

  if (!result.ok) {
    const status = result.error === "unauthorized" ? 401 : result.error === "expired" ? 410 : 404;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, request: result.request });
}
