import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import * as postgresAuth from "./auth-postgres";

export type StoredUser = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  passwordHash: string;
  role: "player" | "moderator" | "admin";
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

type UserRow = {
  id: string;
  login: string;
  email: string;
  nickname: string;
  password_hash: string;
  role: "player" | "moderator" | "admin";
  launcher_token: string;
  launcher_token_updated_at: string;
  microsoft_connected: number;
  created_at: string;
  last_login_at: string;
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

export type DirectoryUser = Pick<
  StoredUser,
  "id" | "login" | "nickname" | "role" | "createdAt" | "lastLoginAt" | "microsoftConnected"
> & {
  isCurrentUser: boolean;
};

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

function shouldUsePostgres() {
  return postgresAuth.isPostgresConfigured();
}

const workspaceRoot = resolveWorkspaceRoot();
const databaseDir = path.join(workspaceRoot, "SubReelSql");
const databasePath = path.join(databaseDir, "subreel-auth.sqlite");
const legacyStorePath = path.join(workspaceRoot, "subreelsite", "data", "auth-store.json");
const userSelectColumns = `
  id,
  login,
  email,
  nickname,
  password_hash,
  role,
  launcher_token,
  launcher_token_updated_at,
  microsoft_connected,
  created_at,
  last_login_at
`;

const authDatabaseGlobal = globalThis as typeof globalThis & {
  __subreelAuthDatabase?: { exec(sql: string): void; prepare(sql: string): { get(params?: Record<string, unknown>): unknown; all(params?: Record<string, unknown>): unknown[]; run(params?: Record<string, unknown>): unknown } };
  __subreelAuthDatabaseInitialized?: boolean;
};

function resolveWorkspaceRoot() {
  const currentDirectory = process.cwd();
  return path.basename(currentDirectory).toLowerCase() === "subreelsite"
    ? path.dirname(currentDirectory)
    : currentDirectory;
}

function getDatabase() {
  mkdirSync(databaseDir, { recursive: true });

  if (!authDatabaseGlobal.__subreelAuthDatabase) {
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    authDatabaseGlobal.__subreelAuthDatabase = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
    });
  }

  const database = authDatabaseGlobal.__subreelAuthDatabase;

  if (!authDatabaseGlobal.__subreelAuthDatabaseInitialized) {
    initializeDatabase(database);
    authDatabaseGlobal.__subreelAuthDatabaseInitialized = true;
  }

  return database;
}

export function isUserDirectoryEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.SUBREEL_ENABLE_USER_DIRECTORY === "1";
}

function initializeDatabase(database: { exec(sql: string): void; prepare(sql: string): { get(params?: Record<string, unknown>): unknown; all(params?: Record<string, unknown>): unknown[]; run(params?: Record<string, unknown>): unknown } }) {
  database.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL COLLATE NOCASE UNIQUE,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      nickname TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin')),
      launcher_token TEXT NOT NULL UNIQUE,
      launcher_token_updated_at TEXT NOT NULL,
      microsoft_connected INTEGER NOT NULL DEFAULT 0 CHECK (microsoft_connected IN (0, 1)),
      created_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);

  migrateLegacyStore(database);
}

