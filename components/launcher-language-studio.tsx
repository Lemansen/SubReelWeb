"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Globe2, Languages, Plus, RefreshCw, Save, Search, SlidersHorizontal } from "lucide-react";

type Lang = "RU" | "EN";

type LanguageSummary = {
  code: string;
  name: string;
  nativeName: string;
  shortLabel: string;
  accentHex: string;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  isSourceLanguage: boolean;
};

type LanguageEntry = {
  key: string;
  value: string;
  source: string;
  reference: string;
};

type ListResult =
  | {
      ok: true;
      mode: "local-filesystem" | "postgres";
      languages: LanguageSummary[];
    }
  | {
      ok: false;
      error: "disabled" | "unauthorized";
    };

type DetailResult =
  | {
      ok: true;
      language: LanguageSummary;
      entries: LanguageEntry[];
    }
  | {
      ok: false;
      error: "disabled" | "unauthorized" | "not-found";
    };

const legacyContent = {
  RU: {
    badge: "Launcher Lang Studio",
    title: "Управление языками лаунчера",
    desc:
      "Теперь переводы можно вести прямо через сайт: список языков, метаданные и содержимое JSON-файлов лежат в одном месте.",
    refresh: "Обновить",
    mode: "Режим",
    modeValue: "Локальные JSON-файлы",
    totalLanguages: "Языков",
    translated: "Заполнено",
    disabled:
      "Редактор переводов отключён в production. Для включения на сервере используйте SUBREEL_ENABLE_LAUNCHER_LANG_STUDIO=1.",
    unauthorized: "Сессия истекла. Перезайдите в кабинет, чтобы редактировать переводы.",
    error: "Не удалось загрузить языки лаунчера.",
    loading: "Загружаем список языков и содержимое переводов...",
    listTitle: "Список языков",
    listDesc: "Выберите язык слева, чтобы открыть его JSON и отредактировать переводы.",
    newTitle: "Новый язык",
    newDesc: "Добавляй язык без перекомпиляции лаунчера: код, название, короткую метку и акцент.",
    code: "Код",
    name: "Название",
    nativeName: "Нативное имя",
    shortLabel: "Короткая метка",
    accentHex: "Accent HEX",
    create: "Создать язык",
    createOk: "Новый язык создан.",
    createFail: "Не удалось создать язык.",
    exists: "Такой код языка уже существует.",
    fill: "Заполните код, названия, метку и цвет.",
    invalid: "Код языка или accent HEX указаны неверно.",
    editorTitle: "Редактор перевода",
    editorDesc:
      "Ключи остаются русскими исходниками, а справа хранится перевод для выбранного языка. Сохраняется сразу в public/launcher/lang.",
    sourceLanguage: "Базовый язык",
    sourceDesc: "Для русского языка отдельный JSON не нужен: текст берётся прямо из ключей.",
    save: "Сохранить язык",
    saveOk: "Язык сохранён.",
    saveFail: "Не удалось сохранить язык.",
    search: "Поиск по ключам и переводу",
    totalKeys: "Всего ключей",
    missingKeys: "Пустых",
    translation: "Перевод",
    source: "Исходник",
    reference: "English preview",
    emptySearch: "По текущему поиску ничего не найдено.",
    selectPrompt: "Выберите язык слева, чтобы открыть редактор.",
    completion: "Готовность",
  },
  EN: {
    badge: "Launcher Lang Studio",
    title: "Launcher language management",
    desc:
      "Translations can now be managed directly through the website: the language list, metadata, and JSON contents live in one place.",
    refresh: "Refresh",
    mode: "Mode",
    modeValue: "Local JSON files",
    totalLanguages: "Languages",
    translated: "Translated",
    disabled:
      "The translation editor is disabled in production. Use SUBREEL_ENABLE_LAUNCHER_LANG_STUDIO=1 to enable it on the server.",
    unauthorized: "Your session expired. Sign in again to edit translations.",
    error: "Failed to load launcher languages.",
    loading: "Loading the language list and translation contents...",
    listTitle: "Language list",
    listDesc: "Pick a language on the left to open its JSON file and edit translations.",
    newTitle: "New language",
    newDesc: "Add a language without rebuilding the launcher: code, title, short label, and accent.",
    code: "Code",
    name: "Name",
    nativeName: "Native name",
    shortLabel: "Short label",
    accentHex: "Accent HEX",
    create: "Create language",
    createOk: "The new language was created.",
    createFail: "Failed to create the language.",
    exists: "A language with this code already exists.",
    fill: "Fill in the code, titles, label, and color.",
    invalid: "The language code or accent HEX is invalid.",
    editorTitle: "Translation editor",
    editorDesc:
      "Keys stay as Russian source strings, while the right side stores the translation for the selected language. Saving writes directly into public/launcher/lang.",
    sourceLanguage: "Source language",
    sourceDesc: "Russian does not need a separate JSON file: the launcher reads text directly from the keys.",
    save: "Save language",
    saveOk: "Language saved.",
    saveFail: "Failed to save the language.",
    search: "Search by keys and translations",
    totalKeys: "Total keys",
    missingKeys: "Missing",
    translation: "Translation",
    source: "Source",
    reference: "English preview",
    emptySearch: "Nothing matches the current search.",
    selectPrompt: "Choose a language on the left to open the editor.",
    completion: "Completion",
  },
} as const;

