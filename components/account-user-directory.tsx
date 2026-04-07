"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Clock3, Database, RefreshCw, ShieldCheck, UserRound } from "lucide-react";

type Lang = "RU" | "EN";

type DirectoryUser = {
  id: string;
  login: string;
  nickname: string;
  role: "player";
  createdAt: string;
  lastLoginAt: string;
  microsoftConnected: boolean;
  isCurrentUser: boolean;
};

type DirectorySuccessResult = {
  ok: true;
  total: number;
  users: DirectoryUser[];
};

type DirectoryErrorResult = {
  ok: false;
  error: "disabled" | "unauthorized";
};

const content = {
  RU: {
    badge: "Локальная база",
    title: "Пользователи SQLite",
    desc: "Список читается прямо из локальной базы в папке SubReelSql. Пароли, сессии и launcher token других пользователей здесь не показываются.",
    refresh: "Обновить",
    total: "Пользователей",
    scope: "Режим",
    scope_value: "Локальный просмотр",
    visible: "Доступ",
    visible_value: "Только после входа",
    loading: "Загружаем список пользователей из локальной базы...",
    empty: "Пока в базе нет пользователей.",
    current: "Это вы",
    connected: "Профиль подключён",
    not_connected: "Без внешней связи",
    role: "Роль",
    role_player: "Игрок",
    created: "Создан",
    last_login: "Последний вход",
    unavailable:
      "Просмотр списка отключён для production. Если понадобится, можно включить его через SUBREEL_ENABLE_USER_DIRECTORY=1.",
    unauthorized: "Сессия истекла. Перезайдите в аккаунт, чтобы снова увидеть список.",
    error: "Не удалось загрузить пользователей из локальной базы.",
  },
  EN: {
    badge: "Local database",
    title: "SQLite users",
    desc: "This list is read directly from the local database inside SubReelSql. Passwords, sessions, and other users' launcher tokens are not shown here.",
    refresh: "Refresh",
    total: "Users",
    scope: "Mode",
    scope_value: "Local directory",
    visible: "Access",
    visible_value: "Signed-in only",
    loading: "Loading users from the local database...",
    empty: "There are no users in the database yet.",
    current: "You",
    connected: "Profile linked",
    not_connected: "No external link",
    role: "Role",
    role_player: "Player",
    created: "Created",
    last_login: "Last login",
    unavailable:
      "The user directory is disabled in production. If needed, enable it with SUBREEL_ENABLE_USER_DIRECTORY=1.",
    unauthorized: "Your session expired. Sign in again to view the directory.",
    error: "Failed to load users from the local database.",
  },
} as const;

function formatDate(value: string, lang: Lang) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(lang === "RU" ? "ru-RU" : "en-US");
}

export function AccountUserDirectory({ lang }: { lang: Lang }) {
  const t = content[lang];
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [state, setState] = useState<"ready" | "disabled" | "unauthorized" | "error">("ready");

  async function loadUsers(mode: "initial" | "refresh") {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/account/users", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = (await response.json()) as DirectorySuccessResult | DirectoryErrorResult;

      if (!response.ok || !result.ok) {
        setUsers([]);
        setState(result.ok ? "error" : result.error);
        return;
      }

      setUsers(result.users);
      setState("ready");
    } catch {
      setUsers([]);
      setState("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadUsers("initial");
  }, []);

  const statusText =
    state === "disabled"
      ? t.unavailable
      : state === "unauthorized"
        ? t.unauthorized
        : state === "error"
          ? t.error
          : null;

  return (
    <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),var(--color-panel-bg)] p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)]">
            <Database size={12} />
            {t.badge}
          </span>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">{t.title}</h3>
            <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-gray)]">{t.desc}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers("refresh")}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {t.refresh}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DirectoryStat icon={<UserRound size={16} />} label={t.total} value={String(users.length)} />
        <DirectoryStat icon={<ShieldCheck size={16} />} label={t.scope} value={t.scope_value} />
        <DirectoryStat icon={<Clock3 size={16} />} label={t.visible} value={t.visible_value} />
      </div>

      {loading ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-6 text-sm leading-7 text-[var(--color-text-gray)]">
          {t.loading}
        </div>
      ) : statusText ? (
        <div className="mt-6 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-5 py-6 text-sm leading-7 text-amber-100">
          {statusText}
        </div>
      ) : users.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-6 text-sm leading-7 text-[var(--color-text-gray)]">
          {t.empty}
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-4 md:p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-lg font-black tracking-tight text-[var(--color-text)]">
                      {user.nickname}
                    </h4>
                    {user.isCurrentUser ? (
                      <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">
                        {t.current}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                      {user.microsoftConnected ? t.connected : t.not_connected}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-text-gray)]">@{user.login}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                    ID #{user.id.slice(0, 8)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
                  <DirectoryMeta label={t.role} value={user.role === "player" ? t.role_player : user.role} />
                  <DirectoryMeta label={t.created} value={formatDate(user.createdAt, lang)} />
                  <DirectoryMeta label={t.last_login} value={formatDate(user.lastLoginAt, lang)} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DirectoryStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

function DirectoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
