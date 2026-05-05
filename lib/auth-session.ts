import { createClient, type User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/lib/supabase/shared";
import { createInternalEmailFromLogin, sanitizeLoginForIdentity } from "@/lib/account-identity";

export type AccountRole = "player" | "moderator" | "admin";

export type AccountUser = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  role: AccountRole;
  telegramUserId?: number | null;
  telegramUsername?: string;
  telegramVerifiedAt?: string | null;
  launcherToken: string;
  launcherTokenUpdatedAt: string;
  microsoftConnected: boolean;
  createdAt: string;
  lastLoginAt: string;
};

export type DirectoryAccountUser = {
  id: string;
  login: string;
  nickname: string;
  role: AccountRole;
  createdAt: string;
  lastLoginAt: string;
  microsoftConnected: boolean;
  isCurrentUser: boolean;
};

type UserProfileRecord = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  role: AccountRole;
  telegram_user_id?: number | null;
  telegram_username?: string | null;
  telegram_verified_at?: string | null;
  microsoft_connected: boolean | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sanitizeLogin(value: string) {
  return sanitizeLoginForIdentity(value);
}

export function sanitizeAccountLogin(value: string) {
  return sanitizeLogin(value);
}

function buildFallbackProfile(user: User): UserProfileRecord {
  const loginCandidate = sanitizeLogin(
    normalizeText(user.user_metadata?.login, normalizeText(user.email?.split("@")[0], user.id.slice(0, 8))),
  );
  const nickname = normalizeText(user.user_metadata?.nickname, loginCandidate);

  return {
    id: user.id,
    login: loginCandidate,
    email: normalizeText(user.email, createInternalEmailFromLogin(loginCandidate)),
    nickname,
    role: normalizeText(user.user_metadata?.role, "player") as AccountRole,
    telegram_user_id: null,
    telegram_username: "",
    telegram_verified_at: null,
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
    telegramUserId: profile.telegram_user_id ?? null,
    telegramUsername: profile.telegram_username ?? "",
    telegramVerifiedAt: profile.telegram_verified_at ?? null,
    launcherToken,
    launcherTokenUpdatedAt: launcherToken ? new Date().toISOString() : "",
    microsoftConnected: Boolean(profile.microsoft_connected),
    createdAt: profile.created_at,
    lastLoginAt: profile.last_login_at ?? profile.updated_at,
  };
}

function toDirectoryAccountUser(profile: UserProfileRecord, currentUserId: string): DirectoryAccountUser {
  return {
    id: profile.id,
    login: profile.login,
    nickname: profile.nickname,
    role: profile.role,
    createdAt: profile.created_at,
    lastLoginAt: profile.last_login_at ?? profile.updated_at,
    microsoftConnected: Boolean(profile.microsoft_connected),
    isCurrentUser: profile.id === currentUserId,
  };
}

