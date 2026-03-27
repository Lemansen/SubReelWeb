import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { rotateLauncherToken } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const user = await rotateLauncherToken(sessionToken);

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
