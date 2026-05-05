"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountUser } from "@/lib/auth-session";

export type { AccountUser } from "@/lib/auth-session";

type RegisterError = "fill" | "password" | "exists" | "unknown";
type LoginError = "fill" | "invalid" | "unknown";

type RegisterResult =
  | { ok: true; user: AccountUser | null; pendingVerification: boolean }
  | {
      ok: false;
      error: RegisterError;
      reason?: "login" | "email" | "login_and_email";
      message?: string;
    };
type LoginResult =
  | { ok: true; user: AccountUser | null }
  | { ok: false; error: LoginError; message?: string };

type SessionResult = {
  ok: true;
  user: AccountUser | null;
};

async function parseResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeMessage(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const nested = value as { message?: unknown; error_description?: unknown; error?: unknown };
    return (
      normalizeMessage(nested.message) ||
      normalizeMessage(nested.error_description) ||
      normalizeMessage(nested.error)
    );
  }

  return "";
}

async function readErrorMessage(response: Response, fallback: string) {
  const result = await parseResponse<{ message?: unknown; error?: unknown }>(response);
  const message = normalizeMessage(result?.message);
  const error = normalizeMessage(result?.error);
  return message || error || fallback;
}

export async function fetchSession(): Promise<AccountUser | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const result = await parseResponse<SessionResult>(response);
  return result?.ok ? result.user : null;
}

async function resolveIdentifier(identifier: string) {
  const response = await fetch("/api/auth/resolve-identifier", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier }),
  });

  const result = await parseResponse<{ ok: true; email: string }>(response);
  return result?.email ?? identifier;
}

export async function registerAccount(input: {
  login: string;
  nickname: string;
  password: string;
}): Promise<RegisterResult> {
  const login = input.login.trim();
  const nickname = input.nickname.trim();
  const password = input.password;

  if (!login || !nickname || !password) {
    return { ok: false, error: "fill" };
  }

  if (password.length < 6) {
    return { ok: false, error: "password" };
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, nickname, password }),
    });

    const result = await parseResponse<RegisterResult>(response);

    if (response.ok && result?.ok) {
      return result;
    }

    if (result && !result.ok) {
      return {
        ...result,
        message: normalizeMessage(result.message),
      };
    }

    return {
      ok: false,
      error: "unknown",
      message: await readErrorMessage(response, `HTTP ${response.status}`),
    };
  } catch (error) {
    return {
      ok: false,
      error: "unknown",
      message: error instanceof Error && error.message ? error.message : "Не удалось подключиться к серверу регистрации.",
    };
  }
}

export async function loginAccount(input: {
  identifier: string;
  password: string;
}): Promise<LoginResult> {
  const identifier = input.identifier.trim();
  const password = input.password;

  if (!identifier || !password) {
    return { ok: false, error: "fill" };
  }

  const email = await resolveIdentifier(identifier);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: "invalid", message: error.message };
  }

  const user = await fetchSession();
  return { ok: true, user };
}

export async function logoutAccount() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => null);
}
