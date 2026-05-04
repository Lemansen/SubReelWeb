"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { fetchSession, registerAccount } from "@/lib/auth-client";

function resolveNext(candidate: string | null) {
  return candidate && candidate.startsWith("/") ? candidate : "/dashboard";
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => resolveNext(searchParams.get("next")), [searchParams]);

  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);

    const result = await registerAccount({
      login,
      email,
      nickname,
      password,
    });

    if (!result.ok) {
      setBusy(false);
      setError(
        result.error === "fill"
          ? "Заполни все поля."
          : result.error === "password"
            ? "Пароль должен быть не короче 6 символов."
            : result.error === "exists"
              ? result.reason === "login"
                ? "Такой логин уже существует."
                : result.reason === "email"
                  ? "Эта почта уже используется."
                  : result.reason === "login_and_email"
                    ? "И логин, и почта уже заняты."
                    : result.message
                      ? `Такой аккаунт уже существует: ${result.message}`
                      : "Такой логин или email уже занят. Если это твой аккаунт, просто войди."
              : result.message
                ? `Регистрация не удалась: ${result.message}`
                : "Регистрация не удалась. Попробуй ещё раз.",
      );
      return;
    }

    if (result.pendingVerification) {
      setBusy(false);
      setSuccess("Аккаунт создан. Проверь почту и подтверди email, если Supabase требует подтверждение.");
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
            <h1 className="mt-4 text-5xl font-black">Создать аккаунт SubReel</h1>
            <p className="mt-4 max-w-2xl text-sm text-[var(--color-text-gray)]">
              Этот аккаунт станет общей идентичностью для сайта, лаунчера, баг-репортов, идей и будущей moderation/admin панели.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Логин</span>
                <input
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent-blue)]"
                  placeholder="lemansen"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Никнейм</span>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent-blue)]"
                  placeholder="Lemansen"
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent-blue)]"
                  placeholder="mail@example.com"
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Пароль</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4 text-sm outline-none transition focus:border-[var(--color-accent-blue)]"
                  placeholder="Не короче 6 символов"
                />
              </label>

              {error ? (
                <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">{error}</div>
              ) : null}

              {success ? (
                <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">{success}</div>
              ) : null}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 rounded-[1.2rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Создаём..." : "Создать аккаунт"}
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Архитектура</p>
            <div className="mt-5 flex flex-col gap-4 text-sm text-[var(--color-text-gray)]">
              <div className="rounded-[1.2rem] border border-[var(--color-border-sharp)] px-4 py-4">
                Профиль пользователя хранится в Supabase Auth + user_profiles, чтобы сайт и лаунчер говорили на одном API.
              </div>
              <div className="rounded-[1.2rem] border border-[var(--color-border-sharp)] px-4 py-4">
                Позже на этой базе можно без переделки достроить друзей, чат, рейтинг, баги, идеи и moderation dashboard.
              </div>
            </div>

            <div className="mt-6">
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">
                Уже есть аккаунт? Войти →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--color-bg)]" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
