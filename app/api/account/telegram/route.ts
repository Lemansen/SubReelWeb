import { NextResponse } from "next/server";
import { getCurrentAccountContext } from "@/lib/auth-session";
import { createTelegramLinkToken, getTelegramLinkConfig } from "@/lib/telegram-link";

export async function GET() {
  const context = await getCurrentAccountContext();
  if (!context) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const profile = context.profile;
  return NextResponse.json({
    ok: true,
    telegram: {
      username: profile.telegram_username ?? "",
      userId: profile.telegram_user_id ?? null,
      verifiedAt: profile.telegram_verified_at ?? null,
      connected: Boolean(profile.telegram_user_id),
      botUsername: getTelegramLinkConfig().botUsername,
    },
  });
}

export async function POST() {
  const context = await getCurrentAccountContext();
  if (!context) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const config = getTelegramLinkConfig();
  if (!config.botUsername) {
    return NextResponse.json({ ok: false, error: "bot_not_configured" }, { status: 503 });
  }

  try {
    const link = await createTelegramLinkToken(context.profile.id);
    return NextResponse.json({ ok: true, link });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    return NextResponse.json({ ok: false, error: "link_create_failed", message }, { status: 500 });
  }
}
