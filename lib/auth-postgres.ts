import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool, type PoolClient } from "pg";

type StoredUser = {
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

type SessionRecord = { token: string; userId: string; createdAt: string };
type AuthStore = { users: StoredUser[]; sessions: SessionRecord[] };
type UserRow = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  password_hash: string;
  role: "player";
  launcher_token: string;
  launcher_token_updated_at: string | Date;
  microsoft_connected: boolean;
  created_at: string | Date;
  last_login_at: string | Date;
};

type PublicUser = Pick<StoredUser, "id" | "login" | "email" | "nickname" | "role" | "launcherToken" | "launcherTokenUpdatedAt" | "microsoftConnected" | "createdAt" | "lastLoginAt">;
type LauncherAuthUser = Pick<StoredUser, "id" | "login" | "nickname" | "role" | "launcherToken" | "microsoftConnected" | "lastLoginAt">;
type DirectoryUser = Pick<StoredUser, "id" | "login" | "nickname" | "role" | "createdAt" | "lastLoginAt" | "microsoftConnected"> & { isCurrentUser: boolean };
type RegisterInput = { login: string; email: string; nickname: string; password: string };
type LoginInput = { identifier: string; password: string };
type UpdateProfileInput = { login: string; email: string; nickname: string };
type UpdatePasswordInput = { currentPassword: string; nextPassword: string };
type RegisterResult = { ok: true; user: PublicUser; sessionToken: string } | { ok: false; error: "fill" | "password" | "exists" };
type LoginResult = { ok: true; user: PublicUser; sessionToken: string } | { ok: false; error: "fill" | "invalid" };

const root = path.basename(process.cwd()).toLowerCase() === "subreelsite" ? path.dirname(process.cwd()) : process.cwd();
const sqliteStorePath = path.join(root, "SubReelSql", "subreel-auth.sqlite");
const legacyStorePath = path.join(root, "subreelsite", "data", "auth-store.json");
const authGlobal = globalThis as typeof globalThis & { __subreelPgPool?: Pool; __subreelPgInit?: Promise<void> };
const userSelect = `
  a.id,
  a.login,
  a.email,
  p.nickname,
  c.password_hash,
  a.role,
  t.token AS launcher_token,
  t.updated_at AS launcher_token_updated_at,
  c.microsoft_connected,
  a.created_at,
  a.last_login_at
`;

export function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function pool() {
  if (!authGlobal.__subreelPgPool) authGlobal.__subreelPgPool = new Pool({ connectionString: process.env.DATABASE_URL?.trim() });
  return authGlobal.__subreelPgPool;
}

async function ensureDb() {
  if (!authGlobal.__subreelPgInit) authGlobal.__subreelPgInit = initDb().catch((error) => {
    authGlobal.__subreelPgInit = undefined;
    throw error;
  });
  await authGlobal.__subreelPgInit;
}

