import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";

export async function POST() {
  const user = await getCurrentAccountUser();

  if (!user?.launcherToken) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
