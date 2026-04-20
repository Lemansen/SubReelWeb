import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/auth-session";

export async function GET() {
  const user = await getCurrentAccountUser();
  return NextResponse.json({ ok: true, user });
}
