import { NextResponse } from "next/server";
import { findProfileByEmail, findProfileByLogin, getAccountUserFromAccessToken } from "@/lib/auth-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createInternalEmailFromLogin } from "@/lib/account-identity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      login?: string;
      nickname?: string;
      password?: string;
    };

    const login = body.login?.trim() ?? "";
    const email = createInternalEmailFromLogin(login);
    const nickname = body.nickname?.trim() ?? "";
    const password = body.password ?? "";

    if (!login || !nickname || !password) {
      return NextResponse.json({ ok: false, error: "fill", message: "Заполни логин, ник и пароль." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "password", message: "Пароль должен быть не короче 6 символов." }, { status: 400 });
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
          message: "Такой логин уже занят. Если это твой аккаунт, просто войди.",
        },
        { status: 409 },
      );
    }

    const admin = getSupabaseAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        login,
        nickname,
      },
    });

    if (createError) {
      if (/already|registered|exists|duplicate/i.test(createError.message)) {
        return NextResponse.json(
          { ok: false, error: "exists", message: "Такой логин уже занят. Если это твой аккаунт, просто войди." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { ok: false, error: "unknown", message: createError.message || "Supabase не создал аккаунт." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        return NextResponse.json(
          { ok: false, error: "exists", message: "Такой логин уже занят. Если это твой аккаунт, просто войди." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { ok: false, error: "unknown", message: error.message || "Supabase не принял регистрацию." },
        { status: 400 },
      );
    }

    if (!data.session?.access_token) {
      return NextResponse.json({ ok: true, user: null, pendingVerification: true });
    }

    const user = await getAccountUserFromAccessToken(data.session.access_token);
    const response = NextResponse.json({ ok: true, user, pendingVerification: false });

    return response;
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Неизвестная ошибка регистрации.";
    const isEnvError = /env|supabase/i.test(message);

    return NextResponse.json(
      {
        ok: false,
        error: "unknown",
        message: isEnvError
          ? "На сервере не настроены переменные Supabase. Проверь NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY в Vercel."
          : message,
      },
      { status: isEnvError ? 500 : 400 },
    );
  }
}
