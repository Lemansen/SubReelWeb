"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { fetchSession, loginAccount } from "@/lib/auth-client";

function resolveNext(candidate: string | null) {
  return candidate && candidate.startsWith("/") ? candidate : "/dashboard";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveNext(searchParams.get("next")), [searchParams]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSession().then((user) => {
      if (user) {
        router.replace(nextPath);
      }
    });
  }, [nextPath, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const result = await loginAccount({ identifier, password });

    if (!result.ok) {
      setBusy(false);
      setError(
        result.error === "fill"
          ? "Заполни логин или email и пароль."
          : result.message
            ? `Не удалось войти: ${result.message}`
            : "Не удалось войти. Проверь данные и попробуй ещё раз.",
      );
      return;
    }

    window.location.assign(nextPath);
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Supabase Auth</p>
            <h1 className="mt-4 text-5xl font-black">Вход в SubReel</h1>
            <p className="mt-4 max-w-2xl text-sm text-[var(--color-text-gray)]">
              Один аккаунт для сайта, лаунчера, будущей модерации, чатов и всех community-фич. Если сессия уже есть в
              браузере, мы автоматически пропустим тебя дальше.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Логин или email</span>
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent-blue)]"
                  placeholder="lemansen или mail@example.com"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent-blue)]"
                  placeholder="Введите пароль"
                />
              </label>

              {error ? (
                <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 rounded-[1.2rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Входим..." : "Войти"}
              </button>
            </form>
          </section>

          <aside className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Что дальше</p>
            <div className="mt-5 flex flex-col gap-4 text-sm text-[var(--color-text-gray)]">
              <div className="rounded-[1.2rem] border border-[var(--color-border-sharp)] px-4 py-4">
                После логина сайт хранит Supabase session в браузере и автоматически использует её для dashboard и launcher connect.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--color-border-sharp)] px-4 py-4">
                Лаунчер открывает этот сайт, получает JWT через localhost callback и потом валидирует его через API.
              </div>
            </div>

            <div className="mt-6">
              <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">
                Нет аккаунта? Регистрация →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--color-bg)]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
