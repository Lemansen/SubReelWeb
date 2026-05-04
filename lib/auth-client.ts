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

async function checkRegisterAvailability(login: string, email: string) {
  const response = await fetch("/api/auth/register-check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login, email }),
  });

  const result = await parseResponse<{ ok: true; exists: boolean; loginExists: boolean; emailExists: boolean }>(response);
  return {
    exists: Boolean(result?.exists),
    loginExists: Boolean(result?.loginExists),
    emailExists: Boolean(result?.emailExists),
  };
}

export async function registerAccount(input: {
  login: string;
  email: string;
  nickname: string;
  password: string;
}): Promise<RegisterResult> {
  const login = input.login.trim();
  const email = input.email.trim();
  const nickname = input.nickname.trim();
  const password = input.password;

  if (!login || !email || !nickname || !password) {
    return { ok: false, error: "fill" };
  }

  if (password.length < 6) {
    return { ok: false, error: "password" };
  }

  const availability = await checkRegisterAvailability(login, email);
  if (availability.exists) {
    return {
      ok: false,
      error: "exists",
      reason: availability.loginExists && availability.emailExists ? "login_and_email" : availability.loginExists ? "login" : "email",
    };
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        login,
        nickname,
      },
    },
  });

  if (error) {
    if (/registered|already/i.test(error.message)) {
      return { ok: false, error: "exists", message: error.message };
    }

    return { ok: false, error: "unknown", message: error.message };
  }

  if (!data.session) {
    return { ok: true, user: null, pendingVerification: true };
  }

  const user = await fetchSession();
  return { ok: true, user, pendingVerification: false };
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
}
