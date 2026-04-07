import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

export type LauncherLanguageManifestItem = {
  code: string;
  name: string;
  nativeName: string;
  shortLabel: string;
  accentHex: string;
};

export type LauncherLanguageSummary = LauncherLanguageManifestItem & {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  isSourceLanguage: boolean;
};

export type LauncherLanguageEntry = {
  key: string;
  value: string;
  source: string;
  reference: string;
};

export type LauncherLanguageDetail = {
  language: LauncherLanguageSummary;
  entries: LauncherLanguageEntry[];
};

export type LauncherLanguageStudioMode = "postgres" | "local-filesystem";

type ManifestFile = {
  languages?: unknown;
};

type TranslationFile = {
  translations?: unknown;
};

type LanguageRow = {
  code: string;
  name: string;
  native_name: string;
  short_label: string;
  accent_hex: string;
  translations_json: unknown;
};

const SOURCE_LANGUAGE_CODE = "ru-RU";
const REFERENCE_LANGUAGE_CODE = "en-US";
const languageCodePattern = /^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/;
const accentHexPattern = /^#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const languageStoreGlobal = globalThis as typeof globalThis & {
  __subreelLauncherLanguagePool?: Pool;
  __subreelLauncherLanguageInit?: Promise<void>;
};

function studioRoot() {
  return path.join(process.cwd(), "public", "launcher", "lang");
}

function manifestPath() {
  return path.join(studioRoot(), "languages.json");
}

