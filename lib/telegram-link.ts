import { randomBytes, timingSafeEqual } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_MINUTES = 15;

function getTelegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") ?? "";
}

function getTelegramLinkApiSecret() {
  return process.env.TELEGRAM_LINK_API_SECRET?.trim() ?? "";
}

function buildTelegramDeepLink(token: string) {
  const botUsername = getTelegramBotUsername();
  if (!botUsername) {
    return "";
  }

  return `https://t.me/${botUsername}?start=link_${token}`;
}

export function getTelegramLinkConfig() {
  return {
    botUsername: getTelegramBotUsername(),
    linkApiSecret: getTelegramLinkApiSecret(),
  };
}

export async function createTelegramLinkToken(profileId: string) {
  const admin = getSupabaseAdminClient() as any;
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin.from("telegram_link_tokens").insert({
    token,
    profile_id: profileId,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    token,
    expiresAt,
    deepLinkUrl: buildTelegramDeepLink(token),
    botUsername: getTelegramBotUsername(),
  };
}

export async function consumeTelegramLinkToken(input: {
  token: string;
  telegramUserId: number;
  telegramUsername?: string | null;
}) {
  const admin = getSupabaseAdminClient() as any;
  const { data, error } = await admin
    .from("telegram_link_tokens")
    .select("token, profile_id, expires_at, consumed_at")
    .eq("token", input.token)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: "lookup_failed" as const };
  }

  if (!data) {
    return { ok: false as const, error: "invalid_token" as const };
  }

  if (data.consumed_at) {
    return { ok: false as const, error: "already_used" as const };
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false as const, error: "expired" as const };
  }

  const telegramUsername = (input.telegramUsername ?? "").trim().replace(/^@/, "");
  const verifiedAt = new Date().toISOString();

  const profileUpdate = await admin
    .from("user_profiles")
    .update({
      telegram_user_id: input.telegramUserId,
      telegram_username: telegramUsername,
      telegram_verified_at: verifiedAt,
      updated_at: verifiedAt,
    })
    .eq("id", data.profile_id);

  if (profileUpdate.error) {
    return { ok: false as const, error: "profile_update_failed" as const };
  }

  const tokenUpdate = await admin
    .from("telegram_link_tokens")
    .update({
      consumed_at: verifiedAt,
      telegram_user_id: input.telegramUserId,
      telegram_username: telegramUsername,
    })
    .eq("token", data.token);

  if (tokenUpdate.error) {
    return { ok: false as const, error: "token_update_failed" as const };
  }

  const { data: profile } = await admin
    .from("user_profiles")
    .select("id, login, nickname, telegram_user_id, telegram_username, telegram_verified_at")
    .eq("id", data.profile_id)
    .single();

  return {
    ok: true as const,
    profile,
  };
}

export function isTelegramSecretValid(secret: string) {
  const expected = getTelegramLinkApiSecret();
  if (!expected || !secret) {
    return false;
  }

  const left = Buffer.from(secret);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
