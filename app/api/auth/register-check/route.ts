import { NextResponse } from "next/server";
import { findProfileByEmail, findProfileByLogin } from "@/lib/auth-session";
import { createInternalEmailFromLogin } from "@/lib/account-identity";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: string; email?: string };
  try {
    const login = body.login ?? "";
    const email = body.email?.trim() || createInternalEmailFromLogin(login);
    const [loginProfile, emailProfile] = await Promise.all([
      findProfileByLogin(login),
      findProfileByEmail(email),
    ]);

    return NextResponse.json({
      ok: true,
      exists: Boolean(loginProfile || emailProfile),
      loginExists: Boolean(loginProfile),
      emailExists: Boolean(emailProfile),
    });
  } catch {
    return NextResponse.json({
      ok: true,
      exists: false,
      loginExists: false,
      emailExists: false,
    });
  }
}
