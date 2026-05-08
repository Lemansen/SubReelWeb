"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BugStatus, IdeaStatus, ModerationBugRecord, ModerationIdeaRecord } from "@/lib/feedback";
import type {
  LauncherAnnouncementKind,
  LauncherAnnouncementRecord,
  LauncherAnnouncementScope,
} from "@/lib/launcher-news";

type Props = {
  initialIdeas: ModerationIdeaRecord[];
  initialBugs: ModerationBugRecord[];
  initialNews: LauncherAnnouncementRecord[];
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

function NewsModerationPanel({ initialNews }: { initialNews: LauncherAnnouncementRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scope, setScope] = useState<LauncherAnnouncementScope>("launcher");
  const [kind, setKind] = useState<LauncherAnnouncementKind>("info");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate() {
    setMessage(null);

    const response = await fetch("/api/moderation/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, kind, title, summary, body, ctaLabel, ctaUrl, isPinned }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      setMessage(`Не удалось создать новость: ${payload?.error ?? response.status}`);
      return;
    }

    setTitle("");
    setSummary("");
    setBody("");
    setCtaLabel("");
    setCtaUrl("");
    setIsPinned(false);
    setMessage("Новость опубликована и попадет в лаунчер через /api/launcher/news.");
    startTransition(() => router.refresh());
  }

  return (
    <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] xl:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Launcher news</p>
          <h2 className="mt-2 text-3xl font-black">Новости для лаунчера</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-gray)]">
            Эти публикации сохраняются в Supabase `launcher_announcements` и читаются лаунчером через `/api/launcher/news`.
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-border-sharp)] px-4 py-2 text-sm">{initialNews.length}</span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[1.4rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as LauncherAnnouncementScope)}
              className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="launcher">launcher</option>
              <option value="server">server</option>
              <option value="site">site</option>
              <option value="global">global</option>
            </select>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as LauncherAnnouncementKind)}
              className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="info">info</option>
              <option value="update">update</option>
              <option value="warning">warning</option>
              <option value="event">event</option>
            </select>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Заголовок"
            className="mt-3 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Краткое описание"
            className="mt-3 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            placeholder="Текст новости. Каждая строка станет пунктом в лаунчере."
            className="mt-3 w-full rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
          />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={ctaLabel}
              onChange={(event) => setCtaLabel(event.target.value)}
              placeholder="Текст кнопки"
              className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
            />
            <input
              value={ctaUrl}
              onChange={(event) => setCtaUrl(event.target.value)}
              placeholder="Ссылка кнопки"
              className="rounded-[1rem] border border-[var(--color-border-sharp)] bg-white px-4 py-3 text-sm outline-none"
            />
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold text-[var(--color-text-gray)]">
            <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
            Закрепить сверху
          </label>
          {message ? <p className="mt-3 text-xs text-[var(--color-text-gray)]">{message}</p> : null}
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="mt-4 rounded-[1rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Опубликовать
          </button>
        </div>

        <div className="flex max-h-[520px] flex-col gap-3 overflow-auto pr-1">
          {initialNews.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-[var(--color-border-sharp)] px-4 py-6 text-sm text-[var(--color-text-gray)]">
              Новостей пока нет.
            </div>
          ) : (
            initialNews.map((item) => (
              <article key={item.id} className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-white/70 p-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 font-black uppercase tracking-[0.14em] text-[var(--color-accent-blue)]">
                    {item.scope}
                  </span>
                  <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-[var(--color-text-gray)]">{item.kind}</span>
                  {item.isPinned ? <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-[var(--color-text-gray)]">pinned</span> : null}
                </div>
                <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-gray)]">{item.summary || item.body}</p>
                <p className="mt-3 text-xs text-[var(--color-text-gray)]">{formatDate(item.publishedAt)}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function ModerationDashboardClient({ initialIdeas, initialBugs, initialNews }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <NewsModerationPanel initialNews={initialNews} />

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