function migrateLegacyStore(database: { exec(sql: string): void; prepare(sql: string): { get(params?: Record<string, unknown>): unknown; all(params?: Record<string, unknown>): unknown[]; run(params?: Record<string, unknown>): unknown } }) {
  const countRow = database.prepare("SELECT COUNT(*) AS count FROM users").get() as
    | { count?: number | bigint }
    | undefined;
  const userCount = Number(countRow?.count ?? 0);

  if (userCount > 0 || !existsSync(legacyStorePath)) {
    return;
  }

  let legacyStore: Partial<AuthStore>;

  try {
    legacyStore = JSON.parse(readFileSync(legacyStorePath, "utf8")) as Partial<AuthStore>;
  } catch {
    return;
  }

  const legacyUsers = Array.isArray(legacyStore.users) ? legacyStore.users : [];
  const legacySessions = Array.isArray(legacyStore.sessions) ? legacyStore.sessions : [];

  if (legacyUsers.length === 0) {
    return;
  }

  const insertUser = database.prepare(`
    INSERT OR IGNORE INTO users (
      id,
      login,
      email,
      nickname,
      password_hash,
      role,
      launcher_token,
      launcher_token_updated_at,
      microsoft_connected,
      created_at,
      last_login_at
    ) VALUES (
      :id,
      :login,
      :email,
      :nickname,
      :passwordHash,
      :role,
      :launcherToken,
      :launcherTokenUpdatedAt,
      :microsoftConnected,
      :createdAt,
      :lastLoginAt
    )
  `);

  const insertSession = database.prepare(`
    INSERT OR IGNORE INTO sessions (token, user_id, created_at)
    VALUES (:token, :userId, :createdAt)
  `);

  runInTransaction(database, () => {
    for (const legacyUser of legacyUsers) {
      const userId = normalizeValue(legacyUser.id) || makeUserId();
      const login = normalizeValue(legacyUser.login) || normalizeValue(legacyUser.nickname) || `player_${userId.slice(0, 8)}`;
      const email = normalizeEmail(legacyUser.email) || `${userId}@local.subreel`;
      const now = new Date().toISOString();

      insertUser.run({
        id: userId,
        login,
        email,
        nickname: normalizeValue(legacyUser.nickname) || login,
        passwordHash: normalizeValue(legacyUser.passwordHash) || hashPassword(createSessionToken()),
        role: "player",
        launcherToken: normalizeValue(legacyUser.launcherToken) || createSessionToken(),
        launcherTokenUpdatedAt: normalizeValue(legacyUser.launcherTokenUpdatedAt) || now,
        microsoftConnected: legacyUser.microsoftConnected ? 1 : 0,
        createdAt: normalizeValue(legacyUser.createdAt) || now,
        lastLoginAt: normalizeValue(legacyUser.lastLoginAt) || now,
      });
    }

    for (const legacySession of legacySessions) {
      const token = normalizeValue(legacySession.token);
      const userId = normalizeValue(legacySession.userId);
      const createdAt = normalizeValue(legacySession.createdAt) || new Date().toISOString();

      if (!token || !userId) {
        continue;
      }

      insertSession.run({
        token,
        userId,
        createdAt,
      });
    }
  });
}

function normalizeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return normalizeValue(value).toLowerCase();
}

function runInTransaction<T>(database: { exec(sql: string): void }, action: () => T) {
  database.exec("BEGIN IMMEDIATE");

  try {
    const result = action();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
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

function mapStoredUser(row: UserRow | null | undefined): StoredUser | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    login: row.login,
    email: row.email,
    nickname: row.nickname,
    passwordHash: row.password_hash,
    role: row.role,
    launcherToken: row.launcher_token,
    launcherTokenUpdatedAt: row.launcher_token_updated_at,
    microsoftConnected: Boolean(row.microsoft_connected),
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
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

function toDirectoryUser(user: StoredUser, currentUserId: string): DirectoryUser {
  return {
    id: user.id,
    login: user.login,
    nickname: user.nickname,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    microsoftConnected: user.microsoftConnected,
    isCurrentUser: user.id === currentUserId,
  };
}

function createSessionToken() {
  return randomBytes(32).toString("hex");
}

function makeUserId() {
  return randomBytes(12).toString("hex");
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed");
}

function findUserBySession(database: { prepare(sql: string): { get(params?: Record<string, unknown>): unknown } }, sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  const row = database
    .prepare(`
      SELECT ${userSelectColumns}
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = :token
      LIMIT 1
    `)
    .get({ token: sessionToken }) as UserRow | undefined;

  return mapStoredUser(row);
}

function findUserByIdentifier(database: { prepare(sql: string): { get(params?: Record<string, unknown>): unknown } }, identifier: string) {
  const row = database
    .prepare(`
      SELECT ${userSelectColumns}
      FROM users
      WHERE login = :identifier OR email = :identifier
      LIMIT 1
    `)
    .get({ identifier }) as UserRow | undefined;

  return mapStoredUser(row);
}

function findUserByLauncherToken(database: { prepare(sql: string): { get(params?: Record<string, unknown>): unknown } }, launcherToken: string | undefined) {
  if (!launcherToken) {
    return null;
  }

  const row = database
    .prepare(`
      SELECT ${userSelectColumns}
      FROM users
      WHERE launcher_token = :launcherToken
      LIMIT 1
    `)
    .get({ launcherToken }) as UserRow | undefined;

  return mapStoredUser(row);
}

async function sqliteRegisterUser(input: RegisterInput): Promise<RegisterResult> {
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

  const database = getDatabase();
  const exists = database
    .prepare(`
      SELECT 1 AS found
      FROM users
      WHERE login = :login OR email = :email
      LIMIT 1
    `)
    .get({ login, email }) as { found?: number } | undefined;

  if (exists?.found) {
    return { ok: false, error: "exists" };
  }

  const now = new Date().toISOString();
  const sessionToken = createSessionToken();
  const user: StoredUser = {
    id: makeUserId(),
    login,
    email,
    nickname,
    passwordHash: hashPassword(password),
    role: "player",
    launcherToken: createSessionToken(),
    launcherTokenUpdatedAt: now,
    microsoftConnected: false,
    createdAt: now,
    lastLoginAt: now,
  };

  try {
    runInTransaction(database, () => {
      database
        .prepare(`
          INSERT INTO users (
            id,
            login,
            email,
            nickname,
            password_hash,
            role,
            launcher_token,
            launcher_token_updated_at,
            microsoft_connected,
            created_at,
            last_login_at
          ) VALUES (
            :id,
            :login,
            :email,
            :nickname,
            :passwordHash,
            :role,
            :launcherToken,
            :launcherTokenUpdatedAt,
            :microsoftConnected,
            :createdAt,
            :lastLoginAt
          )
        `)
        .run({
          id: user.id,
          login: user.login,
          email: user.email,
          nickname: user.nickname,
          passwordHash: user.passwordHash,
          role: user.role,
          launcherToken: user.launcherToken,
          launcherTokenUpdatedAt: user.launcherTokenUpdatedAt,
          microsoftConnected: user.microsoftConnected ? 1 : 0,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        });

      database
        .prepare(`
          INSERT INTO sessions (token, user_id, created_at)
          VALUES (:token, :userId, :createdAt)
        `)
        .run({
          token: sessionToken,
          userId: user.id,
          createdAt: now,
        });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "exists" };
    }

    throw error;
  }

  return { ok: true, user: toPublicUser(user), sessionToken };
}

async function sqliteLoginUser(input: LoginInput): Promise<LoginResult> {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password;

  if (!identifier || !password) {
    return { ok: false, error: "fill" };
  }

  const database = getDatabase();
  const user = findUserByIdentifier(database, identifier);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "invalid" };
  }

  const sessionToken = createSessionToken();
  const now = new Date().toISOString();

  runInTransaction(database, () => {
    database
      .prepare(`
        UPDATE users
        SET last_login_at = :lastLoginAt
        WHERE id = :id
      `)
      .run({
        id: user.id,
        lastLoginAt: now,
      });

    database
      .prepare(`
        DELETE FROM sessions
        WHERE user_id = :userId
      `)
      .run({ userId: user.id });

    database
      .prepare(`
        INSERT INTO sessions (token, user_id, created_at)
        VALUES (:token, :userId, :createdAt)
      `)
      .run({
        token: sessionToken,
        userId: user.id,
        createdAt: now,
      });
  });

  user.lastLoginAt = now;
  return { ok: true, user: toPublicUser(user), sessionToken };
}

