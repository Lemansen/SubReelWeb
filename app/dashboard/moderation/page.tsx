import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { getModerationDashboardData } from "@/lib/feedback";
import { ModerationDashboardClient } from "./moderation-client";

export const dynamic = "force-dynamic";

export default async function ModerationDashboardPage() {
  const user = await getCurrentAccountUser();

  if (!user) {
    redirect("/login?next=/dashboard/moderation");
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    redirect("/dashboard");
  }

  const snapshot = await getModerationDashboardData(user);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Moderation Dashboard</p>
              <h1 className="mt-3 text-4xl font-black">Панель модерации</h1>
              <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-gray)]">
                Здесь staff-команда разбирает идеи и баги из Supabase. После одобрения идеи попадают в общий список для
                голосования, а баг-репорты переходят по статусам до фикса.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">pending ideas: {snapshot.pendingIdeas}</span>
              <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">pending bugs: {snapshot.pendingBugs}</span>
              <Link
                href="/dashboard/feedback"
                className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm font-bold text-[var(--color-accent-blue)]"
              >
                Открыть предложку
              </Link>
            </div>
          </div>
        </div>

        <ModerationDashboardClient initialIdeas={snapshot.ideasQueue} initialBugs={snapshot.bugsQueue} />
      </div>
    </main>
  );
}
