"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BugStatus, IdeaStatus, ModerationBugRecord, ModerationIdeaRecord } from "@/lib/feedback";

type Props = {
  initialIdeas: ModerationIdeaRecord[];
  initialBugs: ModerationBugRecord[];
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function IdeaModerationCard({ item }: { item: ModerationIdeaRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<IdeaStatus>(item.status);
  const [moderatorNote, setModeratorNote] = useState(item.moderatorNote ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setMessage(null);

    const response = await fetch(`/api/moderation/ideas/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorNote }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      setMessage("Не удалось обновить идею.");
      return;
    }

    setMessage("Состояние идеи обновлено.");
    startTransition(() => router.refresh());
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">
              {item.status}
            </span>
            <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-xs text-[var(--color-text-gray)]">
              {formatDate(item.createdAt)}
            </span>
            {item.author ? (
              <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-xs text-[var(--color-text-gray)]">
                {item.author.nickname} • {item.author.login}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-2xl font-black">{item.title}</h3>
          <p className="mt-3 text-sm text-[var(--color-text-gray)]">{item.summary}</p>
          <p className="mt-3 text-xs text-[var(--color-text-gray)]">
            votes: +{item.votesUp} / -{item.votesDown}
          </p>
        </div>

        <div className="min-w-[280px] rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">Moderation</p>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as IdeaStatus)}
            className="mt-4 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </select>
          <textarea
            value={moderatorNote}
            onChange={(event) => setModeratorNote(event.target.value)}
            rows={4}
            placeholder="Комментарий модерации"
            className="mt-3 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          />
          {message ? <p className="mt-3 text-xs text-[var(--color-text-gray)]">{message}</p> : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="mt-4 rounded-[1rem] bg-[var(--color-accent-blue)] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Сохранить
          </button>
        </div>
      </div>
    </article>
  );
}

function BugModerationCard({ item }: { item: ModerationBugRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<BugStatus>(item.status);
  const [moderatorNote, setModeratorNote] = useState(item.moderatorNote ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setMessage(null);

    const response = await fetch(`/api/moderation/bugs/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorNote }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;

    if (!response.ok || !payload?.ok) {
      setMessage("Не удалось обновить баг.");
      return;
    }

    setMessage("Состояние бага обновлено.");
    startTransition(() => router.refresh());
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-rose-600">
              {item.status}
            </span>
            <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-xs text-[var(--color-text-gray)]">
              {item.severity}
            </span>
            <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-xs text-[var(--color-text-gray)]">
              {formatDate(item.createdAt)}
            </span>
            {item.author ? (
              <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-xs text-[var(--color-text-gray)]">
                {item.author.nickname} • {item.author.login}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-2xl font-black">{item.title}</h3>
          <p className="mt-3 text-sm text-[var(--color-text-gray)]">{item.summary}</p>
          {item.location ? <p className="mt-3 text-xs text-[var(--color-text-gray)]">Где проявляется: {item.location}</p> : null}
          <p className="mt-3 text-sm leading-6 text-[var(--color-text)]/85">{item.details}</p>
        </div>

        <div className="min-w-[280px] rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-600">Moderation</p>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as BugStatus)}
            className="mt-4 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="pending">pending</option>
            <option value="accepted">accepted</option>
            <option value="in_progress">in_progress</option>
            <option value="fixed">fixed</option>
            <option value="rejected">rejected</option>
          </select>
          <textarea
            value={moderatorNote}
            onChange={(event) => setModeratorNote(event.target.value)}
            rows={4}
            placeholder="Комментарий модерации"
            className="mt-3 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          />
          {message ? <p className="mt-3 text-xs text-[var(--color-text-gray)]">{message}</p> : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="mt-4 rounded-[1rem] bg-rose-500 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Сохранить
          </button>
        </div>
      </div>
    </article>
  );
}

export function ModerationDashboardClient({ initialIdeas, initialBugs }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Ideas queue</p>
            <h2 className="mt-2 text-3xl font-black">Идеи</h2>
          </div>
          <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">{initialIdeas.length}</span>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {initialIdeas.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-[var(--color-border-sharp)] px-4 py-6 text-sm text-[var(--color-text-gray)]">
              Очередь идей пока пустая.
            </div>
          ) : (
            initialIdeas.map((item) => <IdeaModerationCard key={item.id} item={item} />)
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">Bugs queue</p>
            <h2 className="mt-2 text-3xl font-black">Баг-репорты</h2>
          </div>
          <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">{initialBugs.length}</span>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {initialBugs.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-[var(--color-border-sharp)] px-4 py-6 text-sm text-[var(--color-text-gray)]">
              Очередь багов пока пустая.
            </div>
          ) : (
            initialBugs.map((item) => <BugModerationCard key={item.id} item={item} />)
          )}
        </div>
      </section>
    </div>
  );
}
