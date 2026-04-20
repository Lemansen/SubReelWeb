import { NextResponse } from "next/server";
import { getAccountUserFromAccessToken } from "@/lib/auth-session";

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length).trim();
}

export async function GET(request: Request) {
  const launcherToken = readBearerToken(request);
  const user = await getAccountUserFromAccessToken(launcherToken ?? "");

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