async function initDb() {
  await pool().query(`
    CREATE TABLE IF NOT EXISTS auth_accounts (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player','admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','deleted')),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      last_login_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_profiles (
      account_id TEXT PRIMARY KEY REFERENCES auth_accounts(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      locale TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_credentials (
      account_id TEXT PRIMARY KEY REFERENCES auth_accounts(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      password_updated_at TIMESTAMPTZ NOT NULL,
      microsoft_connected BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE TABLE IF NOT EXISTS auth_launcher_tokens (
      account_id TEXT PRIMARY KEY REFERENCES auth_accounts(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_devices (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
      client_kind TEXT NOT NULL CHECK (client_kind IN ('website','launcher','mobile')),
      platform TEXT NOT NULL CHECK (platform IN ('web','windows','android','ios','unknown')),
      device_name TEXT,
      device_key TEXT UNIQUE,
      push_token TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_identities (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      provider_email TEXT,
      linked_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE(provider, provider_account_id)
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
      client_kind TEXT NOT NULL CHECK (client_kind IN ('website','launcher','mobile')),
      device_id TEXT REFERENCES auth_devices(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_accounts_login_lower ON auth_accounts ((LOWER(login)));
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_accounts_email_lower ON auth_accounts ((LOWER(email)));
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_id ON auth_sessions(account_id);
  `);

  const count = Number((await pool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM auth_accounts")).rows[0]?.count ?? "0");
  if (count > 0) return;
  const store = await readMigrationStore();
  if (store.users.length === 0) return;

  await tx(async (client) => {
    for (const user of store.users) await insertUserBundle(client, user);
    for (const session of store.sessions) {
      await client.query(
        `INSERT INTO auth_sessions (token, account_id, client_kind, created_at, last_seen_at) VALUES ($1,$2,'website',$3::timestamptz,$3::timestamptz) ON CONFLICT (token) DO NOTHING`,
        [session.token, session.userId, session.createdAt],
      );
    }
  });
}

async function readMigrationStore(): Promise<AuthStore> {
  const pgStore = await readLegacyPostgresStore();
  if (pgStore.users.length > 0) return pgStore;
  const sqliteStore = readSqliteStore();
  if (sqliteStore.users.length > 0) return sqliteStore;
  return readLegacyJsonStore();
}

async function readLegacyPostgresStore(): Promise<AuthStore> {
  const hasUsers = Boolean((await pool().query<{ regclass: string | null }>("SELECT to_regclass('public.users') AS regclass")).rows[0]?.regclass);
  if (!hasUsers) return { users: [], sessions: [] };

  const users = (await pool().query<UserRow>(`SELECT id, login, email, nickname, password_hash, role, launcher_token, launcher_token_updated_at, microsoft_connected, created_at, last_login_at FROM users`)).rows.map(mapUser).filter(Boolean) as StoredUser[];
  const hasSessions = Boolean((await pool().query<{ regclass: string | null }>("SELECT to_regclass('public.sessions') AS regclass")).rows[0]?.regclass);
  const sessions = hasSessions
    ? (await pool().query<{ token: string; user_id: string; created_at: string | Date }>(`SELECT token, user_id, created_at FROM sessions`)).rows.map((row) => ({
        token: text(row.token),
        userId: text(row.user_id),
        createdAt: stamp(row.created_at),
      }))
    : [];
  return { users, sessions };
}

function readSqliteStore(): AuthStore {
  if (!existsSync(sqliteStorePath)) return { users: [], sessions: [] };
  let db: { close(): void; prepare(sql: string): { all(): unknown[] } } | null = null;
  try {
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    db = new DatabaseSync(sqliteStorePath, { readOnly: true });
    const tables = new Set((db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all() as Array<{ name: string }>).map((row) => row.name));
    if (!tables.has("users")) return { users: [], sessions: [] };
    const users = (db.prepare(`SELECT id, login, email, nickname, password_hash, role, launcher_token, launcher_token_updated_at, microsoft_connected, created_at, last_login_at FROM users`).all() as UserRow[]).map(mapUser).filter(Boolean) as StoredUser[];
    const sessions = tables.has("sessions")
      ? (db.prepare(`SELECT token, user_id AS "userId", created_at AS "createdAt" FROM sessions`).all() as SessionRecord[]).map((row) => ({ token: text(row.token), userId: text(row.userId), createdAt: stamp(row.createdAt) }))
      : [];
    return { users, sessions };
  } catch {
    return { users: [], sessions: [] };
  } finally {
    db?.close();
  }
}

function readLegacyJsonStore(): AuthStore {
  if (!existsSync(legacyStorePath)) return { users: [], sessions: [] };
  try {
    const raw = JSON.parse(readFileSync(legacyStorePath, "utf8")) as Partial<AuthStore>;
    return {
      users: Array.isArray(raw.users)
        ? raw.users.map((u) => {
            const id = text(u.id) || id12();
            const login = text(u.login) || text(u.nickname) || `player_${id.slice(0, 8)}`;
            return {
              id,
              login,
              email: email(u.email) || `${id}@local.subreel`,
              nickname: text(u.nickname) || login,
              passwordHash: text(u.passwordHash) || hashPassword(token32()),
              role: "player",
              launcherToken: text(u.launcherToken) || token32(),
              launcherTokenUpdatedAt: stamp(u.launcherTokenUpdatedAt),
              microsoftConnected: Boolean(u.microsoftConnected),
              createdAt: stamp(u.createdAt),
              lastLoginAt: stamp(u.lastLoginAt),
            } satisfies StoredUser;
          })
        : [],
      sessions: Array.isArray(raw.sessions) ? raw.sessions.map((s) => ({ token: text(s.token), userId: text(s.userId), createdAt: stamp(s.createdAt) })) : [],
    };
  } catch {
    return { users: [], sessions: [] };
  }
}

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function email(value: unknown) { return text(value).toLowerCase(); }
function stamp(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  return new Date().toISOString();
}
function token32() { return randomBytes(32).toString("hex"); }
function id12() { return randomBytes(12).toString("hex"); }
function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, "hex");
  return derived.length === original.length && timingSafeEqual(derived, original);
}
function mapUser(row: UserRow | null | undefined): StoredUser | null {
  if (!row) return null;
  return {
    id: row.id,
    login: text(row.login),
    email: email(row.email),
    nickname: text(row.nickname) || text(row.login) || "Player",
    passwordHash: text(row.password_hash),
    role: "player",
    launcherToken: text(row.launcher_token) || token32(),
    launcherTokenUpdatedAt: stamp(row.launcher_token_updated_at),
    microsoftConnected: Boolean(row.microsoft_connected),
    createdAt: stamp(row.created_at),
    lastLoginAt: stamp(row.last_login_at),
  };
}
function asPublic(user: StoredUser): PublicUser { return { id: user.id, login: user.login, email: user.email, nickname: user.nickname, role: user.role, launcherToken: user.launcherToken, launcherTokenUpdatedAt: user.launcherTokenUpdatedAt, microsoftConnected: user.microsoftConnected, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt }; }
function asLauncher(user: StoredUser): LauncherAuthUser { return { id: user.id, login: user.login, nickname: user.nickname, role: user.role, launcherToken: user.launcherToken, microsoftConnected: user.microsoftConnected, lastLoginAt: user.lastLoginAt }; }
function asDirectory(user: StoredUser, currentUserId: string): DirectoryUser { return { id: user.id, login: user.login, nickname: user.nickname, role: user.role, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt, microsoftConnected: user.microsoftConnected, isCurrentUser: user.id === currentUserId }; }
function uniqueError(error: unknown) { return typeof error === "object" && error !== null && "code" in error && error.code === "23505"; }

