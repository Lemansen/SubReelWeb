import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getCurrentAccountUser();
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ ok: true, user: null });
  }
}
