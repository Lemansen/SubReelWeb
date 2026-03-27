import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    login?: string;
    email?: string;
    nickname?: string;
    password?: string;
  };

  const result = await registerUser({
    login: body.login ?? "",
    email: body.email ?? "",
    nickname: body.nickname ?? "",
    password: body.password ?? "",
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "exists" ? 409 : 400 });
  }

  const response = NextResponse.json({ ok: true, user: result.user });
  response.cookies.set(sessionCookieName, result.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