const content = {
  RU: {
    badge: "Launcher Lang Studio",
    title: "Управление языками лаунчера",
    desc:
      "Переводы теперь можно вести прямо через сайт: список языков, метаданные и содержимое JSON собраны в одном месте, а на Vercel всё хранится в серверной базе.",
    refresh: "Обновить",
    mode: "Хранилище",
    modeValueFiles: "Локальные JSON-файлы",
    modeValuePostgres: "PostgreSQL / Vercel",
    totalLanguages: "Языков",
    translated: "Заполнено",
    disabled:
      "Редактор переводов сейчас недоступен. В production он включается автоматически, когда у сайта настроен DATABASE_URL.",
    unauthorized: "Сессия истекла. Перезайдите в кабинет, чтобы редактировать переводы.",
    error: "Не удалось загрузить языки лаунчера.",
    loading: "Загружаем список языков и переводы...",
    listTitle: "Список языков",
    listDesc: "Выберите язык слева, чтобы открыть перевод и отредактировать строки.",
    newTitle: "Новый язык",
    newDesc: "Добавляйте язык без перекомпиляции лаунчера: код, название, короткая метка и акцент.",
    code: "Код",
    name: "Название",
    nativeName: "Нативное имя",
    shortLabel: "Короткая метка",
    accentHex: "Accent HEX",
    create: "Создать язык",
    createOk: "Новый язык создан.",
    createFail: "Не удалось создать язык.",
    exists: "Язык с таким кодом уже существует.",
    fill: "Заполните код, названия, метку и цвет.",
    invalid: "Код языка или accent HEX заполнены неверно.",
    editorTitle: "Редактор перевода",
    editorDesc:
      "Ключи остаются русским источником, а справа хранится перевод выбранного языка. На Vercel данные живут в базе, но лаунчер всё равно получает привычные JSON по тем же ссылкам.",
    sourceLanguage: "Базовый язык",
    sourceDesc: "Для русского отдельный JSON не нужен: лаунчер читает текст прямо из ключей.",
    save: "Сохранить язык",
    saveOk: "Язык сохранён.",
    saveFail: "Не удалось сохранить язык.",
    search: "Поиск по ключам и переводу",
    totalKeys: "Всего ключей",
    missingKeys: "Пустых",
    translation: "Перевод",
    source: "Исходник",
    reference: "English preview",
    emptySearch: "По текущему запросу ничего не найдено.",
    selectPrompt: "Выберите язык слева, чтобы открыть редактор.",
    completion: "Готовность",
  },
  EN: {
    badge: "Launcher Lang Studio",
    title: "Launcher language management",
    desc:
      "Translations can now be managed directly through the website: the language list, metadata, and JSON contents live in one place, while Vercel stores everything in a real server-side database.",
    refresh: "Refresh",
    mode: "Storage",
    modeValueFiles: "Local JSON files",
    modeValuePostgres: "PostgreSQL / Vercel",
    totalLanguages: "Languages",
    translated: "Translated",
    disabled:
      "The translation editor is currently disabled. In production it becomes available automatically when DATABASE_URL is configured.",
    unauthorized: "Your session expired. Sign in again to edit translations.",
    error: "Failed to load launcher languages.",
    loading: "Loading the language list and translation contents...",
    listTitle: "Language list",
    listDesc: "Pick a language on the left to open its translation set and edit texts.",
    newTitle: "New language",
    newDesc: "Add a language without rebuilding the launcher: code, title, short label, and accent.",
    code: "Code",
    name: "Name",
    nativeName: "Native name",
    shortLabel: "Short label",
    accentHex: "Accent HEX",
    create: "Create language",
    createOk: "The new language was created.",
    createFail: "Failed to create the language.",
    exists: "A language with this code already exists.",
    fill: "Fill in the code, titles, label, and color.",
    invalid: "The language code or accent HEX is invalid.",
    editorTitle: "Translation editor",
    editorDesc:
      "Keys stay as Russian source strings, while the right side stores the translation for the selected language. On Vercel the data lives in the database, but the launcher still reads JSON from the same public URLs.",
    sourceLanguage: "Source language",
    sourceDesc: "Russian does not need a separate JSON file: the launcher reads text directly from the keys.",
    save: "Save language",
    saveOk: "Language saved.",
    saveFail: "Failed to save the language.",
    search: "Search by keys and translations",
    totalKeys: "Total keys",
    missingKeys: "Missing",
    translation: "Translation",
    source: "Source",
    reference: "English preview",
    emptySearch: "Nothing matches the current search.",
    selectPrompt: "Choose a language on the left to open the editor.",
    completion: "Completion",
  },
} as const;

