"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PublicIdea, UserBug, UserIdea } from "@/lib/feedback";

type Props = {
  initialIdeas: PublicIdea[];
  initialMyIdeas: UserIdea[];
  initialMyBugs: UserBug[];
  isStaff: boolean;
};

type Severity = "low" | "normal" | "high" | "critical";

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

export function FeedbackDashboardClient({ initialIdeas, initialMyIdeas, initialMyBugs, isStaff }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ideas, setIdeas] = useState(initialIdeas);
  const [myIdeas, setMyIdeas] = useState(initialMyIdeas);
  const [myBugs, setMyBugs] = useState(initialMyBugs);

  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaSummary, setIdeaSummary] = useState("");
  const [ideaDetails, setIdeaDetails] = useState("");
  const [ideaStatus, setIdeaStatus] = useState<string | null>(null);

  const [bugTitle, setBugTitle] = useState("");
  const [bugLocation, setBugLocation] = useState("");
  const [bugSummary, setBugSummary] = useState("");
  const [bugDetails, setBugDetails] = useState("");
  const [bugSeverity, setBugSeverity] = useState<Severity>("normal");
  const [bugStatus, setBugStatus] = useState<string | null>(null);

  const publishedCount = useMemo(() => ideas.length, [ideas]);

  async function handleIdeaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIdeaStatus(null);

    const response = await fetch("/api/community/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ideaTitle,
        summary: ideaSummary,
        details: ideaDetails,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; idea?: UserIdea } | null;

    if (!response.ok || !payload?.ok || !payload.idea) {
      setIdeaStatus("Не удалось отправить идею. Проверь поля и попробуй ещё раз.");
      return;
    }

    setMyIdeas((current) => [payload.idea!, ...current].slice(0, 8));
    setIdeaTitle("");
    setIdeaSummary("");
    setIdeaDetails("");
    setIdeaStatus("Идея отправлена в очередь модерации.");
    startTransition(() => router.refresh());
  }

  async function handleBugSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBugStatus(null);

    const response = await fetch("/api/community/bugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bugTitle,
        location: bugLocation,
        summary: bugSummary,
        details: bugDetails,
        severity: bugSeverity,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; bug?: UserBug } | null;

    if (!response.ok || !payload?.ok || !payload.bug) {
      setBugStatus("Не удалось отправить баг-репорт. Проверь поля и попробуй ещё раз.");
      return;
    }

    setMyBugs((current) => [payload.bug!, ...current].slice(0, 8));
    setBugTitle("");
    setBugLocation("");
    setBugSummary("");
    setBugDetails("");
    setBugSeverity("normal");
    setBugStatus("Баг-репорт отправлен в очередь разбора.");
    startTransition(() => router.refresh());
  }

  async function handleVote(ideaId: string, value: 1 | -1) {
    const response = await fetch(`/api/community/ideas/${ideaId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      result?: { ideaId: string; currentVote: -1 | 0 | 1; votesUp: number; votesDown: number };
    } | null;

    if (!response.ok || !payload?.ok || !payload.result) {
      return;
    }

    setIdeas((current) =>
      current.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              currentVote: payload.result!.currentVote,
              votesUp: payload.result!.votesUp,
              votesDown: payload.result!.votesDown,
            }
          : idea,
      ),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="flex flex-col gap-6">
        <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Идеи для голосования</p>
              <h2 className="mt-2 text-3xl font-black">Одобренные предложения</h2>
            </div>
            <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">{publishedCount} идей</span>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {ideas.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-[var(--color-border-sharp)] px-5 py-8 text-sm text-[var(--color-text-gray)]">
                Пока нет опубликованных идей. Как только модерация одобрит первые предложения, они появятся здесь для голосования.
              </div>
            ) : (
              ideas.map((idea) => (
                <article key={idea.id} className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">
                          {idea.status}
                        </span>
                        <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-xs text-[var(--color-text-gray)]">
                          {formatDate(idea.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-2xl font-black">{idea.title}</h3>
                      <p className="mt-3 text-sm text-[var(--color-text-gray)]">{idea.summary}</p>
                      <p className="mt-3 text-sm leading-6 text-[var(--color-text)]/85">{idea.details}</p>

                      {idea.moderatorNote ? (
                        <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Комментарий модерации: {idea.moderatorNote}
                        </div>
                      ) : null}
                    </div>

                    <div className="min-w-[220px] rounded-[1.4rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">Голосование</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleVote(idea.id, 1)}
                          className={`rounded-[1rem] px-4 py-3 text-sm font-black transition ${
                            idea.currentVote === 1
                              ? "bg-emerald-500 text-white"
                              : "border border-[var(--color-border-sharp)] bg-white text-[var(--color-text)]"
                          }`}
                        >
                          ↑ {idea.votesUp}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVote(idea.id, -1)}
                          className={`rounded-[1rem] px-4 py-3 text-sm font-black transition ${
                            idea.currentVote === -1
                              ? "bg-rose-500 text-white"
                              : "border border-[var(--color-border-sharp)] bg-white text-[var(--color-text)]"
                          }`}
                        >
                          ↓ {idea.votesDown}
                        </button>
                      </div>

                      {idea.author ? (
                        <p className="mt-4 text-xs text-[var(--color-text-gray)]">
                          Автор: <span className="font-bold text-[var(--color-text)]">{idea.author.nickname}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={handleIdeaSubmit} className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Предложить идею</p>
            <h2 className="mt-2 text-2xl font-black">Отправить в moderation</h2>

            <div className="mt-5 flex flex-col gap-4">
              <input
                value={ideaTitle}
                onChange={(event) => setIdeaTitle(event.target.value)}
                placeholder="Короткое название идеи"
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
              <input
                value={ideaSummary}
                onChange={(event) => setIdeaSummary(event.target.value)}
                placeholder="Краткое описание"
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
              <textarea
                value={ideaDetails}
                onChange={(event) => setIdeaDetails(event.target.value)}
                placeholder="Что именно хочется добавить, зачем это нужно и как это должно работать"
                rows={6}
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </div>

            {ideaStatus ? <p className="mt-4 text-sm text-[var(--color-text-gray)]">{ideaStatus}</p> : null}

            <button
              type="submit"
              disabled={isPending}
              className="mt-5 rounded-[1.2rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white"
            >
              Отправить идею
            </button>
          </form>

          <form onSubmit={handleBugSubmit} className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Сообщить о баге</p>
            <h2 className="mt-2 text-2xl font-black">Отправить в очередь разбора</h2>

            <div className="mt-5 flex flex-col gap-4">
              <input
                value={bugTitle}
                onChange={(event) => setBugTitle(event.target.value)}
                placeholder="Короткая тема бага"
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
              <input
                value={bugLocation}
                onChange={(event) => setBugLocation(event.target.value)}
                placeholder="Где проявляется"
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
              <input
                value={bugSummary}
                onChange={(event) => setBugSummary(event.target.value)}
                placeholder="Краткое описание"
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
              <select
                value={bugSeverity}
                onChange={(event) => setBugSeverity(event.target.value as Severity)}
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              >
                <option value="low">Низкая</option>
                <option value="normal">Обычная</option>
                <option value="high">Высокая</option>
                <option value="critical">Критическая</option>
              </select>
              <textarea
                value={bugDetails}
                onChange={(event) => setBugDetails(event.target.value)}
                placeholder="Шаги воспроизведения, что ожидалось и что произошло на самом деле"
                rows={6}
                className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/80 px-4 py-3 text-sm outline-none"
              />
            </div>

            {bugStatus ? <p className="mt-4 text-sm text-[var(--color-text-gray)]">{bugStatus}</p> : null}

            <button
              type="submit"
              disabled={isPending}
              className="mt-5 rounded-[1.2rem] bg-rose-500 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white"
            >
              Отправить баг
            </button>
          </form>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Мои идеи</p>
              <h3 className="mt-2 text-2xl font-black">История отправок</h3>
            </div>
            {isStaff ? (
              <Link
                href="/dashboard/moderation"
                className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--color-accent-blue)]"
              >
                Moderation
              </Link>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {myIdeas.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[var(--color-border-sharp)] px-4 py-4 text-sm text-[var(--color-text-gray)]">
                Пока ты ещё не отправлял идеи.
              </div>
            ) : (
              myIdeas.map((idea) => (
                <div key={idea.id} className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{idea.title}</p>
                    <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 text-xs font-black text-[var(--color-accent-blue)]">
                      {idea.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-gray)]">{idea.summary}</p>
                  <p className="mt-2 text-xs text-[var(--color-text-gray)]">{formatDate(idea.createdAt)}</p>
                  {idea.moderatorNote ? (
                    <p className="mt-2 text-xs text-amber-700">Примечание модерации: {idea.moderatorNote}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Мои баги</p>
          <h3 className="mt-2 text-2xl font-black">Очередь баг-репортов</h3>

          <div className="mt-5 flex flex-col gap-3">
            {myBugs.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[var(--color-border-sharp)] px-4 py-4 text-sm text-[var(--color-text-gray)]">
                Пока ты ещё не отправлял баг-репорты.
              </div>
            ) : (
              myBugs.map((bug) => (
                <div key={bug.id} className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{bug.title}</p>
                    <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-black text-rose-600">
                      {bug.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-gray)]">{bug.summary}</p>
                  <p className="mt-2 text-xs text-[var(--color-text-gray)]">
                    {formatDate(bug.createdAt)} • severity: {bug.severity}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
