import "server-only";

import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

type LauncherLinkStatus = "pending" | "approved" | "expired";
type LauncherAuthUser = {
  id: string;
  login: string;
  nickname: string;
  role: "player";
  launcherToken: string;
  microsoftConnected: boolean;
  lastLoginAt: string;
};

type LauncherLinkStartInput = {
  clientName?: string;
  clientPlatform?: string;
};

type LauncherLinkRequest = {
  requestId: string;
  pollToken: string;
  verificationUrl: string;
  expiresAt: string;
  intervalSeconds: number;
  clientName: string;
  clientPlatform: string;
  status: LauncherLinkStatus;
  approvedAt: string | null;
};

type LauncherLinkBrowserState = Omit<LauncherLinkRequest, "pollToken" | "verificationUrl" | "intervalSeconds">;

type LauncherLinkRow = {
  id: string;
  poll_token: string;
  account_id?: string | null;
  client_name: string;
  client_platform: string;
  status: LauncherLinkStatus;
  expires_at: string | Date;
  approved_at?: string | Date | null;
};

type PgUserRow = {
  id: string;
  login: string;
  nickname: string;
  role: "player";
  launcher_token: string;
  microsoft_connected: boolean;
  last_login_at: string | Date;
};

type SqliteUserRow = {
  id: string;
  login: string;
  nickname: string;
  role: "player";
  launcher_token: string;
  microsoft_connected: number;
  last_login_at: string;
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): {
    get(params?: Record<string, unknown>): unknown;
    run(params?: Record<string, unknown>): unknown;
  };
};

const globalState = globalThis as typeof globalThis & {
  __subreelLauncherLinkPgPool?: Pool;
  __subreelLauncherLinkPgInit?: Promise<void>;
  __subreelLauncherLinkSqlite?: SqliteDatabase;
  __subreelLauncherLinkSqliteInit?: boolean;
};

const root = path.basename(process.cwd()).toLowerCase() === "subreelsite" ? path.dirname(process.cwd()) : process.cwd();
const sqlitePath = path.join(root, "SubReelSql", "subreel-auth.sqlite");
const linkLifetimeMs = 10 * 60 * 1000;
const pollIntervalSeconds = 3;

export async function startLauncherLink(input: LauncherLinkStartInput = {}): Promise<LauncherLinkRequest> {
  return usePostgres() ? startLauncherLinkPostgres(input) : startLauncherLinkSqlite(input);
}

export async function getLauncherLinkRequest(requestId: string | undefined): Promise<LauncherLinkBrowserState | null> {
  return usePostgres() ? getLauncherLinkRequestPostgres(requestId) : getLauncherLinkRequestSqlite(requestId);
}

export async function approveLauncherLink(
  sessionToken: string | undefined,
  requestId: string | undefined,
): Promise<{ ok: true; request: LauncherLinkBrowserState } | { ok: false; error: "unauthorized" | "invalid" | "expired" }> {
  return usePostgres()
    ? approveLauncherLinkPostgres(sessionToken, requestId)
    : approveLauncherLinkSqlite(sessionToken, requestId);
}

export async function pollLauncherLink(
  requestId: string | undefined,
  pollToken: string | undefined,
): Promise<{ status: "invalid" | LauncherLinkStatus; request?: LauncherLinkBrowserState; user?: LauncherAuthUser }> {
  return usePostgres()
    ? pollLauncherLinkPostgres(requestId, pollToken)
    : pollLauncherLinkSqlite(requestId, pollToken);
}

function usePostgres() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function siteBaseUrl() {
  const configured = process.env.SUBREEL_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return process.env.NODE_ENV === "production" ? "https://subreel.ru" : "http://127.0.0.1:3000";
}

function createRequestId() {
  return randomBytes(18).toString("hex");
}

function createPollToken() {
  return randomBytes(32).toString("hex");
}

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function normalizeClientName(value: unknown) {
  return normalizeText(value, "SubReel Launcher").slice(0, 80);
}

function normalizeClientPlatform(value: unknown) {
  return normalizeText(value, "windows").slice(0, 32);
}

function toIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return normalizeText(value);
}

function toBrowserState(request: LauncherLinkRequest): LauncherLinkBrowserState {
  return {
    requestId: request.requestId,
    clientName: request.clientName,
    clientPlatform: request.clientPlatform,
    expiresAt: request.expiresAt,
    status: request.status,
    approvedAt: request.approvedAt,
  };
}

