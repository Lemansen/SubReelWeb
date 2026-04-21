import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/lib/supabase/shared";

export type AccountRole = "player" | "moderator" | "admin";

export type AccountUser = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  role: AccountRole;
  launcherToken: string;
  launcherTokenUpdatedAt: string;
  microsoftConnected: boolean;
  createdAt: string;
  lastLoginAt: string;
};

type UserProfileRecord = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  role: AccountRole;
  microsoft_connected: boolean | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sanitizeLogin(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || `user_${Math.random().toString(36).slice(2, 8)}`;
}

function buildFallbackProfile(user: User): UserProfileRecord {
  const loginCandidate = sanitizeLogin(
    normalizeText(user.user_metadata?.login, normalizeText(user.email?.split("@")[0], user.id.slice(0, 8))),
  );
  const nickname = normalizeText(user.user_metadata?.nickname, loginCandidate);

  return {
    id: user.id,
    login: loginCandidate,
    email: normalizeText(user.email),
    nickname,
    role: normalizeText(user.user_metadata?.role, "player") as AccountRole,
    microsoft_connected: Boolean(user.app_metadata?.providers?.includes?.("azure")),
    created_at: normalizeText(user.created_at, new Date().toISOString()),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };
}

function toAccountUser(profile: UserProfileRecord, launcherToken = ""): AccountUser {
  return {
    id: profile.id,
    login: profile.login,
    email: profile.email,
    nickname: profile.nickname,
    role: profile.role,
    launcherToken,
    launcherTokenUpdatedAt: launcherToken ? new Date().toISOString() : "",
    microsoftConnected: Boolean(profile.microsoft_connected),
    createdAt: profile.created_at,
    lastLoginAt: profile.last_login_at ?? profile.updated_at,
  };
}

export async function findProfileByLogin(login: string) {
  const normalizedLogin = sanitizeLogin(login);

  try {
    const admin = getSupabaseAdminClient() as any;
    const { data } = await admin
      .from("user_profiles")
      .select("id, login, email, nickname, role, microsoft_connected, created_at, updated_at, last_login_at")
      .eq("login", normalizedLogin)
      .maybeSingle();

    return (data as UserProfileRecord | null) ?? null;
  } catch {
    return null;
  }
}

export async function findProfileByEmail(email: string) {
  const normalizedEmail = normalizeText(email).toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  try {
    const admin = getSupabaseAdminClient() as any;
    const { data } = await admin
      .from("user_profiles")
      .select("id, login, email, nickname, role, microsoft_connected, created_at, updated_at, last_login_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    return (data as UserProfileRecord | null) ?? null;
  } catch {
    return null;
  }
}

export async function ensureUserProfile(user: User) {
  const fallback = buildFallbackProfile(user);

  try {
    const admin = getSupabaseAdminClient() as any;
    const payload = {
      id: fallback.id,
      login: fallback.login,
      email: fallback.email,
      nickname: fallback.nickname,
      role: fallback.role,
      microsoft_connected: fallback.microsoft_connected,
      created_at: fallback.created_at,
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("user_profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, login, email, nickname, role, microsoft_connected, created_at, updated_at, last_login_at")
      .single();

    if (error || !data) {
      return fallback;
    }

    return {
      ...fallback,
      ...(data as UserProfileRecord),
      role: (((data as UserProfileRecord).role) ?? fallback.role) as AccountRole,
    };
  } catch {
    return fallback;
  }
}

export async function resolveIdentifierToEmail(identifier: string) {
  const normalizedIdentifier = normalizeText(identifier);

  if (!normalizedIdentifier || normalizedIdentifier.includes("@")) {
    return normalizedIdentifier;
  }

  const profile = await findProfileByLogin(normalizedIdentifier);
  return profile?.email ?? normalizedIdentifier;
}

export async function getCurrentAccountUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const profile = await ensureUserProfile(user);
  return toAccountUser(profile, session?.access_token ?? "");
}

export async function getAccountUserFromAccessToken(accessToken: string) {
  const token = normalizeText(accessToken);
  if (!token) {
    return null;
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as User;
  const profile = await ensureUserProfile(user);
  return toAccountUser(profile, token);
}
