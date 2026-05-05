"use client";

import { useState } from "react";

type TelegramState = {
  username: string;
  userId: number | null;
  verifiedAt: string | null;
  connected: boolean;
  botUsername: string;
};

type Props = {
  initialState: TelegramState;
};

export function TelegramLinkClient({ initialState }: Props) {
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateLink() {
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/account/telegram", {
      method: "POST",
      credentials: "include",
    });

    const result = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok || !result?.ok || !result?.link?.deepLinkUrl) {
      setError("Не удалось создать ссылку привязки. Проверь настройки бота и попробуй ещё раз.");
      return;
    }

    setMessage("Открываю Telegram. Нажми Start у бота, чтобы подтвердить привязку.");
    window.open(result.link.deepLinkUrl as string, "_blank", "noopener,noreferrer");
  }

  async function handleRefresh() {
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/account/telegram", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok || !result?.ok) {
      setError("Не удалось обновить статус Telegram.");
      return;
    }

    setState(result.telegram);
    setMessage(result.telegram.connected ? "Telegram уже привязан." : "Telegram пока не привязан.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[1.8rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Telegram Link</p>
        <h2 className="mt-3 text-3xl font-black">Привязка через бота</h2>
        <p className="mt-3 text-sm text-[var(--color-text-gray)]">
          Привяжем аккаунт к Telegram, чтобы потом через бота делать подтверждение, восстановление доступа и безопасные действия без email.
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2">
            статус: {state.connected ? "привязан" : "не привязан"}
          </span>
          <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2">
            бот: @{state.botUsername || "not-configured"}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCreateLink}
            disabled={busy || !state.botUsername}
            className="rounded-[1.1rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Готовим..." : state.connected ? "Перепривязать Telegram" : "Привязать Telegram"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy}
            className="rounded-[1.1rem] border border-[var(--color-border-sharp)] bg-white/70 px-5 py-3 text-sm font-black"
          >
            Обновить статус
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
      </section>

      <aside className="rounded-[1.8rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Текущий статус</p>
        <div className="mt-4 grid gap-3 text-sm text-[var(--color-text-gray)]">
          <div className="rounded-[1rem] border border-[var(--color-border-sharp)] px-4 py-4">
            <div className="font-black text-[var(--color-text)]">Username</div>
            <div className="mt-1">{state.username ? `@${state.username}` : "ещё не привязан"}</div>
          </div>
          <div className="rounded-[1rem] border border-[var(--color-border-sharp)] px-4 py-4">
            <div className="font-black text-[var(--color-text)]">Telegram ID</div>
            <div className="mt-1">{state.userId ?? "ещё не подтверждён"}</div>
          </div>
          <div className="rounded-[1rem] border border-[var(--color-border-sharp)] px-4 py-4">
            <div className="font-black text-[var(--color-text)]">Подтверждён</div>
            <div className="mt-1">{state.verifiedAt ? new Date(state.verifiedAt).toLocaleString("ru-RU") : "пока нет"}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
