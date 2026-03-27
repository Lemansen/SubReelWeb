import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth-server";

const sessionCookieName = "subreel_session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    identifier?: string;
    password?: string;
  };

  const result = await loginUser({
    identifier: body.identifier ?? "",
    password: body.password ?? "",
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "fill" ? 400 : 401 });
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