function mapPgUser(row: PgUserRow | null | undefined): LauncherAuthUser | null {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    nickname: row.nickname,
    role: "player",
    launcherToken: row.launcher_token,
    microsoftConnected: Boolean(row.microsoft_connected),
    lastLoginAt: toIso(row.last_login_at),
  };
}

function mapSqliteUser(row: SqliteUserRow | null | undefined): LauncherAuthUser | null {
  if (!row) return null;
  return {
    id: row.id,
    login: row.login,
    nickname: row.nickname,
    role: "player",
    launcherToken: row.launcher_token,
    microsoftConnected: Boolean(row.microsoft_connected),
    lastLoginAt: row.last_login_at,
  };
}

function mapRequest(row: LauncherLinkRow | null | undefined): LauncherLinkRequest | null {
  if (!row) return null;
  return {
    requestId: row.id,
    pollToken: row.poll_token,
    verificationUrl: `${siteBaseUrl()}/launcher/connect?requestId=${encodeURIComponent(row.id)}`,
    expiresAt: toIso(row.expires_at),
    intervalSeconds: pollIntervalSeconds,
    clientName: row.client_name,
    clientPlatform: row.client_platform,
    status: row.status,
    approvedAt: row.approved_at ? toIso(row.approved_at) : null,
  };
}

