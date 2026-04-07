"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchSession, loginAccount } from "@/lib/auth-client";

function LoginPageContent() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = (() => {
    const candidate = searchParams.get("next")?.trim();
    return candidate && candidate.startsWith("/") ? candidate : "/account";
  })();

  const t =
    lang === "RU"
      ? {
          back: "Назад",
          title: "Вход в аккаунт",
          desc: "Войди в свой профиль Subreel по логину или почте.",
          identifier: "Логин или почта",
          password: "Пароль",
          submit: "Войти",
          switch: "Нет аккаунта?",
          switchLink: "Регистрация",
          fill: "Заполни все поля.",
          invalid: "Неверный логин или пароль.",
          wiki: "Вики",
        }
      : {
          back: "Back",
          title: "Account Login",
          desc: "Sign in to your Subreel profile using your login or email.",
          identifier: "Login or email",
          password: "Password",
          submit: "Sign in",
          switch: "No account yet?",
          switchLink: "Register",
          fill: "Fill in all fields.",
          invalid: "Invalid login or password.",
          wiki: "Wiki",
        };

  useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((user) => {
        if (user && !cancelled) {
          router.replace(nextPath);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await loginAccount({ identifier, password });
    if (!result.ok) {
      setError(result.error === "fill" ? t.fill : t.invalid);
      setSubmitting(false);
      return;
    }

    router.push(nextPath);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <nav className="border-b border-[var(--color-border-sharp)] bg-[var(--color-bg)]/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 min-h-16 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-blue)] text-sm font-black uppercase text-white shadow-lg shadow-blue-500/20">S</span>
            <span className="truncate text-lg md:text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)]">Subreel</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/wiki" className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
              <BookOpen size={14} />
              {t.wiki}
            </Link>
            <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
              {lang}
            </button>
            <ThemeToggle className="rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-2 text-[var(--color-text-gray)] transition-colors hover:text-[var(--color-text)]" />
          </div>
        </div>
      </nav>

      <main className="px-4 md:px-6 py-12 md:py-24">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-6 md:gap-8 items-stretch">
          <section className="rounded-[2rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,var(--color-card-bg),var(--color-panel-bg))] p-7 md:p-10">
            <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)]">
              <ArrowLeft size={16} />
              {t.back}
            </Link>
            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)]">
              <KeyRound size={14} />
              Subreel Auth
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-[1000] uppercase italic tracking-tighter leading-[0.92]">{t.title}</h1>
            <p className="mt-5 text-base md:text-lg text-[var(--color-text-gray)] leading-relaxed font-medium max-w-xl">{t.desc}</p>
          </section>

          <section className="rounded-[2rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-7 md:p-10">
            <div className="w-14 h-14 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8">
              <KeyRound size={24} />
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Field label={t.identifier} value={identifier} onChange={setIdentifier} />
              <Field label={t.password} type="password" value={password} onChange={setPassword} />
              {error && <div className="rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</div>}
              <button type="submit" disabled={submitting} className="mt-2 inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">
                {submitting ? "..." : t.submit}
              </button>
            </form>
            <div className="mt-6 text-sm text-[var(--color-text-gray)]">
              {t.switch}{" "}
              <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-black uppercase tracking-[0.12em] text-[var(--color-accent-blue)]">
                {t.switchLink}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-13 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent-blue)]"
      />
    </label>
  );
}
