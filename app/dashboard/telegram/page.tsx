import { redirect } from "next/navigation";
import { getCurrentAccountUser } from "@/lib/auth-session";
import { getTelegramLinkConfig } from "@/lib/telegram-link";
import { TelegramLinkClient } from "@/app/dashboard/telegram/telegram-link-client";

export const dynamic = "force-dynamic";

export default async function DashboardTelegramPage() {
  const user = await getCurrentAccountUser();
  if (!user) {
    redirect("/login?next=/dashboard/telegram");
  }

  const config = getTelegramLinkConfig();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Security</p>
          <h1 className="mt-3 text-4xl font-black">Telegram и подтверждение</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--color-text-gray)]">
            Здесь мы связываем аккаунт SubReel с Telegram. Дальше этот же канал можно использовать для подтверждения входа, восстановления доступа и безопасных действий без email.
          </p>
        </section>

        <TelegramLinkClient
          initialState={{
            username: user.telegramUsername ?? "",
            userId: user.telegramUserId ?? null,
            verifiedAt: user.telegramVerifiedAt ?? null,
            connected: Boolean(user.telegramUserId),
            botUsername: config.botUsername,
          }}
        />
      </div>
    </main>
  );
}
