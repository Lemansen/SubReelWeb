import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserBySession } from "@/lib/auth-server";
import {
  getLauncherLanguageDetail,
  isLauncherLanguageStudioEnabled,
  saveLauncherLanguage,
} from "@/lib/launcher-language-studio";

const sessionCookieName = "subreel_session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function readAuthorizedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  return getUserBySession(sessionToken);
}

export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  if (!isLauncherLanguageStudioEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const user = await readAuthorizedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { code } = await context.params;
  const detail = await getLauncherLanguageDetail(code);

  if (!detail) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      ...detail,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function PUT(request: Request, context: { params: Promise<{ code: string }> }) {
  if (!isLauncherLanguageStudioEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const user = await readAuthorizedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { code } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    nativeName?: string;
    shortLabel?: string;
    accentHex?: string;
    translations?: Record<string, string>;
  };

  try {
    const detail = await saveLauncherLanguage(code, {
      name: body.name ?? "",
      nativeName: body.nativeName ?? "",
      shortLabel: body.shortLabel ?? "",
      accentHex: body.accentHex ?? "",
      translations: body.translations ?? {},
    });

    return NextResponse.json({ ok: true, ...detail }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid";
    const status = message === "not-found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