async function sqliteGetUserBySession(sessionToken: string | undefined): Promise<PublicUser | null> {
  if (!sessionToken) {
    return null;
  }

  const database = getDatabase();
  const user = findUserBySession(database, sessionToken);
  return user ? toPublicUser(user) : null;
}

async function sqliteClearSession(sessionToken: string | undefined) {
  if (!sessionToken) {
    return;
  }

  const database = getDatabase();
  database
    .prepare(`
      DELETE FROM sessions
      WHERE token = :token
    `)
    .run({ token: sessionToken });
}

async function sqliteRotateLauncherToken(sessionToken: string | undefined): Promise<PublicUser | null> {
  const database = getDatabase();
  const user = findUserBySession(database, sessionToken);

  if (!user) {
    return null;
  }

  const launcherToken = createSessionToken();
  const launcherTokenUpdatedAt = new Date().toISOString();

  database
    .prepare(`
      UPDATE users
      SET launcher_token = :launcherToken,
          launcher_token_updated_at = :launcherTokenUpdatedAt
      WHERE id = :id
    `)
    .run({
      id: user.id,
      launcherToken,
      launcherTokenUpdatedAt,
    });

  user.launcherToken = launcherToken;
  user.launcherTokenUpdatedAt = launcherTokenUpdatedAt;
  return toPublicUser(user);
}

async function sqliteAuthenticateLauncher(input: LoginInput): Promise<LauncherAuthUser | null> {
  const identifier = input.identifier.trim().toLowerCase();
  const password = input.password;

  if (!identifier || !password) {
    return null;
  }

  const database = getDatabase();
  const user = findUserByIdentifier(database, identifier);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  const now = new Date().toISOString();

  database
    .prepare(`
      UPDATE users
      SET last_login_at = :lastLoginAt
      WHERE id = :id
    `)
    .run({
      id: user.id,
      lastLoginAt: now,
    });

  user.lastLoginAt = now;
  return toLauncherAuthUser(user);
}

