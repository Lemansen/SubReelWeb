import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredUser = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  passwordHash: string;
  role: "player";
  launcherToken: string;
  launcherTokenUpdatedAt: string;
  microsoftConnected: boolean;
  createdAt: string;
  lastLoginAt: string;
};

type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
};

type AuthStore = {
  users: StoredUser[];
  sessions: SessionRecord[];
};

export type PublicUser = Pick<
  StoredUser,
  | "id"
  | "login"
  | "email"
  | "nickname"
  | "role"
  | "launcherToken"
  | "launcherTokenUpdatedAt"
  | "microsoftConnected"
  | "createdAt"
  | "lastLoginAt"
>;

export type LauncherAuthUser = Pick<
  StoredUser,
  "id" | "login" | "nickname" | "role" | "launcherToken" | "microsoftConnected" | "lastLoginAt"
>;

type RegisterInput = {
  login: string;
  email: string;
  nickname: string;
  password: string;
};

type LoginInput = {
  identifier: string;
  password: string;
};

type RegisterResult =
  | { ok: true; user: PublicUser; sessionToken: string }
  | { ok: false; error: "fill" | "password" | "exists" };

type LoginResult =
  | { ok: true; user: PublicUser; sessionToken: string }
  | { ok: false; error: "fill" | "invalid" };

type UpdateProfileInput = {
  login: string;
  email: string;
  nickname: string;
};

type UpdatePasswordInput = {
  currentPassword: string;
  nextPassword: string;
};

const storeDir = path.join(process.cwd(), "data");
const storePath = path.join(storeDir, "auth-store.json");

function emptyStore(): AuthStore {
  return { users: [], sessions: [] };
}

async function ensureStore() {
  await mkdir(storeDir, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

async function readStore(): Promise<AuthStore> {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AuthStore>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: AuthStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");

  if (derived.length !== original.length) {
    return false;
  }

  return timingSafeEqual(derived, original);
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    launcherToken: user.launcherToken,
    launcherTokenUpdatedAt: user.launcherTokenUpdatedAt,
    microsoftConnected: user.microsoftConnected,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function toLauncherAuthUser(user: StoredUser): LauncherAuthUser {
  return {
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    role: user.role,
    launcherToken: user.launcherToken,
    microsoftConnected: user.microsoftConnected,
    lastLoginAt: user.lastLoginAt,
  };
}

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function makeUserId() {
  return randomBytes(12).toString("hex");
}

function findUserBySession(store: AuthStore, sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  const session = store.sessions.find((entry) => entry.token === sessionToken);

  if (!session) {
    return null;
  }

  return store.users.find((entry) => entry.id === session.userId) ?? null;
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const login = input.login.trim();
  const email = input.email.trim().toLowerCase();
  const nickname = input.nickname.trim();
  const password = input.password;

  if (!login || !email || !nickname || !password) {
    return { ok: false, error: "fill" };
  }

  if (password.length < 6) {
    return { ok: false, error: "password" };
  }

  const store = await readStore();
  const exists = store.users.some(
    (user) => user.login.toLowerCase() === login.toLowerCase() || user.email.toLowerCase() === email,
  );

  if (exists) {
    return { ok: false, error: "exists" };
  }

  const user: StoredUser = {
    id: makeUserId(),
    login,
    email,
    nickname,
    passwordHash: hashPassword(password),
    role: "player",
    launcherToken: createSessionToken(),
    launcherTokenUpdatedAt: new Date().toISOString(),
    microsoftConnected: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  const sessionToken = createSessionToken();
  store.users.push(user);
  store.sessions.push({
    token: sessionToken,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);

  return { ok: true, user: toPublicUser(user), sessionToken };
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password;

  if (!identifier || !password) {
    return { ok: false, error: "fill" };
  }

  const store = await readStore();
  const user =
    store.users.find(
      (entry) => entry.login.toLowerCase() === identifier || entry.email.toLowerCase() === identifier,
    ) ?? null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "invalid" };
  }

  user.lastLoginAt = new Date().toISOString();
  const sessionToken = createSessionToken();
  store.sessions = store.sessions.filter((session) => session.userId !== user.id);
  store.sessions.push({
    token: sessionToken,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeStore(store);

  return { ok: true, user: toPublicUser(user), sessionToken };
}

export async function getUserBySession(sessionToken: string | undefined): Promise<PublicUser | null> {
  if (!sessionToken) {
    return null;
  }

  const store = await readStore();
  const user = findUserBySession(store, sessionToken);
  return user ? toPublicUser(user) : null;
}

export async function clearSession(sessionToken: string | undefined) {
  if (!sessionToken) {
    return;
  }

  const store = await readStore();
  const nextSessions = store.sessions.filter((entry) => entry.token !== sessionToken);

  if (nextSessions.length === store.sessions.length) {
    return;
  }

  store.sessions = nextSessions;
  await writeStore(store);
}

export async function rotateLauncherToken(sessionToken: string | undefined): Promise<PublicUser | null> {
  const store = await readStore();
  const user = findUserBySession(store, sessionToken);

  if (!user) {
    return null;
  }

  user.launcherToken = createSessionToken();
  user.launcherTokenUpdatedAt = new Date().toISOString();
  await writeStore(store);

  return toPublicUser(user);
}

export async function authenticateLauncher(input: LoginInput): Promise<LauncherAuthUser | null> {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password;

  if (!identifier || !password) {
    return null;
  }

  const store = await readStore();
  const user =
    store.users.find(
      (entry) => entry.login.toLowerCase() === identifier || entry.email.toLowerCase() === identifier,
    ) ?? null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  user.lastLoginAt = new Date().toISOString();
  await writeStore(store);

  return toLauncherAuthUser(user);
}

export async function getLauncherUserByToken(launcherToken: string | undefined): Promise<LauncherAuthUser | null> {
  if (!launcherToken) {
    return null;
  }

  const store = await readStore();
  const user = store.users.find((entry) => entry.launcherToken === launcherToken);

  return user ? toLauncherAuthUser(user) : null;
}

export async function updateProfileBySession(
  sessionToken: string | undefined,
  input: UpdateProfileInput,
): Promise<
  | { ok: true; user: PublicUser }
  | { ok: false; error: "unauthorized" | "fill" | "exists" }
> {
  const login = input.login.trim();
  const email = input.email.trim().toLowerCase();
  const nickname = input.nickname.trim();

  if (!login || !email || !nickname) {
    return { ok: false, error: "fill" };
  }

  const store = await readStore();
  const user = findUserBySession(store, sessionToken);

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const exists = store.users.some(
    (entry) =>
      entry.id !== user.id &&
      (entry.login.toLowerCase() === login.toLowerCase() || entry.email.toLowerCase() === email),
  );

  if (exists) {
    return { ok: false, error: "exists" };
  }

  user.login = login;
  user.email = email;
  user.nickname = nickname;
  await writeStore(store);

  return { ok: true, user: toPublicUser(user) };
}

export async function updatePasswordBySession(
  sessionToken: string | undefined,
  input: UpdatePasswordInput,
): Promise<{ ok: true } | { ok: false; error: "unauthorized" | "fill" | "password" | "invalid" }> {
  const currentPassword = input.currentPassword;
  const nextPassword = input.nextPassword;

  if (!currentPassword || !nextPassword) {
    return { ok: false, error: "fill" };
  }

  if (nextPassword.length < 6) {
    return { ok: false, error: "password" };
  }

  const store = await readStore();
  const user = findUserBySession(store, sessionToken);

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false, error: "invalid" };
  }

  user.passwordHash = hashPassword(nextPassword);
  await writeStore(store);

  return { ok: true };
}
