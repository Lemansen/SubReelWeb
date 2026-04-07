import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserBySession } from "@/lib/auth-server";
import {
  createLauncherLanguage,
  getLauncherLanguageStudioMode,
  isLauncherLanguageStudioEnabled,
  listLauncherLanguages,
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

export async function GET() {
  if (!isLauncherLanguageStudioEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const user = await readAuthorizedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const languages = await listLauncherLanguages();
  return NextResponse.json(
    {
      ok: true,
      mode: getLauncherLanguageStudioMode(),
      languages,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  if (!isLauncherLanguageStudioEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 403 });
  }

  const user = await readAuthorizedUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    code?: string;
    name?: string;
    nativeName?: string;
    shortLabel?: string;
    accentHex?: string;
  };

  try {
    const language = await createLauncherLanguage({
      code: body.code ?? "",
      name: body.name,
      nativeName: body.nativeName,
      shortLabel: body.shortLabel,
      accentHex: body.accentHex,
    });

    return NextResponse.json({ ok: true, language }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid";
    const status = message === "exists" ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
