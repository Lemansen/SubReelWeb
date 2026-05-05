import { NextResponse } from "next/server";
import { consumeTelegramLinkToken, isTelegramSecretValid } from "@/lib/telegram-link";

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-link-secret") ?? "";
  if (!isTelegramSecretValid(secret)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    telegramUserId?: number;
    telegramUsername?: string | null;
  };

  const token = body.token?.trim() ?? "";
  const telegramUserId = Number(body.telegramUserId);

  if (!token || !Number.isFinite(telegramUserId) || telegramUserId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const result = await consumeTelegramLinkToken({
    token,
    telegramUserId,
    telegramUsername: body.telegramUsername ?? null,
  });

  if (!result.ok) {
    const status =
      result.error === "invalid_token" ? 404 :
      result.error === "already_used" ? 409 :
      result.error === "expired" ? 410 :
      500;

    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true, profile: result.profile });
}
