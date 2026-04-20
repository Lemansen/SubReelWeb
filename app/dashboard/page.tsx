import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccountUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentAccountUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const isStaff = user.role === "admin" || user.role === "moderator";

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Supabase Session</p>
          <h1 className="mt-3 text-4xl font-black">Привет, {user.nickname || user.login}</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-gray)]">
            Это единая точка входа для сайта, лаунчера, предложки, баг-репортов и будущей community-экосистемы. Браузер хранит
            Supabase session, а лаунчер умеет забирать валидный JWT через localhost callback flow.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2">login: {user.login}</span>
            <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2">email: {user.email}</span>
            <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2">role: {user.role}</span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/launcher/connect?redirect=http://localhost:25555/callback"
            className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-transform hover:scale-[1.01]"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Launcher</p>
            <h2 className="mt-3 text-2xl font-black">Подключить лаунчер</h2>
            <p className="mt-3 text-sm text-[var(--color-text-gray)]">Открывает браузерный connect flow и возвращает JWT обратно в лаунчер.</p>
          </Link>

          <Link
            href="/dashboard/feedback"
            className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-transform hover:scale-[1.01]"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Community</p>
            <h2 className="mt-3 text-2xl font-black">Предложка</h2>
            <p className="mt-3 text-sm text-[var(--color-text-gray)]">Идеи для голосования, отправка новых предложений и баг-репортов в одну Supabase-базу.</p>
          </Link>

          {isStaff ? (
            <Link
              href="/dashboard/moderation"
              className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-transform hover:scale-[1.01]"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Staff</p>
              <h2 className="mt-3 text-2xl font-black">Модерация</h2>
              <p className="mt-3 text-sm text-[var(--color-text-gray)]">Разбор идей и багов, смена статусов и публикация approved-идей в общий список.</p>
            </Link>
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 text-sm text-[var(--color-text-gray)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">Staff</p>
              <h2 className="mt-3 text-2xl font-black text-[var(--color-text)]">Модерация</h2>
              <p className="mt-3">Эта карточка открывается только для ролей moderator и admin.</p>
            </div>
          )}

          <Link
            href="/logout"
            className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition-transform hover:scale-[1.01]"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">Session</p>
            <h2 className="mt-3 text-2xl font-black">Выйти</h2>
            <p className="mt-3 text-sm text-[var(--color-text-gray)]">Закрывает текущую сессию Supabase в браузере.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