function normalizeCode(code: string) {
  return code.trim();
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSourceLanguage(code: string) {
  return normalizeCode(code).toLowerCase() === SOURCE_LANGUAGE_CODE.toLowerCase();
}

function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function pool() {
  if (!languageStoreGlobal.__subreelLauncherLanguagePool) {
    languageStoreGlobal.__subreelLauncherLanguagePool = new Pool({
      connectionString: process.env.DATABASE_URL?.trim(),
    });
  }

  return languageStoreGlobal.__subreelLauncherLanguagePool;
}

async function ensureDatabaseReady() {
  if (!isPostgresConfigured()) {
    return;
  }

  if (!languageStoreGlobal.__subreelLauncherLanguageInit) {
    languageStoreGlobal.__subreelLauncherLanguageInit = initDatabase().catch((error) => {
      languageStoreGlobal.__subreelLauncherLanguageInit = undefined;
      throw error;
    });
  }

  await languageStoreGlobal.__subreelLauncherLanguageInit;
}

async function initDatabase() {
  await pool().query(`
    CREATE TABLE IF NOT EXISTS launcher_languages (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT NOT NULL,
      short_label TEXT NOT NULL,
      accent_hex TEXT NOT NULL,
      translations_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool().query(`
    CREATE UNIQUE INDEX IF NOT EXISTS launcher_languages_code_lower_idx
    ON launcher_languages ((LOWER(code)))
  `);

  const countResult = await pool().query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM launcher_languages",
  );
  const count = Number(countResult.rows[0]?.count ?? "0");

  if (count === 0) {
    await seedDatabaseFromFilesystem();
    return;
  }

  await syncMissingLanguagesFromFilesystem();
}

async function seedDatabaseFromFilesystem() {
  const languages = await readManifestFromFilesystem();

  for (const language of languages) {
    const translations = await readTranslationMapFromFilesystem(language.code);
    await upsertLanguageInDatabase(language, translations);
  }
}

async function syncMissingLanguagesFromFilesystem() {
  const languages = await readManifestFromFilesystem();

  for (const language of languages) {
    const exists = await pool().query<{ code: string }>(
      `
        SELECT code
        FROM launcher_languages
        WHERE LOWER(code) = LOWER($1)
        LIMIT 1
      `,
      [language.code],
    );

    if (exists.rowCount) {
      continue;
    }

    const translations = await readTranslationMapFromFilesystem(language.code);
    await pool().query(
      `
        INSERT INTO launcher_languages (
          code,
          name,
          native_name,
          short_label,
          accent_hex,
          translations_json,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
      `,
      [
        language.code,
        language.name,
        language.nativeName,
        language.shortLabel,
        language.accentHex,
        JSON.stringify(translations),
      ],
    );
  }
}

function resolveLanguageFilePath(code: string) {
  const normalized = normalizeCode(code);
  if (!languageCodePattern.test(normalized)) {
    throw new Error("invalid-code");
  }

  return path.join(studioRoot(), `${normalized}.json`);
}

async function ensureStudioRoot() {
  await mkdir(studioRoot(), { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeManifestItem(input: Partial<LauncherLanguageManifestItem> & { code: string }) {
  const code = normalizeCode(input.code);
  if (!languageCodePattern.test(code)) {
    throw new Error("invalid-code");
  }

  const name = text(input.name);
  const nativeName = text(input.nativeName);
  const shortLabel = text(input.shortLabel).toUpperCase();
  const accentHex = text(input.accentHex);

  if (!name || !nativeName || !shortLabel || !accentHex) {
    throw new Error("fill");
  }

  if (!accentHexPattern.test(accentHex)) {
    throw new Error("invalid-accent");
  }

  return {
    code,
    name,
    nativeName,
    shortLabel,
    accentHex,
  } satisfies LauncherLanguageManifestItem;
}

function parseTranslations(source: unknown) {
  let raw = source;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return {} as Record<string, string>;
    }
  }

  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "translations" in raw &&
    (raw as { translations?: unknown }).translations &&
    typeof (raw as { translations?: unknown }).translations === "object"
  ) {
    raw = (raw as { translations: unknown }).translations;
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {} as Record<string, string>;
  }

  const translations: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalizedKey = key.trim();
    const normalizedValue = text(value);

    if (!normalizedKey || !normalizedValue) {
      continue;
    }

    translations[normalizedKey] = normalizedValue;
  }

  return translations;
}

function toManifestItem(row: LanguageRow): LauncherLanguageManifestItem {
  return {
    code: row.code,
    name: row.name,
    nativeName: row.native_name,
    shortLabel: row.short_label,
    accentHex: row.accent_hex,
  };
}

function findLanguageByCode(languages: LauncherLanguageManifestItem[], code: string) {
  const normalized = normalizeCode(code).toLowerCase();
  return languages.find((item) => item.code.toLowerCase() === normalized) ?? null;
}

async function readManifestFromFilesystem() {
  await ensureStudioRoot();
  const raw = await readJsonFile<ManifestFile>(manifestPath(), { languages: [] });
  const list = Array.isArray(raw.languages) ? raw.languages : [];

  const languages: LauncherLanguageManifestItem[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;

    try {
      languages.push(
        normalizeManifestItem({
          code: String((item as { code?: unknown }).code ?? ""),
          name: (item as { name?: unknown }).name as string | undefined,
          nativeName: (item as { nativeName?: unknown }).nativeName as string | undefined,
          shortLabel: (item as { shortLabel?: unknown }).shortLabel as string | undefined,
          accentHex: (item as { accentHex?: unknown }).accentHex as string | undefined,
        }),
      );
    } catch {
      continue;
    }
  }

  return languages;
}

async function writeManifestToFilesystem(languages: LauncherLanguageManifestItem[]) {
  await ensureStudioRoot();
  await writeFile(
    manifestPath(),
    `${JSON.stringify({ languages }, null, 2)}\n`,
    "utf8",
  );
}

async function readTranslationMapFromFilesystem(code: string) {
  if (isSourceLanguage(code)) {
    return {} as Record<string, string>;
  }

  const filePath = resolveLanguageFilePath(code);
  const raw = await readJsonFile<TranslationFile>(filePath, { translations: {} });
  return parseTranslations(raw);
}

async function writeTranslationMapToFilesystem(code: string, translations: Record<string, string>) {
  if (isSourceLanguage(code)) {
    return;
  }

  const filePath = resolveLanguageFilePath(code);
  const orderedEntries = Object.entries(translations)
    .map(([key, value]) => [key.trim(), value] as const)
    .filter(([key]) => key.length > 0)
    .sort(([left], [right]) => left.localeCompare(right, "ru"));

  await ensureStudioRoot();
  await writeFile(
    filePath,
    `${JSON.stringify({ translations: Object.fromEntries(orderedEntries) }, null, 2)}\n`,
    "utf8",
  );
}

async function readManifestFromDatabase() {
  await ensureDatabaseReady();

  const result = await pool().query<LanguageRow>(`
    SELECT code, name, native_name, short_label, accent_hex, translations_json
    FROM launcher_languages
    ORDER BY native_name ASC, code ASC
  `);

  return result.rows.map(toManifestItem);
}

async function readTranslationMapFromDatabase(code: string) {
  if (isSourceLanguage(code)) {
    return {} as Record<string, string>;
  }

  await ensureDatabaseReady();
  const result = await pool().query<Pick<LanguageRow, "translations_json">>(
    `
      SELECT translations_json
      FROM launcher_languages
      WHERE LOWER(code) = LOWER($1)
      LIMIT 1
    `,
    [normalizeCode(code)],
  );

  return parseTranslations(result.rows[0]?.translations_json ?? {});
}

async function upsertLanguageInDatabase(
  language: LauncherLanguageManifestItem,
  translations: Record<string, string>,
) {
  await ensureDatabaseReady();
  await pool().query(
    `
      INSERT INTO launcher_languages (
        code,
        name,
        native_name,
        short_label,
        accent_hex,
        translations_json,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        native_name = EXCLUDED.native_name,
        short_label = EXCLUDED.short_label,
        accent_hex = EXCLUDED.accent_hex,
        translations_json = EXCLUDED.translations_json,
        updated_at = NOW()
    `,
    [
      language.code,
      language.name,
      language.nativeName,
      language.shortLabel,
      language.accentHex,
      JSON.stringify(translations),
    ],
  );
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

async function createLanguageInDatabase(
  language: LauncherLanguageManifestItem,
  translations: Record<string, string>,
) {
  await ensureDatabaseReady();

  const exists = await pool().query<{ code: string }>(
    `
      SELECT code
      FROM launcher_languages
      WHERE LOWER(code) = LOWER($1)
      LIMIT 1
    `,
    [language.code],
  );
  if (exists.rowCount) {
    throw new Error("exists");
  }

  try {
    await pool().query(
      `
        INSERT INTO launcher_languages (
          code,
          name,
          native_name,
          short_label,
          accent_hex,
          translations_json,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
      `,
      [
        language.code,
        language.name,
        language.nativeName,
        language.shortLabel,
        language.accentHex,
        JSON.stringify(translations),
      ],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("exists");
    }

    throw error;
  }
}

async function updateLanguageInDatabase(
  code: string,
  language: LauncherLanguageManifestItem,
  translations: Record<string, string>,
) {
  await ensureDatabaseReady();

  const result = await pool().query<{ code: string }>(
    `
      UPDATE launcher_languages
      SET
        name = $2,
        native_name = $3,
        short_label = $4,
        accent_hex = $5,
        translations_json = $6::jsonb,
        updated_at = NOW()
      WHERE LOWER(code) = LOWER($1)
      RETURNING code
    `,
    [
      normalizeCode(code),
      language.name,
      language.nativeName,
      language.shortLabel,
      language.accentHex,
      JSON.stringify(translations),
    ],
  );

  if (!result.rowCount) {
    throw new Error("not-found");
  }
}

async function readManifest() {
  return getLauncherLanguageStudioMode() === "postgres"
    ? readManifestFromDatabase()
    : readManifestFromFilesystem();
}

async function readTranslationMap(code: string) {
  return getLauncherLanguageStudioMode() === "postgres"
    ? readTranslationMapFromDatabase(code)
    : readTranslationMapFromFilesystem(code);
}

async function createLanguage(
  language: LauncherLanguageManifestItem,
  translations: Record<string, string>,
) {
  if (getLauncherLanguageStudioMode() === "postgres") {
    await createLanguageInDatabase(language, translations);
    return;
  }

  const languages = await readManifestFromFilesystem();
  if (languages.some((item) => item.code.toLowerCase() === language.code.toLowerCase())) {
    throw new Error("exists");
  }

  const nextLanguages = [...languages, language].sort((left, right) =>
    left.nativeName.localeCompare(right.nativeName, "ru"),
  );
  await writeManifestToFilesystem(nextLanguages);
  await writeTranslationMapToFilesystem(language.code, translations);
}

async function updateLanguage(
  code: string,
  language: LauncherLanguageManifestItem,
  translations: Record<string, string>,
) {
  if (getLauncherLanguageStudioMode() === "postgres") {
    await updateLanguageInDatabase(code, language, translations);
    return;
  }

  const languages = await readManifestFromFilesystem();
  const index = languages.findIndex((item) => item.code.toLowerCase() === normalizeCode(code).toLowerCase());
  if (index === -1) {
    throw new Error("not-found");
  }

  const nextLanguages = [...languages];
  nextLanguages[index] = language;
  await writeManifestToFilesystem(nextLanguages);
  await writeTranslationMapToFilesystem(language.code, translations);
}

async function readBaseKeys() {
  const english = await readTranslationMap(REFERENCE_LANGUAGE_CODE);
  return Object.keys(english).sort((left, right) => left.localeCompare(right, "ru"));
}

function countTranslatedKeys(code: string, keys: string[], translations: Record<string, string>) {
  if (isSourceLanguage(code)) {
    return keys.length;
  }

  return keys.reduce((count, key) => count + (translations[key]?.trim() ? 1 : 0), 0);
}

function toSummary(
  language: LauncherLanguageManifestItem,
  keys: string[],
  translations: Record<string, string>,
): LauncherLanguageSummary {
  const translatedKeys = countTranslatedKeys(language.code, keys, translations);
  return {
    ...language,
    totalKeys: keys.length,
    translatedKeys,
    missingKeys: Math.max(0, keys.length - translatedKeys),
    isSourceLanguage: isSourceLanguage(language.code),
  };
}

export function getLauncherLanguageStudioMode(): LauncherLanguageStudioMode {
  return isPostgresConfigured() ? "postgres" : "local-filesystem";
}

export function isLauncherLanguageStudioEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    isPostgresConfigured() ||
    process.env.SUBREEL_ENABLE_LAUNCHER_LANG_STUDIO === "1"
  );
}

export async function listLauncherLanguages(): Promise<LauncherLanguageSummary[]> {
  const languages = await readManifest();
  const keys = await readBaseKeys();

  return Promise.all(
    languages.map(async (language) => {
      const translations = await readTranslationMap(language.code);
      return toSummary(language, keys, translations);
    }),
  );
}

export async function getLauncherLanguageDetail(code: string): Promise<LauncherLanguageDetail | null> {
  const languages = await readManifest();
  const language = findLanguageByCode(languages, code);
  if (!language) {
    return null;
  }

  const keys = await readBaseKeys();
  const referenceTranslations = await readTranslationMap(REFERENCE_LANGUAGE_CODE);
  const currentTranslations = await readTranslationMap(language.code);
  const summary = toSummary(language, keys, currentTranslations);

  const entries = keys.map((key) => ({
    key,
    value: summary.isSourceLanguage ? key : currentTranslations[key] ?? "",
    source: key,
    reference: referenceTranslations[key] ?? "",
  }));

  return {
    language: summary,
    entries,
  };
}

export async function createLauncherLanguage(input: Partial<LauncherLanguageManifestItem> & { code: string }) {
  const nextLanguage = normalizeManifestItem(input);
  await createLanguage(nextLanguage, {});
  return nextLanguage;
}

export async function saveLauncherLanguage(
  code: string,
  input: {
    name: string;
    nativeName: string;
    shortLabel: string;
    accentHex: string;
    translations: Record<string, string>;
  },
) {
  const normalizedCode = normalizeCode(code);
  const nextLanguage = normalizeManifestItem({
    code: normalizedCode,
    name: input.name,
    nativeName: input.nativeName,
    shortLabel: input.shortLabel,
    accentHex: input.accentHex,
  });

  const keys = await readBaseKeys();
  const nextTranslations: Record<string, string> = {};
  for (const key of keys) {
    const value = input.translations[key];
    if (typeof value !== "string") continue;
    const normalizedValue = value.trim();
    if (!normalizedValue) continue;
    nextTranslations[key] = normalizedValue;
  }

  await updateLanguage(normalizedCode, nextLanguage, nextTranslations);

  const detail = await getLauncherLanguageDetail(nextLanguage.code);
  if (!detail) {
    throw new Error("not-found");
  }

  return detail;
}

export async function getLauncherLanguageManifestPayload() {
  const languages = await readManifest();
  return { languages };
}

export async function getLauncherLanguageTranslationPayload(code: string) {
  const languages = await readManifest();
  const language = findLanguageByCode(languages, code);
  if (!language) {
    return null;
  }

  const translations = await readTranslationMap(language.code);
  return {
    translations,
  };
}
