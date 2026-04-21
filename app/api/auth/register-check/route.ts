import { NextResponse } from "next/server";
import { findProfileByEmail, findProfileByLogin } from "@/lib/auth-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: string; email?: string };
  const [loginProfile, emailProfile] = await Promise.all([
    findProfileByLogin(body.login ?? ""),
    findProfileByEmail(body.email ?? ""),
  ]);

  return NextResponse.json({
    ok: true,
    exists: Boolean(loginProfile || emailProfile),
    loginExists: Boolean(loginProfile),
    emailExists: Boolean(emailProfile),
  });
}
