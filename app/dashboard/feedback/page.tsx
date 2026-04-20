import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { getFeedbackDashboardData } from "@/lib/feedback";
import { FeedbackDashboardClient } from "./feedback-client";

export const dynamic = "force-dynamic";

export default async function FeedbackDashboardPage() {
  const user = await getCurrentAccountUser();

  if (!user) {
    redirect("/login?next=/dashboard/feedback");
  }

  const data = await getFeedbackDashboardData(user);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Community Hub</p>
              <h1 className="mt-3 text-4xl font-black">Предложка и баг-репорты</h1>
              <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-gray)]">
                Здесь пользователи предлагают идеи, голосуют за уже одобренные фичи и отправляют баг-репорты. Всё идёт в одну
                Supabase-базу и потом попадает в moderation dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">login: {user.login}</span>
              <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">role: {user.role}</span>
              <Link
                href="/dashboard"
                className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm font-bold text-[var(--color-text-gray)]"
              >
                Назад в dashboard
              </Link>
            </div>
          </div>
        </div>

        <FeedbackDashboardClient
          initialIdeas={data.publishedIdeas}
          initialMyIdeas={data.myIdeas}
          initialMyBugs={data.myBugs}
          isStaff={user.role === "admin" || user.role === "moderator"}
        />
      </div>
    </main>
  );
}
