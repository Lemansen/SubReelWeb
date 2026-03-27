import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;

  await clearSession(sessionToken);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
