import { NextResponse } from "next/server";
import { findProfileByLogin } from "@/lib/auth-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { login?: string };
  const profile = await findProfileByLogin(body.login ?? "");
  return NextResponse.json({ ok: true, exists: Boolean(profile) });
}
