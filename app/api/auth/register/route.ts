import { NextResponse } from "next/server";
import { findProfileByEmail, findProfileByLogin, getAccountUserFromAccessToken } from "@/lib/auth-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    login?: string;
    email?: string;
    nickname?: string;
    password?: string;
  };

  const login = body.login?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const nickname = body.nickname?.trim() ?? "";
  const password = body.password ?? "";

  if (!login || !email || !nickname || !password) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "password" }, { status: 400 });
  }

  const [loginProfile, emailProfile] = await Promise.all([
    findProfileByLogin(login),
    findProfileByEmail(email),
  ]);

  if (loginProfile || emailProfile) {
    return NextResponse.json(
      {
        ok: false,
        error: "exists",
        reason: loginProfile && emailProfile ? "login_and_email" : loginProfile ? "login" : "email",
      },
      { status: 409 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        login,
        nickname,
      },
    },
  });

  if (error) {
    if (/already|registered|exists/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: "exists", message: error.message }, { status: 409 });
    }

    return NextResponse.json({ ok: false, error: "unknown", message: error.message }, { status: 400 });
  }

  if (!data.session?.access_token) {
    return NextResponse.json({ ok: true, user: null, pendingVerification: true });
  }

  const user = await getAccountUserFromAccessToken(data.session.access_token);
  const response = NextResponse.json({ ok: true, user, pendingVerification: false });

  return response;
}
