"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  KeyRound,
  LoaderCircle,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Lang = "RU" | "EN";

type LauncherSuccess = {
  ok: true;
  launcher: {
    token: string;
    user: {
      id: string;
      login: string;
      nickname: string;
      role: string;
      microsoftConnected: boolean;
      lastLoginAt: string;
    };
  };
};

type LauncherFailure = {
  ok: false;
  error: string;
};

const content = {
  RU: {
    back: "Назад",
    nav_wiki: "Вики",
    title: "Экран входа лаунчера",
    subtitle:
      "Это уже не просто концепт. Здесь можно проверить будущий flow лаунчера через реальный API сайта и увидеть, как будет выглядеть вход в общий аккаунт.",
    badge: "Launcher Auth",
    form_title: "Вход в клиент",
    form_desc: "Используй логин или почту от сайта Subreel. В ответ ты получишь launcher token и профиль пользователя.",
    identifier: "Логин или почта",
    password: "Пароль",
    submit: "Проверить вход",
    invalid: "Неверный логин или пароль.",
    fill: "Заполни все поля.",
    result: "Результат авторизации",
    token: "Launcher Token",
    account: "Профиль",
    role: "Роль",
    microsoft: "Microsoft",
    connected: "Подключен",
    not_connected: "Не подключен",
    flow_title: "Как это будет работать в лаунчере",
    flow_one: "Пользователь вводит логин или почту и пароль от сайта.",
    flow_two: "Клиент получает launcher token через `/api/launcher/auth`.",
    flow_three: "При следующих запусках лаунчер проверяет токен через `/api/launcher/session`.",
    cabinet: "Открыть кабинет",
    docs: "Документация API",
  },
  EN: {
    back: "Back",
    nav_wiki: "Wiki",
    title: "Launcher Login Screen",
    subtitle:
      "This is no longer just a concept. You can test the future launcher flow through the real website API and see how sign-in to the shared account will look.",
    badge: "Launcher Auth",
    form_title: "Client Sign-in",
    form_desc: "Use your Subreel website login or email. You will get a launcher token and user profile in the response.",
    identifier: "Login or email",
    password: "Password",
    submit: "Test sign-in",
    invalid: "Invalid login or password.",
    fill: "Fill in all fields.",
    result: "Auth Result",
    token: "Launcher Token",
    account: "Profile",
    role: "Role",
    microsoft: "Microsoft",
    connected: "Connected",
    not_connected: "Not connected",
    flow_title: "How it will work in the launcher",
    flow_one: "The user enters website login or email and password.",
    flow_two: "The client gets a launcher token through `/api/launcher/auth`.",
    flow_three: "On next launches the launcher checks the token through `/api/launcher/session`.",
    cabinet: "Open account",
    docs: "API docs",
  },
} as const;

export default function LauncherLoginPage() {
  const [lang, setLang] = useState<Lang>("RU");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LauncherSuccess["launcher"] | null>(null);
  const router = useRouter();
  const t = content[lang];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!identifier.trim() || !password) {
      setError(t.fill);
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/launcher/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const payload = (await response.json()) as LauncherSuccess | LauncherFailure;

      if (!response.ok || !payload.ok) {
        setError(t.invalid);
        return;
      }

      setResult(payload.launcher);
    } catch {
      setError(t.invalid);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-16 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={3} /> {t.back}
            </button>
            <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] hidden md:block">
              Subreel
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)] shadow-sm">
              <Link href="/wiki/launcher-auth" className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase transition-colors group">
                <BookOpen size={14} className="text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)] transition-colors" />
                <span className="hidden sm:block text-[var(--color-text-gray)] group-hover:text-[var(--color-text)] transition-colors">{t.nav_wiki}</span>
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />
              <button
                onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                className="px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors"
              >
                {lang}
              </button>
              <ThemeToggle className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
            </div>
          </div>
        </div>
      </nav>

      <main className="px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-7xl mx-auto grid xl:grid-cols-[0.95fr_1.05fr] gap-8 md:gap-10 items-start">
          <section className="rounded-[2.25rem] md:rounded-[3rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,var(--color-card-bg),var(--color-panel-bg))] p-7 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)] mb-8">
              <Lock size={14} />
              {t.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-[1000] uppercase italic tracking-tighter leading-[0.92]">{t.title}</h1>
            <p className="mt-5 text-base md:text-lg text-[var(--color-text-gray)] leading-relaxed font-medium max-w-2xl">{t.subtitle}</p>

            <div className="mt-10 grid gap-4">
              <FlowCard number="01" text={t.flow_one} />
              <FlowCard number="02" text={t.flow_two} />
              <FlowCard number="03" text={t.flow_three} />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/account" className="inline-flex items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95">
                <User size={16} />
                {t.cabinet}
              </Link>
              <Link href="/wiki/launcher-auth" className="inline-flex items-center justify-center gap-3 rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)]">
                <BookOpen size={16} />
                {t.docs}
              </Link>
            </div>
          </section>

          <section className="grid gap-6">
            <article className="rounded-[2.25rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-7 md:p-10">
              <div className="w-14 h-14 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8">
                <MonitorSmartphone size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter mb-4">{t.form_title}</h2>
              <p className="text-[var(--color-text-gray)] text-base md:text-lg leading-relaxed font-medium mb-8">{t.form_desc}</p>

              <form className="grid gap-4" onSubmit={handleSubmit}>
                <Field label={t.identifier} value={identifier} onChange={setIdentifier} />
                <Field label={t.password} type="password" value={password} onChange={setPassword} />
                {error ? <MessageBox tone="error" text={error} /> : null}
                <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">
                  {pending ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {t.submit}
                </button>
              </form>
            </article>

            <article className="rounded-[2.25rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(180deg,var(--color-panel-bg),var(--color-card-bg))] p-7 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl md:text-3xl font-[1000] uppercase italic tracking-tighter">{t.result}</h2>
              </div>

              {result ? (
                <div className="grid gap-4">
                  <ResultBox label={t.token} value={result.token} code />
                  <ResultBox label={t.account} value={`${result.user.nickname} (@${result.user.login})`} />
                  <ResultBox label={t.role} value={result.user.role} />
                  <ResultBox label={t.microsoft} value={result.user.microsoftConnected ? t.connected : t.not_connected} />
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5 text-sm md:text-base text-[var(--color-text-gray)] font-medium leading-relaxed">
                  `POST /api/launcher/auth` вернёт `launcher token` и краткий профиль пользователя. Здесь результат появится после успешной проверки.
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    </div>
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

function FlowCard({ number, text }: { number: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)]/80 px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-xs font-black uppercase tracking-[0.18em]">
          {number}
        </div>
        <p className="text-sm md:text-base font-medium leading-relaxed text-[var(--color-text-gray)]">{text}</p>
      </div>
    </div>
  );
}

function ResultBox({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)] mb-2">{label}</div>
      {code ? (
        <code className="block break-all text-xs md:text-sm font-bold text-[var(--color-text)]">{value}</code>
      ) : (
        <div className="text-sm md:text-base font-bold text-[var(--color-text)]">{value}</div>
      )}
    </div>
  );
}

function MessageBox({ tone, text }: { tone: "error"; text: string }) {
  const styles =
    tone === "error"
      ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
      : "border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]";

  return <div className={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${styles}`}>{text}</div>;
}
