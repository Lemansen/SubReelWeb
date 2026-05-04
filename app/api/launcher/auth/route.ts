import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAccountUserFromAccessToken, resolveIdentifierToEmail } from "@/lib/auth-session";
import { getSupabasePublicEnv } from "@/lib/supabase/shared";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    identifier?: string;
    password?: string;
  };

  const identifier = body.identifier?.trim() ?? "";
  const password = body.password ?? "";

  if (!identifier || !password) {
    return NextResponse.json({ ok: false, error: "fill" }, { status: 400 });
  }

  const email = await resolveIdentifierToEmail(identifier);
  const { url, anonKey } = getSupabasePublicEnv();
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    return NextResponse.json({ ok: false, error: "invalid", message: error?.message }, { status: 401 });
  }

  const user = await getAccountUserFromAccessToken(data.session.access_token);

  return NextResponse.json({
    ok: true,
    launcher: {
      token: data.session.access_token,
      user,
    },
  });
}
