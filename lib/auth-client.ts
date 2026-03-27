"use client";

export type AccountUser = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  role: "player";
  launcherToken: string;
  launcherTokenUpdatedAt: string;
  microsoftConnected: boolean;
  createdAt: string;
  lastLoginAt: string;
};

type RegisterError = "fill" | "password" | "exists" | "unknown";
type LoginError = "fill" | "invalid" | "unknown";

type RegisterResult = { ok: true; user: AccountUser } | { ok: false; error: RegisterError };
type LoginResult = { ok: true; user: AccountUser } | { ok: false; error: LoginError };

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

export async function registerAccount(input: {
  login: string;
  email: string;
  nickname: string;
  password: string;
}): Promise<RegisterResult> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const result = await parseResponse<RegisterResult>(response);
  return result ?? { ok: false, error: "unknown" };
}

export async function loginAccount(input: {
  identifier: string;
  password: string;
}): Promise<LoginResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const result = await parseResponse<LoginResult>(response);
  return result ?? { ok: false, error: "unknown" };
}

export async function logoutAccount() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