function statPercent(language: LanguageSummary | null) {
  if (!language || language.totalKeys === 0) {
    return 0;
  }

  return Math.round((language.translatedKeys / language.totalKeys) * 100);
}

export function LauncherLanguageStudio({ lang }: { lang: Lang }) {
  const t = content[lang];
  const [languages, setLanguages] = useState<LanguageSummary[]>([]);
  const [storageMode, setStorageMode] = useState<"local-filesystem" | "postgres">("local-filesystem");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ language: LanguageSummary; entries: LanguageEntry[] } | null>(null);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [state, setState] = useState<"ready" | "disabled" | "unauthorized" | "error">("ready");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [languageForm, setLanguageForm] = useState({
    code: "",
    name: "",
    nativeName: "",
    shortLabel: "",
    accentHex: "#3374FF",
  });
  const [translationDraft, setTranslationDraft] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({
    code: "",
    name: "",
    nativeName: "",
    shortLabel: "",
    accentHex: "#3374FF",
  });

  async function loadLanguages(mode: "initial" | "refresh") {
    if (mode === "initial") {
      setLoadingList(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/account/launcher-languages", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const result = (await response.json()) as ListResult;

      if (!response.ok || !result.ok) {
        setLanguages([]);
        setState(result.ok ? "error" : result.error);
        return;
      }

      setStorageMode(result.mode);
      setLanguages(result.languages);
      setState("ready");

      setSelectedCode((current) => {
        if (current && result.languages.some((item) => item.code === current)) {
          return current;
        }

        return result.languages[0]?.code ?? null;
      });
    } catch {
      setLanguages([]);
      setState("error");
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }

  async function loadDetail(code: string) {
    setLoadingDetail(true);

    try {
      const response = await fetch(`/api/account/launcher-languages/${encodeURIComponent(code)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const result = (await response.json()) as DetailResult;

      if (!response.ok || !result.ok) {
        if (!result.ok) {
          setState(result.error === "not-found" ? "error" : result.error);
        }
        setDetail(null);
        return;
      }

      setDetail({ language: result.language, entries: result.entries });
      setLanguageForm({
        code: result.language.code,
        name: result.language.name,
        nativeName: result.language.nativeName,
        shortLabel: result.language.shortLabel,
        accentHex: result.language.accentHex,
      });
      setTranslationDraft(
        Object.fromEntries(result.entries.map((entry) => [entry.key, entry.value])),
      );
      setState("ready");
    } catch {
      setDetail(null);
      setState("error");
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    void loadLanguages("initial");
  }, []);

  useEffect(() => {
    if (!selectedCode || state !== "ready") {
      return;
    }

    void loadDetail(selectedCode);
  }, [selectedCode, state]);

  const filteredEntries = useMemo(() => {
    if (!detail) {
      return [];
    }

    const needle = search.trim().toLowerCase();
    if (!needle) {
      return detail.entries;
    }

    return detail.entries.filter((entry) => {
      const value = translationDraft[entry.key] ?? entry.value;
      return (
        entry.key.toLowerCase().includes(needle) ||
        entry.reference.toLowerCase().includes(needle) ||
        value.toLowerCase().includes(needle)
      );
    });
  }, [detail, search, translationDraft]);

  async function handleCreateLanguage() {
    setCreating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/launcher-languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createForm),
      });

      const result = (await response.json()) as
        | { ok: true; language: LanguageSummary }
        | { ok: false; error: string };

      if (!response.ok || !result.ok) {
        const error = result.ok ? "invalid" : result.error;
        const text =
          error === "exists"
            ? t.exists
            : error === "fill"
              ? t.fill
              : error === "invalid-code" || error === "invalid-accent"
                ? t.invalid
                : t.createFail;
        setMessage({ type: "error", text });
        return;
      }

      setCreateForm({
        code: "",
        name: "",
        nativeName: "",
        shortLabel: "",
        accentHex: "#3374FF",
      });
      setMessage({ type: "success", text: t.createOk });
      await loadLanguages("refresh");
      setSelectedCode(result.language.code);
    } catch {
      setMessage({ type: "error", text: t.createFail });
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveLanguage() {
    if (!detail) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/account/launcher-languages/${encodeURIComponent(detail.language.code)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: languageForm.name,
          nativeName: languageForm.nativeName,
          shortLabel: languageForm.shortLabel,
          accentHex: languageForm.accentHex,
          translations: translationDraft,
        }),
      });

      const result = (await response.json()) as
        | { ok: true; language: LanguageSummary; entries: LanguageEntry[] }
        | { ok: false; error: string };

      if (!response.ok || !result.ok) {
        const error = result.ok ? "invalid" : result.error;
        const text =
          error === "fill"
            ? t.fill
            : error === "invalid-code" || error === "invalid-accent"
              ? t.invalid
              : t.saveFail;
        setMessage({ type: "error", text });
        return;
      }

      setDetail({ language: result.language, entries: result.entries });
      setTranslationDraft(Object.fromEntries(result.entries.map((entry) => [entry.key, entry.value])));
      setLanguages((current) =>
        current.map((language) => (language.code === result.language.code ? result.language : language)),
      );
      setMessage({ type: "success", text: t.saveOk });
    } catch {
      setMessage({ type: "error", text: t.saveFail });
    } finally {
      setSaving(false);
    }
  }

  const selectedLanguage = detail?.language ?? null;
  const statusText =
    state === "disabled"
      ? t.disabled
      : state === "unauthorized"
        ? t.unauthorized
        : state === "error"
          ? t.error
          : null;

  return (
    <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),var(--color-panel-bg)] p-6 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)]">
            <Languages size={12} />
            {t.badge}
          </span>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">{t.title}</h3>
            <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-gray)]">{t.desc}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadLanguages("refresh")}
          disabled={loadingList || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {t.refresh}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StudioStat icon={<Languages size={16} />} label={t.totalLanguages} value={String(languages.length)} />
        <StudioStat
          icon={<Globe2 size={16} />}
          label={t.mode}
          value={storageMode === "postgres" ? t.modeValuePostgres : t.modeValueFiles}
        />
        <StudioStat
          icon={<SlidersHorizontal size={16} />}
          label={t.translated}
          value={selectedLanguage ? `${statPercent(selectedLanguage)}%` : "0%"}
        />
      </div>

      {message ? (
        <div
          className={`mt-6 rounded-[1.5rem] border px-5 py-4 text-sm leading-7 ${
            message.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {loadingList ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-6 text-sm leading-7 text-[var(--color-text-gray)]">
          {t.loading}
        </div>
      ) : statusText ? (
        <div className="mt-6 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-5 py-6 text-sm leading-7 text-amber-100">
          {statusText}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5">
              <div className="space-y-2">
                <h4 className="text-lg font-black tracking-tight text-[var(--color-text)]">{t.listTitle}</h4>
                <p className="text-sm leading-6 text-[var(--color-text-gray)]">{t.listDesc}</p>
              </div>

              <div className="mt-5 space-y-3">
                {languages.map((language) => {
                  const selected = selectedCode === language.code;
                  const percent = statPercent(language);

                  return (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => setSelectedCode(language.code)}
                      className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition-colors ${
                        selected
                          ? "border-[var(--color-accent-blue)] bg-[var(--color-panel-hover)]"
                          : "border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] hover:bg-[var(--color-panel-hover)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-black uppercase text-white"
                              style={{ backgroundColor: language.accentHex }}
                            >
                              {language.shortLabel}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black tracking-tight text-[var(--color-text)]">
                                {language.nativeName}
                              </p>
                              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
                                {language.code}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full border border-[var(--color-border-sharp)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
                          {percent}%
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-panel-bg)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: language.accentHex }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5">
              <div className="space-y-2">
                <h4 className="text-lg font-black tracking-tight text-[var(--color-text)]">{t.newTitle}</h4>
                <p className="text-sm leading-6 text-[var(--color-text-gray)]">{t.newDesc}</p>
              </div>

              <div className="mt-5 grid gap-3">
                <StudioInput label={t.code} value={createForm.code} onChange={(value) => setCreateForm((current) => ({ ...current, code: value }))} placeholder="uk-UA" />
                <StudioInput label={t.name} value={createForm.name} onChange={(value) => setCreateForm((current) => ({ ...current, name: value }))} placeholder="Ukrainian" />
                <StudioInput label={t.nativeName} value={createForm.nativeName} onChange={(value) => setCreateForm((current) => ({ ...current, nativeName: value }))} placeholder="Українська" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <StudioInput label={t.shortLabel} value={createForm.shortLabel} onChange={(value) => setCreateForm((current) => ({ ...current, shortLabel: value }))} placeholder="UK" />
                  <StudioInput label={t.accentHex} value={createForm.accentHex} onChange={(value) => setCreateForm((current) => ({ ...current, accentHex: value }))} placeholder="#355EAF" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleCreateLanguage()}
                disabled={creating}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {t.create}
              </button>
            </section>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5 md:p-6">
            {!detail || loadingDetail ? (
              <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-8 text-sm leading-7 text-[var(--color-text-gray)]">
                {loadingDetail ? t.loading : t.selectPrompt}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <h4 className="text-xl font-black tracking-tight text-[var(--color-text)]">{t.editorTitle}</h4>
                    <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-gray)]">{t.editorDesc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSaveLanguage()}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    {t.save}
                  </button>
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                  <StudioInput label={t.code} value={languageForm.code} onChange={() => undefined} disabled />
                  <StudioInput label={t.name} value={languageForm.name} onChange={(value) => setLanguageForm((current) => ({ ...current, name: value }))} />
                  <StudioInput label={t.nativeName} value={languageForm.nativeName} onChange={(value) => setLanguageForm((current) => ({ ...current, nativeName: value }))} />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                    <StudioInput label={t.shortLabel} value={languageForm.shortLabel} onChange={(value) => setLanguageForm((current) => ({ ...current, shortLabel: value }))} />
                    <StudioInput label={t.accentHex} value={languageForm.accentHex} onChange={(value) => setLanguageForm((current) => ({ ...current, accentHex: value }))} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <StudioMini label={t.totalKeys} value={String(detail.language.totalKeys)} />
                  <StudioMini label={t.missingKeys} value={String(detail.language.missingKeys)} />
                  <StudioMini label={t.completion} value={`${statPercent(detail.language)}%`} />
                </div>

                {detail.language.isSourceLanguage ? (
                  <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm leading-7 text-emerald-200">
                    <p className="font-black uppercase tracking-[0.16em]">{t.sourceLanguage}</p>
                    <p className="mt-2">{t.sourceDesc}</p>
                  </div>
                ) : null}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-gray)]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t.search}
                    className="w-full rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-gray)] focus:border-[var(--color-accent-blue)]"
                  />
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-6 text-sm leading-7 text-[var(--color-text-gray)]">
                    {t.emptySearch}
                  </div>
                ) : (
                  <div className="max-h-[60rem] space-y-3 overflow-y-auto pr-2">
                    {filteredEntries.map((entry) => {
                      const value = translationDraft[entry.key] ?? entry.value;

                      return (
                        <article
                          key={entry.key}
                          className="rounded-[1.35rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4"
                        >
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                                  {t.source}
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                                  {entry.source}
                                </p>
                              </div>
                              {entry.reference && !detail.language.isSourceLanguage ? (
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                                    {t.reference}
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-gray)]">
                                    {entry.reference}
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                                {t.translation}
                              </p>
                              <textarea
                                value={detail.language.isSourceLanguage ? entry.source : value}
                                onChange={(event) =>
                                  setTranslationDraft((current) => ({
                                    ...current,
                                    [entry.key]: event.target.value,
                                  }))
                                }
                                readOnly={detail.language.isSourceLanguage}
                                rows={entry.source.length > 110 ? 5 : 3}
                                className="min-h-[5.5rem] w-full resize-y rounded-[1.1rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-gray)] focus:border-[var(--color-accent-blue)] read-only:cursor-default read-only:bg-[var(--color-panel-hover)]"
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StudioStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-4">
      <div className="inline-flex rounded-2xl bg-[var(--color-accent-blue)]/10 p-2 text-[var(--color-accent-blue)]">
        {icon}
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</p>
      <p className="mt-2 text-lg font-black tracking-tight text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function StudioMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</p>
      <p className="mt-2 text-lg font-black tracking-tight text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function StudioInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-[1.1rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-gray)] focus:border-[var(--color-accent-blue)] disabled:cursor-not-allowed disabled:opacity-70"
      />
    </label>
  );
}