async function tx<T>(action: (client: PoolClient) => Promise<T>) {
  const client = await pool().connect();
  try { await client.query("BEGIN"); const result = await action(client); await client.query("COMMIT"); return result; }
  catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

async function insertUserBundle(client: PoolClient, user: StoredUser) {
  await client.query(`INSERT INTO auth_accounts (id, login, email, role, status, created_at, updated_at, last_login_at) VALUES ($1,$2,$3,$4,'active',$5::timestamptz,$6::timestamptz,$7::timestamptz) ON CONFLICT (id) DO NOTHING`, [user.id, user.login, user.email, user.role, user.createdAt, user.lastLoginAt, user.lastLoginAt]);
  await client.query(`INSERT INTO auth_profiles (account_id, nickname, created_at, updated_at) VALUES ($1,$2,$3::timestamptz,$4::timestamptz) ON CONFLICT (account_id) DO NOTHING`, [user.id, user.nickname, user.createdAt, user.lastLoginAt]);
  await client.query(`INSERT INTO auth_credentials (account_id, password_hash, password_updated_at, microsoft_connected) VALUES ($1,$2,$3::timestamptz,$4) ON CONFLICT (account_id) DO NOTHING`, [user.id, user.passwordHash, user.lastLoginAt, user.microsoftConnected]);
  await client.query(`INSERT INTO auth_launcher_tokens (account_id, token, updated_at) VALUES ($1,$2,$3::timestamptz) ON CONFLICT (account_id) DO NOTHING`, [user.id, user.launcherToken, user.launcherTokenUpdatedAt]);
}

async function findUserByIdentifier(identifier: string) {
  const result = await pool().query<UserRow>(`SELECT ${userSelect} FROM auth_accounts a JOIN auth_profiles p ON p.account_id=a.id JOIN auth_credentials c ON c.account_id=a.id JOIN auth_launcher_tokens t ON t.account_id=a.id WHERE LOWER(a.login)=LOWER($1) OR LOWER(a.email)=LOWER($1) LIMIT 1`, [identifier]);
  return mapUser(result.rows[0]);
}

async function findUserBySession(token: string | undefined) {
  if (!token) return null;
  const result = await pool().query<UserRow>(`SELECT ${userSelect} FROM auth_sessions s JOIN auth_accounts a ON a.id=s.account_id JOIN auth_profiles p ON p.account_id=a.id JOIN auth_credentials c ON c.account_id=a.id JOIN auth_launcher_tokens t ON t.account_id=a.id WHERE s.token=$1 AND s.revoked_at IS NULL LIMIT 1`, [token]);
  return mapUser(result.rows[0]);
}

async function findUserByLauncherToken(token: string | undefined) {
  if (!token) return null;
  const result = await pool().query<UserRow>(`SELECT ${userSelect} FROM auth_launcher_tokens t JOIN auth_accounts a ON a.id=t.account_id JOIN auth_profiles p ON p.account_id=a.id JOIN auth_credentials c ON c.account_id=a.id WHERE t.token=$1 LIMIT 1`, [token]);
  return mapUser(result.rows[0]);
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  await ensureDb();
  const login = input.login.trim(); const userEmail = input.email.trim().toLowerCase(); const nickname = input.nickname.trim(); const password = input.password;
  if (!login || !userEmail || !nickname || !password) return { ok: false, error: "fill" };
  if (password.length < 6) return { ok: false, error: "password" };
  const now = new Date().toISOString();
  const user: StoredUser = { id: id12(), login, email: userEmail, nickname, passwordHash: hashPassword(password), role: "player", launcherToken: token32(), launcherTokenUpdatedAt: now, microsoftConnected: false, createdAt: now, lastLoginAt: now };
  const sessionToken = token32();
  try {
    await tx(async (client) => {
      await insertUserBundle(client, user);
      await client.query(`INSERT INTO auth_sessions (token, account_id, client_kind, created_at, last_seen_at) VALUES ($1,$2,'website',$3::timestamptz,$3::timestamptz)`, [sessionToken, user.id, now]);
    });
  } catch (error) {
    if (uniqueError(error)) return { ok: false, error: "exists" };
    throw error;
  }
  return { ok: true, user: asPublic(user), sessionToken };
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  await ensureDb();
  const identifier = input.identifier.trim().toLowerCase(); const password = input.password;
  if (!identifier || !password) return { ok: false, error: "fill" };
  const user = await findUserByIdentifier(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) return { ok: false, error: "invalid" };
  const now = new Date().toISOString(); const sessionToken = token32();
  await tx(async (client) => {
    await client.query(`UPDATE auth_accounts SET last_login_at=$1::timestamptz, updated_at=$1::timestamptz WHERE id=$2`, [now, user.id]);
    await client.query(`UPDATE auth_sessions SET revoked_at=$1::timestamptz, last_seen_at=$1::timestamptz WHERE account_id=$2 AND client_kind='website' AND revoked_at IS NULL`, [now, user.id]);
    await client.query(`INSERT INTO auth_sessions (token, account_id, client_kind, created_at, last_seen_at) VALUES ($1,$2,'website',$3::timestamptz,$3::timestamptz)`, [sessionToken, user.id, now]);
  });
  user.lastLoginAt = now;
  return { ok: true, user: asPublic(user), sessionToken };
}

export async function getUserBySession(sessionToken: string | undefined): Promise<PublicUser | null> {
  await ensureDb();
  const user = await findUserBySession(sessionToken);
  return user ? asPublic(user) : null;
}

export async function clearSession(sessionToken: string | undefined) {
  await ensureDb();
  if (!sessionToken) return;
  await pool().query(`UPDATE auth_sessions SET revoked_at=NOW(), last_seen_at=NOW() WHERE token=$1 AND revoked_at IS NULL`, [sessionToken]);
}

export async function rotateLauncherToken(sessionToken: string | undefined): Promise<PublicUser | null> {
  await ensureDb();
  const user = await findUserBySession(sessionToken);
  if (!user) return null;
  const now = new Date().toISOString();
  const nextToken = token32();
  await pool().query(`UPDATE auth_launcher_tokens SET token=$1, updated_at=$2::timestamptz WHERE account_id=$3`, [nextToken, now, user.id]);
  user.launcherToken = nextToken;
  user.launcherTokenUpdatedAt = now;
  return asPublic(user);
}

export async function authenticateLauncher(input: LoginInput): Promise<LauncherAuthUser | null> {
  await ensureDb();
  const identifier = input.identifier.trim().toLowerCase(); const password = input.password;
  if (!identifier || !password) return null;
  const user = await findUserByIdentifier(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  const now = new Date().toISOString();
  await pool().query(`UPDATE auth_accounts SET last_login_at=$1::timestamptz, updated_at=$1::timestamptz WHERE id=$2`, [now, user.id]);
  user.lastLoginAt = now;
  return asLauncher(user);
}

export async function getLauncherUserByToken(launcherToken: string | undefined): Promise<LauncherAuthUser | null> {
  await ensureDb();
  const user = await findUserByLauncherToken(launcherToken);
  return user ? asLauncher(user) : null;
}

export async function listUsersForDirectory(sessionToken: string | undefined): Promise<DirectoryUser[] | null> {
  await ensureDb();
  const currentUser = await findUserBySession(sessionToken);
  if (!currentUser) return null;
  const result = await pool().query<UserRow>(`SELECT ${userSelect} FROM auth_accounts a JOIN auth_profiles p ON p.account_id=a.id JOIN auth_credentials c ON c.account_id=a.id JOIN auth_launcher_tokens t ON t.account_id=a.id ORDER BY a.last_login_at DESC, a.created_at DESC, a.login ASC`);
  return result.rows.map(mapUser).filter(Boolean).map((user) => asDirectory(user as StoredUser, currentUser.id));
}

export async function updateProfileBySession(sessionToken: string | undefined, input: UpdateProfileInput): Promise<{ ok: true; user: PublicUser } | { ok: false; error: "unauthorized" | "fill" | "exists" }> {
  await ensureDb();
  const login = input.login.trim(); const userEmail = input.email.trim().toLowerCase(); const nickname = input.nickname.trim();
  if (!login || !userEmail || !nickname) return { ok: false, error: "fill" };
  const user = await findUserBySession(sessionToken);
  if (!user) return { ok: false, error: "unauthorized" };
  const now = new Date().toISOString();
  try {
    await tx(async (client) => {
      await client.query(`UPDATE auth_accounts SET login=$1, email=$2, updated_at=$3::timestamptz WHERE id=$4`, [login, userEmail, now, user.id]);
      await client.query(`UPDATE auth_profiles SET nickname=$1, updated_at=$2::timestamptz WHERE account_id=$3`, [nickname, now, user.id]);
    });
  } catch (error) {
    if (uniqueError(error)) return { ok: false, error: "exists" };
    throw error;
  }
  user.login = login; user.email = userEmail; user.nickname = nickname;
  return { ok: true, user: asPublic(user) };
}

export async function updatePasswordBySession(sessionToken: string | undefined, input: UpdatePasswordInput): Promise<{ ok: true } | { ok: false; error: "unauthorized" | "fill" | "password" | "invalid" }> {
  await ensureDb();
  if (!input.currentPassword || !input.nextPassword) return { ok: false, error: "fill" };
  if (input.nextPassword.length < 6) return { ok: false, error: "password" };
  const user = await findUserBySession(sessionToken);
  if (!user) return { ok: false, error: "unauthorized" };
  if (!verifyPassword(input.currentPassword, user.passwordHash)) return { ok: false, error: "invalid" };
  const now = new Date().toISOString();
  await pool().query(`UPDATE auth_credentials SET password_hash=$1, password_updated_at=$2::timestamptz WHERE account_id=$3`, [hashPassword(input.nextPassword), now, user.id]);
  return { ok: true };
}
