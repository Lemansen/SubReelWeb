import { NextResponse } from "next/server";
import { resolveIdentifierToEmail, getAccountUserFromAccessToken } from "@/lib/auth-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    return NextResponse.json({ ok: false, error: "invalid", message: error?.message }, { status: 401 });
  }

  const user = await getAccountUserFromAccessToken(data.session.access_token);
  const response = NextResponse.json({ ok: true, user });

  return response;
}
