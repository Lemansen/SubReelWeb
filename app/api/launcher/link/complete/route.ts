import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeLauncherRedirect } from "@/lib/supabase/shared";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    redirect?: string;
  };

  const redirect = sanitizeLauncherRedirect(body.redirect);
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session?.access_token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const launchUrl = new URL(redirect);
  launchUrl.searchParams.set("token", session.access_token);
  launchUrl.searchParams.set("userId", user.id);
  launchUrl.searchParams.set("source", "subreel-web");

  return NextResponse.json({
    ok: true,
    launchUrl: launchUrl.toString(),
  });
}
