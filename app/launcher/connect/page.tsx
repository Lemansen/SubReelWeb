"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { fetchSession, type AccountUser } from "@/lib/auth-client";

function resolveSafeNextPath(redirectTarget: string) {
  return `/launcher/connect?redirect=${encodeURIComponent(redirectTarget)}`;
}

function LauncherConnectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(
    () => searchParams.get("redirect")?.trim() || "http://localhost:25555/callback",
    [searchParams],
  );
  const clientName = useMemo(() => searchParams.get("clientName")?.trim() || "SubReel Launcher", [searchParams]);
  const clientPlatform = useMemo(() => searchParams.get("clientPlatform")?.trim() || "desktop", [searchParams]);

  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((currentUser) => {
        if (cancelled) {
          return;
        }

        if (!currentUser) {
          router.replace(`/login?next=${encodeURIComponent(resolveSafeNextPath(redirectTarget))}`);
          return;
        }

        setUser(currentUser);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          router.replace(`/login?next=${encodeURIComponent(resolveSafeNextPath(redirectTarget))}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [redirectTarget, router]);

  async function handleApprove() {
    setBusy(true);
    setError(null);

    const response = await fetch("/api/launcher/link/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ redirect: redirectTarget }),
    });

    const result = (await response.json().catch(() => null)) as
      | { ok: true; launchUrl: string }
      | { ok: false; error?: string }
      | null;

    if (!response.ok || !result?.ok) {
      setBusy(false);
      setError("Не удалось передать сессию в лаунчер. Проверь, что callback-сервер уже ждёт ответ.");
      return;
    }

    window.location.href = result.launchUrl;
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Launcher Connect</p>
          <h1 className="mt-4 text-4xl font-black">Подтверждение входа в лаунчер</h1>
          <p className="mt-3 text-sm text-[var(--color-text-gray)]">
            После подтверждения сайт передаст текущий Supabase JWT в локальный callback лаунчера. Пароль в launcher не
            хранится и не передаётся.
          </p>

          <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-[var(--color-border-sharp)] p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Клиент</p>
              <p className="mt-2 text-lg font-bold">{clientName}</p>
              <p className="text-sm text-[var(--color-text-gray)]">{clientPlatform}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Redirect</p>
              <p className="mt-2 break-all text-sm text-[var(--color-text)]">{redirectTarget}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border-sharp)] p-5">
            {loading ? (
              <p className="text-sm text-[var(--color-text-gray)]">Проверяем активную web-сессию...</p>
            ) : user ? (
              <>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Аккаунт</p>
                <p className="mt-2 text-2xl font-black">{user.nickname || user.login}</p>
                <p className="text-sm text-[var(--color-text-gray)]">
                  {user.login} · {user.email}
                </p>
              </>
            ) : null}
          </div>

          {error ? (
            <div className="mt-6 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={loading || busy || !user}
              className="rounded-[1.2rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Передаём..." : "Передать сессию в лаунчер"}
            </button>
            <Link
              href="/dashboard"
              className="rounded-[1.2rem] border border-[var(--color-border-sharp)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]"
            >
              Назад
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LauncherConnectPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--color-bg)]" />}>
      <LauncherConnectPageContent />
    </Suspense>
  );
}
