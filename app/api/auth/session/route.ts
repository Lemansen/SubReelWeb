import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserBySession } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const user = await getUserBySession(sessionToken);

  return NextResponse.json({ ok: true, user });
}
