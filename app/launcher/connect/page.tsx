"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, KeyRound, LoaderCircle, MonitorSmartphone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchSession, type AccountUser } from "@/lib/auth-client";

type RequestState = {
  requestId: string;
  clientName: string;
  clientPlatform: string;
  expiresAt: string;
  status: "pending" | "approved" | "expired";
  approvedAt: string | null;
};

type Lang = "RU" | "EN";

const content = {
  RU: {
    back: "На главную",
    badge: "Launcher Web Auth",
    title: "Подтверждение входа в лаунчер",
    subtitle: "SubReel Launcher открыл эту страницу, чтобы вы вошли через сайт и подтвердили доступ к своему аккаунту.",
    loading: "Проверяем запрос лаунчера...",
    invalid: "Запрос на вход не найден или уже недействителен.",
    expired: "Этот запрос уже истёк. Вернитесь в лаунчер и начните вход заново.",
    loginTitle: "Сначала войдите в аккаунт сайта",
    loginDesc: "После входа вы вернётесь на эту страницу и сможете одним нажатием разрешить вход в лаунчер.",
    loginAction: "Перейти ко входу",
    registerAction: "Создать аккаунт",
    approveTitle: "Разрешить вход",
    approveDesc: "После подтверждения лаунчер автоматически получит ваш профиль и launcher token.",
    approveAction: "Разрешить вход в лаунчер",
    approving: "Подтверждаем доступ...",
    approvedTitle: "Вход подтверждён",
    approvedDesc: "Можно возвращаться в лаунчер. Аккаунт подтянется автоматически через несколько секунд.",
    approvedAction: "Открыть кабинет",
    expires: "Действует до",
    requestFor: "Клиент",
    currentAccount: "Текущий аккаунт",
    hint: "Если окно лаунчера уже открыто, ничего копировать не нужно.",
  },
  EN: {
    back: "Back home",
    badge: "Launcher Web Auth",
    title: "Confirm launcher sign-in",
    subtitle: "SubReel Launcher opened this page so you can sign in through the website and approve access to your account.",
    loading: "Checking launcher request...",
    invalid: "The sign-in request was not found or is no longer valid.",
    expired: "This request has expired. Return to the launcher and start again.",
    loginTitle: "Sign in to your website account first",
    loginDesc: "After sign-in you will return to this page and approve launcher access in one click.",
    loginAction: "Open sign in",
    registerAction: "Create account",
    approveTitle: "Approve sign-in",
    approveDesc: "After confirmation the launcher will automatically receive your profile and launcher token.",
    approveAction: "Approve launcher sign-in",
    approving: "Approving access...",
    approvedTitle: "Sign-in approved",
    approvedDesc: "You can return to the launcher now. The account should appear there automatically in a few seconds.",
    approvedAction: "Open account",
    expires: "Valid until",
    requestFor: "Client",
    currentAccount: "Current account",
    hint: "If the launcher window is already open, there is nothing to copy.",
  },
} as const;

function LauncherConnectPageContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("RU");
  const [sessionUser, setSessionUser] = useState<AccountUser | null>(null);
  const [requestState, setRequestState] = useState<RequestState | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const t = content[lang];

  const requestId = searchParams.get("requestId")?.trim() ?? "";
  const nextPath = useMemo(() => {
    if (!requestId) return "/launcher/connect";
    return `/launcher/connect?requestId=${encodeURIComponent(requestId)}`;
  }, [requestId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const [user, requestResponse] = await Promise.all([
        fetchSession().catch(() => null),
        requestId
          ? fetch(`/api/launcher/link/request?requestId=${encodeURIComponent(requestId)}`, {
              method: "GET",
              cache: "no-store",
              credentials: "include",
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      setSessionUser(user);

      if (!requestId || !requestResponse || !requestResponse.ok) {
        setRequestState(null);
        setLoading(false);
        return;
      }

      const payload = (await requestResponse.json()) as {
        ok: true;
        request: RequestState;
      };

      setRequestState(payload.request);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  async function handleApprove() {
    if (!requestId) return;

    setApproving(true);
    setError("");

    try {
      const response = await fetch("/api/launcher/link/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ requestId }),
      });

      const payload = (await response.json()) as
        | { ok: true; request: RequestState }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        setError(response.status === 410 ? t.expired : t.invalid);
        return;
      }

      setRequestState(payload.request);
    } catch {
      setError(t.invalid);
    } finally {
      setApproving(false);
    }
  }

  const expiresAt = requestState
    ? new Date(requestState.expiresAt).toLocaleString(lang === "RU" ? "ru-RU" : "en-US")
    : "";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <nav className="border-b border-[var(--color-border-sharp)] bg-[var(--color-bg)]/70 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)]">
            <ArrowLeft size={16} />
            {t.back}
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
              {lang}
            </button>
            <ThemeToggle className="rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-2 text-[var(--color-text-gray)] transition-colors hover:text-[var(--color-text)]" />
          </div>
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-20">
        <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,var(--color-card-bg),var(--color-panel-bg))] p-7 md:rounded-[2.75rem] md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)]">
            <KeyRound size={14} />
            {t.badge}
          </div>
          <h1 className="mt-6 text-4xl font-[1000] uppercase italic tracking-tighter leading-[0.92] md:text-6xl">{t.title}</h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-[var(--color-text-gray)] md:text-lg">{t.subtitle}</p>

          <div className="mt-8 grid gap-4">
            <InfoCard icon={<MonitorSmartphone size={18} />} label={t.requestFor} value={requestState?.clientName ?? "SubReel Launcher"} />
            <InfoCard icon={<CheckCircle2 size={18} />} label={t.expires} value={expiresAt || "—"} />
            <InfoCard icon={<ExternalLink size={18} />} label={t.currentAccount} value={sessionUser ? `${sessionUser.nickname} (@${sessionUser.login})` : "SubReel"} />
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-7 md:rounded-[2.75rem] md:p-10">
          {loading ? (
            <StateBox icon={<LoaderCircle size={18} className="animate-spin" />} title={t.loading} text="" />
          ) : !requestState ? (
            <StateBox icon={<KeyRound size={18} />} title={t.invalid} text={error || t.invalid} />
          ) : requestState.status === "expired" ? (
            <StateBox icon={<KeyRound size={18} />} title={t.expired} text={t.hint} />
          ) : !sessionUser ? (
            <div className="grid gap-5">
              <StateBox icon={<KeyRound size={18} />} title={t.loginTitle} text={t.loginDesc} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="inline-flex items-center justify-center rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95">
                  {t.loginAction}
                </Link>
                <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="inline-flex items-center justify-center rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)]">
                  {t.registerAction}
                </Link>
              </div>
            </div>
          ) : requestState.status === "approved" ? (
            <div className="grid gap-5">
              <StateBox icon={<CheckCircle2 size={18} />} title={t.approvedTitle} text={t.approvedDesc} tone="success" />
              <Link href="/account" className="inline-flex items-center justify-center rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95">
                {t.approvedAction}
              </Link>
            </div>
          ) : (
            <div className="grid gap-5">
              <StateBox icon={<MonitorSmartphone size={18} />} title={t.approveTitle} text={t.approveDesc} />
              {error ? <div className="rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</div> : null}
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {approving ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {approving ? t.approving : t.approveAction}
              </button>
              <p className="text-sm font-medium leading-relaxed text-[var(--color-text-gray)]">{t.hint}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function LauncherConnectPage() {
  return (
    <Suspense fallback={null}>
      <LauncherConnectPageContent />
    </Suspense>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)]/80 px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</div>
          <div className="mt-2 text-sm font-bold text-[var(--color-text)] md:text-base">{value}</div>
        </div>
      </div>
    </div>
  );
}

function StateBox({
  icon,
  title,
  text,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  text: string;
  tone?: "default" | "success";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : "border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)]";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${toneClass}`}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]">
          {icon}
        </div>
        <div>
          <div className="text-xl font-black tracking-tight text-[var(--color-text)]">{title}</div>
          {text ? <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--color-text-gray)]">{text}</p> : null}
        </div>
      </div>
    </div>
  );
}
