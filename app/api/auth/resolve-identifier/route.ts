import { NextResponse } from "next/server";
import { resolveIdentifierToEmail } from "@/lib/auth-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { identifier?: string };
  const email = await resolveIdentifierToEmail(body.identifier ?? "");
  return NextResponse.json({ ok: true, email });
}
