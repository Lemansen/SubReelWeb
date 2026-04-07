import { NextResponse } from "next/server";
import {
  getLauncherLanguageManifestPayload,
  getLauncherLanguageTranslationPayload,
} from "@/lib/launcher-language-studio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Content-Type": "application/json; charset=utf-8",
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string[] }> },
) {
  const { file } = await context.params;
  const segment = file?.[0];

  if (!segment || file.length !== 1) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404, headers: jsonHeaders() });
  }

  if (segment === "languages.json") {
    const payload = await getLauncherLanguageManifestPayload();
    return NextResponse.json(payload, { headers: jsonHeaders() });
  }

  if (!segment.toLowerCase().endsWith(".json")) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404, headers: jsonHeaders() });
  }

  const code = segment.slice(0, -".json".length);
  const payload = await getLauncherLanguageTranslationPayload(code);

  if (!payload) {
    return NextResponse.json({ ok: false, error: "not-found" }, { status: 404, headers: jsonHeaders() });
  }

  return NextResponse.json(payload, { headers: jsonHeaders() });
}