function sqliteDb() {
  mkdirSync(path.dirname(sqlitePath), { recursive: true });
  if (!globalState.__subreelLauncherLinkSqlite) {
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    globalState.__subreelLauncherLinkSqlite = new DatabaseSync(sqlitePath, { enableForeignKeyConstraints: true }) as SqliteDatabase;
  }
  if (!globalState.__subreelLauncherLinkSqliteInit) {
    globalState.__subreelLauncherLinkSqlite.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS launcher_link_requests (
        id TEXT PRIMARY KEY,
        poll_token TEXT NOT NULL UNIQUE,
        account_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        client_name TEXT NOT NULL,
        client_platform TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending','approved','expired')),
        requested_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        approved_at TEXT,
        completed_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS idx_launcher_link_requests_status ON launcher_link_requests(status, expires_at);
    `);
    globalState.__subreelLauncherLinkSqliteInit = true;
  }
  return globalState.__subreelLauncherLinkSqlite;
}

function expireSqliteLinks(database: SqliteDatabase) {
  database.prepare(`UPDATE launcher_link_requests SET status='expired' WHERE status='pending' AND expires_at <= :now`).run({
    now: new Date().toISOString(),
  });
}

function findSqliteRequest(database: SqliteDatabase, requestId: string | undefined, pollToken?: string) {
  if (!requestId) return null;
  expireSqliteLinks(database);
  const sql = pollToken
    ? `SELECT id, poll_token, account_id, client_name, client_platform, status, expires_at, approved_at FROM launcher_link_requests WHERE id=:id AND poll_token=:pollToken LIMIT 1`
    : `SELECT id, poll_token, account_id, client_name, client_platform, status, expires_at, approved_at FROM launcher_link_requests WHERE id=:id LIMIT 1`;
  return mapRequest(database.prepare(sql).get({ id: requestId, pollToken }) as LauncherLinkRow | undefined);
}

function findSqliteUserBySession(database: SqliteDatabase, sessionToken: string | undefined) {
  if (!sessionToken) return null;
  return mapSqliteUser(database.prepare(`
    SELECT id, login, nickname, role, launcher_token, microsoft_connected, last_login_at
    FROM users
    WHERE id = (SELECT user_id FROM sessions WHERE token=:token LIMIT 1)
    LIMIT 1
  `).get({ token: sessionToken }) as SqliteUserRow | undefined);
}

function findSqliteUserById(database: SqliteDatabase, userId: string | undefined) {
  if (!userId) return null;
  return mapSqliteUser(database.prepare(`
    SELECT id, login, nickname, role, launcher_token, microsoft_connected, last_login_at
    FROM users
    WHERE id=:id
    LIMIT 1
  `).get({ id: userId }) as SqliteUserRow | undefined);
}

async function startLauncherLinkSqlite(input: LauncherLinkStartInput) {
  const database = sqliteDb();
  const now = new Date();
  const requestId = createRequestId();
  const pollToken = createPollToken();
  const expiresAt = new Date(now.getTime() + linkLifetimeMs).toISOString();
  database.prepare(`
    INSERT INTO launcher_link_requests (id, poll_token, client_name, client_platform, status, requested_at, expires_at)
    VALUES (:id, :pollToken, :clientName, :clientPlatform, 'pending', :requestedAt, :expiresAt)
  `).run({
    id: requestId,
    pollToken,
    clientName: normalizeClientName(input.clientName),
    clientPlatform: normalizeClientPlatform(input.clientPlatform),
    requestedAt: now.toISOString(),
    expiresAt,
  });
  return mapRequest({
    id: requestId,
    poll_token: pollToken,
    client_name: normalizeClientName(input.clientName),
    client_platform: normalizeClientPlatform(input.clientPlatform),
    status: "pending",
    expires_at: expiresAt,
    approved_at: null,
  } as LauncherLinkRow)!;
}

async function getLauncherLinkRequestSqlite(requestId: string | undefined) {
  const request = findSqliteRequest(sqliteDb(), requestId);
  return request ? toBrowserState(request) : null;
}

async function approveLauncherLinkSqlite(sessionToken: string | undefined, requestId: string | undefined) {
  const database = sqliteDb();
  const user = findSqliteUserBySession(database, sessionToken);
  if (!user) return { ok: false as const, error: "unauthorized" as const };
  const request = findSqliteRequest(database, requestId);
  if (!request) return { ok: false as const, error: "invalid" as const };
  if (request.status === "expired") return { ok: false as const, error: "expired" as const };

  const approvedAt = new Date().toISOString();
  database.prepare(`
    UPDATE launcher_link_requests
    SET status='approved', account_id=:accountId, approved_at=:approvedAt
    WHERE id=:id AND status='pending'
  `).run({
    id: request.requestId,
    accountId: user.id,
    approvedAt,
  });
  database.prepare(`UPDATE users SET last_login_at=:lastLoginAt WHERE id=:id`).run({
    id: user.id,
    lastLoginAt: approvedAt,
  });
  return {
    ok: true as const,
    request: toBrowserState({
      ...request,
      status: "approved",
      approvedAt,
    }),
  };
}

async function pollLauncherLinkSqlite(requestId: string | undefined, pollToken: string | undefined) {
  const database = sqliteDb();
  const request = findSqliteRequest(database, requestId, pollToken);
  if (!request) return { status: "invalid" as const };
  if (request.status !== "approved") return { status: request.status, request: toBrowserState(request) };
  const row = database.prepare(`SELECT account_id FROM launcher_link_requests WHERE id=:id LIMIT 1`).get({ id: request.requestId }) as
    | { account_id?: string | null }
    | undefined;
  const user = findSqliteUserById(database, row?.account_id ?? undefined);
  if (!user) return { status: "invalid" as const };
  database.prepare(`UPDATE launcher_link_requests SET completed_at=:completedAt WHERE id=:id`).run({
    id: request.requestId,
    completedAt: new Date().toISOString(),
  });
  return { status: "approved" as const, request: toBrowserState(request), user };
}

function pgPool() {
  if (!globalState.__subreelLauncherLinkPgPool) {
    globalState.__subreelLauncherLinkPgPool = new Pool({ connectionString: process.env.DATABASE_URL?.trim() });
  }
  return globalState.__subreelLauncherLinkPgPool;
}

async function ensurePgSchema() {
  if (!globalState.__subreelLauncherLinkPgInit) {
    globalState.__subreelLauncherLinkPgInit = pgPool().query(`
      CREATE TABLE IF NOT EXISTS auth_launcher_link_requests (
        id TEXT PRIMARY KEY,
        poll_token TEXT NOT NULL UNIQUE,
        account_id TEXT REFERENCES auth_accounts(id) ON DELETE SET NULL,
        client_name TEXT NOT NULL,
        client_platform TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending','approved','expired')),
        requested_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        approved_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_auth_launcher_link_requests_status ON auth_launcher_link_requests(status, expires_at);
    `).then(() => undefined).catch((error) => {
      globalState.__subreelLauncherLinkPgInit = undefined;
      throw error;
    });
  }
  await globalState.__subreelLauncherLinkPgInit;
}

async function expirePgLinks() {
  await pgPool().query(`UPDATE auth_launcher_link_requests SET status='expired' WHERE status='pending' AND expires_at <= NOW()`);
}

async function findPgRequest(requestId: string | undefined, pollToken?: string) {
  if (!requestId) return null;
  await ensurePgSchema();
  await expirePgLinks();
  const result = await pgPool().query<LauncherLinkRow>(
    pollToken
      ? `SELECT id, poll_token, account_id, client_name, client_platform, status, expires_at, approved_at FROM auth_launcher_link_requests WHERE id=$1 AND poll_token=$2 LIMIT 1`
      : `SELECT id, poll_token, account_id, client_name, client_platform, status, expires_at, approved_at FROM auth_launcher_link_requests WHERE id=$1 LIMIT 1`,
    pollToken ? [requestId, pollToken] : [requestId],
  );
  return mapRequest(result.rows[0]);
}

async function findPgUserBySession(sessionToken: string | undefined) {
  if (!sessionToken) return null;
  const result = await pgPool().query<PgUserRow>(`
    SELECT a.id, a.login, p.nickname, a.role, t.token AS launcher_token, c.microsoft_connected, a.last_login_at
    FROM auth_sessions s
    JOIN auth_accounts a ON a.id = s.account_id
    JOIN auth_profiles p ON p.account_id = a.id
    JOIN auth_credentials c ON c.account_id = a.id
    JOIN auth_launcher_tokens t ON t.account_id = a.id
    WHERE s.token = $1 AND s.revoked_at IS NULL
    LIMIT 1
  `, [sessionToken]);
  return mapPgUser(result.rows[0]);
}

async function findPgUserByAccountId(accountId: string | undefined) {
  if (!accountId) return null;
  const result = await pgPool().query<PgUserRow>(`
    SELECT a.id, a.login, p.nickname, a.role, t.token AS launcher_token, c.microsoft_connected, a.last_login_at
    FROM auth_accounts a
    JOIN auth_profiles p ON p.account_id = a.id
    JOIN auth_credentials c ON c.account_id = a.id
    JOIN auth_launcher_tokens t ON t.account_id = a.id
    WHERE a.id = $1
    LIMIT 1
  `, [accountId]);
  return mapPgUser(result.rows[0]);
}

async function startLauncherLinkPostgres(input: LauncherLinkStartInput) {
  await ensurePgSchema();
  const requestId = createRequestId();
  const pollToken = createPollToken();
  const clientName = normalizeClientName(input.clientName);
  const clientPlatform = normalizeClientPlatform(input.clientPlatform);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + linkLifetimeMs).toISOString();
  await pgPool().query(`
    INSERT INTO auth_launcher_link_requests (id, poll_token, client_name, client_platform, status, requested_at, expires_at)
    VALUES ($1,$2,$3,$4,'pending',$5::timestamptz,$6::timestamptz)
  `, [requestId, pollToken, clientName, clientPlatform, now.toISOString(), expiresAt]);
  return mapRequest({
    id: requestId,
    poll_token: pollToken,
    client_name: clientName,
    client_platform: clientPlatform,
    status: "pending",
    expires_at: expiresAt,
    approved_at: null,
  } as LauncherLinkRow)!;
}

async function getLauncherLinkRequestPostgres(requestId: string | undefined) {
  const request = await findPgRequest(requestId);
  return request ? toBrowserState(request) : null;
}

async function approveLauncherLinkPostgres(sessionToken: string | undefined, requestId: string | undefined) {
  await ensurePgSchema();
  const user = await findPgUserBySession(sessionToken);
  if (!user) return { ok: false as const, error: "unauthorized" as const };
  const request = await findPgRequest(requestId);
  if (!request) return { ok: false as const, error: "invalid" as const };
  if (request.status === "expired") return { ok: false as const, error: "expired" as const };
  const approvedAt = new Date().toISOString();
  await pgPool().query(`
    UPDATE auth_launcher_link_requests
    SET status='approved', account_id=$1, approved_at=$2::timestamptz
    WHERE id=$3 AND status='pending'
  `, [user.id, approvedAt, request.requestId]);
  await pgPool().query(`UPDATE auth_accounts SET last_login_at=$1::timestamptz, updated_at=$1::timestamptz WHERE id=$2`, [
    approvedAt,
    user.id,
  ]);
  return {
    ok: true as const,
    request: toBrowserState({
      ...request,
      status: "approved",
      approvedAt,
    }),
  };
}

async function pollLauncherLinkPostgres(requestId: string | undefined, pollToken: string | undefined) {
  await ensurePgSchema();
  const request = await findPgRequest(requestId, pollToken);
  if (!request) return { status: "invalid" as const };
  if (request.status !== "approved") return { status: request.status, request: toBrowserState(request) };
  const accountResult = await pgPool().query<{ account_id: string | null }>(
    `SELECT account_id FROM auth_launcher_link_requests WHERE id=$1 LIMIT 1`,
    [request.requestId],
  );
  const user = await findPgUserByAccountId(accountResult.rows[0]?.account_id ?? undefined);
  if (!user) return { status: "invalid" as const };
  await pgPool().query(`UPDATE auth_launcher_link_requests SET completed_at=NOW() WHERE id=$1`, [request.requestId]);
  return { status: "approved" as const, request: toBrowserState(request), user };
}
