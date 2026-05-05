import { NextResponse } from "next/server";
import { resolveIdentifierToEmail } from "@/lib/auth-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { identifier?: string };
  try {
    const identifier = body.identifier ?? "";
    const email = await resolveIdentifierToEmail(identifier);
    return NextResponse.json({ ok: true, email });
  } catch {
    return NextResponse.json({ ok: true, email: body.identifier ?? "" });
  }
}