export async function findProfileByLogin(login: string) {
  const normalizedLogin = sanitizeLogin(login);

  try {
    const admin = getSupabaseAdminClient() as any;
    const { data } = await admin
      .from("user_profiles")
      .select("id, login, email, nickname, role, telegram_user_id, telegram_username, telegram_verified_at, microsoft_connected, created_at, updated_at, last_login_at")
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
      .select("id, login, email, nickname, role, telegram_user_id, telegram_username, telegram_verified_at, microsoft_connected, created_at, updated_at, last_login_at")
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
      telegram_user_id: fallback.telegram_user_id,
      telegram_username: fallback.telegram_username,
      telegram_verified_at: fallback.telegram_verified_at,
      microsoft_connected: fallback.microsoft_connected,
      created_at: fallback.created_at,
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("user_profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, login, email, nickname, role, telegram_user_id, telegram_username, telegram_verified_at, microsoft_connected, created_at, updated_at, last_login_at")
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

export async function getCurrentAccountContext() {
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

  return {
    supabase,
    user,
    session,
    profile,
    accountUser: toAccountUser(profile, session?.access_token ?? ""),
  };
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

export async function listAccountDirectoryUsers() {
  const current = await getCurrentAccountUser();

  if (!current) {
    return null;
  }

  const admin = getSupabaseAdminClient() as any;
  const { data } = await admin
    .from("user_profiles")
    .select("id, login, email, nickname, role, telegram_user_id, telegram_username, telegram_verified_at, microsoft_connected, created_at, updated_at, last_login_at")
    .order("last_login_at", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data as UserProfileRecord[] | null) ?? [];
  return rows.map((item) => toDirectoryAccountUser(item, current.id));
}

export async function updateCurrentAccountProfile(input: {
  login: string;
  nickname: string;
}) {
  const login = sanitizeLogin(input.login);
  const email = createInternalEmailFromLogin(login);
  const nickname = normalizeText(input.nickname);

  if (!login || !nickname) {
    return { ok: false as const, error: "fill" as const };
  }

  const context = await getCurrentAccountContext();
  if (!context) {
    return { ok: false as const, error: "unauthorized" as const };
  }

  const [loginProfile, emailProfile] = await Promise.all([
    findProfileByLogin(login),
    findProfileByEmail(email),
  ]);

  if ((loginProfile && loginProfile.id !== context.user.id) || (emailProfile && emailProfile.id !== context.user.id)) {
    return { ok: false as const, error: "exists" as const };
  }

  const metadataChanged =
    login !== context.profile.login ||
    nickname !== context.profile.nickname ||
    email !== context.profile.email;

  let nextEmail = context.profile.email;

  if (metadataChanged) {
    const updatePayload: {
      email?: string;
      data?: Record<string, unknown>;
    } = {};

    if (email !== context.profile.email) {
      updatePayload.email = email;
    }

    if (login !== context.profile.login || nickname !== context.profile.nickname) {
      updatePayload.data = {
        ...(context.user.user_metadata ?? {}),
        login,
        nickname,
      };
    }

    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await context.supabase.auth.updateUser(updatePayload);
      if (error) {
        if (/already|exists|registered/i.test(error.message)) {
          return { ok: false as const, error: "exists" as const };
        }

        return { ok: false as const, error: "invalid" as const };
      }

      nextEmail = normalizeText(data.user?.email, context.profile.email);
    }
  }

  const admin = getSupabaseAdminClient() as any;
  const { data, error } = await admin
    .from("user_profiles")
    .update({
      login,
      email: nextEmail,
      nickname,
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.user.id)
    .select("id, login, email, nickname, role, telegram_user_id, telegram_username, telegram_verified_at, microsoft_connected, created_at, updated_at, last_login_at")
    .single();

  if (error || !data) {
    return { ok: false as const, error: "invalid" as const };
  }

  return {
    ok: true as const,
    user: toAccountUser(data as UserProfileRecord, context.session?.access_token ?? ""),
  };
}

export async function updateCurrentAccountPassword(input: {
  currentPassword: string;
  nextPassword: string;
}) {
  const currentPassword = input.currentPassword;
  const nextPassword = input.nextPassword;

  if (!currentPassword || !nextPassword) {
    return { ok: false as const, error: "fill" as const };
  }

  if (nextPassword.length < 6) {
    return { ok: false as const, error: "password" as const };
  }

  const context = await getCurrentAccountContext();
  if (!context) {
    return { ok: false as const, error: "unauthorized" as const };
  }

  const { url, anonKey } = getSupabasePublicEnv();
  const verifier = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const verifyResult = await verifier.auth.signInWithPassword({
    email: context.profile.email,
    password: currentPassword,
  });

  if (verifyResult.error) {
    return { ok: false as const, error: "invalid" as const };
  }

  const { error } = await context.supabase.auth.updateUser({
    password: nextPassword,
  });

  if (error) {
    return { ok: false as const, error: "invalid" as const };
  }

  return { ok: true as const };
}