async function sqliteGetLauncherUserByToken(launcherToken: string | undefined): Promise<LauncherAuthUser | null> {
  if (!launcherToken) {
    return null;
  }

  const database = getDatabase();
  const user = findUserByLauncherToken(database, launcherToken);
  return user ? toLauncherAuthUser(user) : null;
}

async function sqliteListUsersForDirectory(sessionToken: string | undefined): Promise<DirectoryUser[] | null> {
  if (!sessionToken) {
    return null;
  }

  const database = getDatabase();
  const currentUser = findUserBySession(database, sessionToken);

  if (!currentUser) {
    return null;
  }

  const rows = database
    .prepare(`
      SELECT ${userSelectColumns}
      FROM users
      ORDER BY datetime(last_login_at) DESC, datetime(created_at) DESC, login ASC
    `)
    .all() as UserRow[];

  return rows
    .map((row) => mapStoredUser(row))
    .filter((user): user is StoredUser => user !== null)
    .map((user) => toDirectoryUser(user, currentUser.id));
}

async function sqliteUpdateProfileBySession(
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

  const database = getDatabase();
  const user = findUserBySession(database, sessionToken);

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  try {
    database
      .prepare(`
        UPDATE users
        SET login = :login,
            email = :email,
            nickname = :nickname
        WHERE id = :id
      `)
      .run({
        id: user.id,
        login,
        email,
        nickname,
      });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "exists" };
    }

    throw error;
  }

  user.login = login;
  user.email = email;
  user.nickname = nickname;
  return { ok: true, user: toPublicUser(user) };
}

async function sqliteUpdatePasswordBySession(
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

  const database = getDatabase();
  const user = findUserBySession(database, sessionToken);

  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false, error: "invalid" };
  }

  database
    .prepare(`
      UPDATE users
      SET password_hash = :passwordHash
      WHERE id = :id
    `)
    .run({
      id: user.id,
      passwordHash: hashPassword(nextPassword),
    });

  return { ok: true };
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  return shouldUsePostgres() ? postgresAuth.registerUser(input) : sqliteRegisterUser(input);
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  return shouldUsePostgres() ? postgresAuth.loginUser(input) : sqliteLoginUser(input);
}

export async function getUserBySession(sessionToken: string | undefined): Promise<PublicUser | null> {
  return shouldUsePostgres() ? postgresAuth.getUserBySession(sessionToken) : sqliteGetUserBySession(sessionToken);
}

export async function clearSession(sessionToken: string | undefined) {
  return shouldUsePostgres() ? postgresAuth.clearSession(sessionToken) : sqliteClearSession(sessionToken);
}

export async function rotateLauncherToken(sessionToken: string | undefined): Promise<PublicUser | null> {
  return shouldUsePostgres()
    ? postgresAuth.rotateLauncherToken(sessionToken)
    : sqliteRotateLauncherToken(sessionToken);
}

export async function authenticateLauncher(input: LoginInput): Promise<LauncherAuthUser | null> {
  return shouldUsePostgres() ? postgresAuth.authenticateLauncher(input) : sqliteAuthenticateLauncher(input);
}

export async function getLauncherUserByToken(launcherToken: string | undefined): Promise<LauncherAuthUser | null> {
  return shouldUsePostgres()
    ? postgresAuth.getLauncherUserByToken(launcherToken)
    : sqliteGetLauncherUserByToken(launcherToken);
}

export async function listUsersForDirectory(sessionToken: string | undefined): Promise<DirectoryUser[] | null> {
  return shouldUsePostgres()
    ? postgresAuth.listUsersForDirectory(sessionToken)
    : sqliteListUsersForDirectory(sessionToken);
}

export async function updateProfileBySession(
  sessionToken: string | undefined,
  input: UpdateProfileInput,
): Promise<
  | { ok: true; user: PublicUser }
  | { ok: false; error: "unauthorized" | "fill" | "exists" }
> {
  return shouldUsePostgres()
    ? postgresAuth.updateProfileBySession(sessionToken, input)
    : sqliteUpdateProfileBySession(sessionToken, input);
}

export async function updatePasswordBySession(
  sessionToken: string | undefined,
  input: UpdatePasswordInput,
): Promise<{ ok: true } | { ok: false; error: "unauthorized" | "fill" | "password" | "invalid" }> {
  return shouldUsePostgres()
    ? postgresAuth.updatePasswordBySession(sessionToken, input)
    : sqliteUpdatePasswordBySession(sessionToken, input);
}
