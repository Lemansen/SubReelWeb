"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
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

type TabId = "news" | "ideas" | "bugs";

const tabs: Array<{ id: TabId; title: string; eyebrow: string }> = [
  { id: "news", title: "Новости", eyebrow: "launcher feed" },
  { id: "ideas", title: "Идеи", eyebrow: "community queue" },
  { id: "bugs", title: "Баги", eyebrow: "reports" },
];

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

function useDeleteAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function deleteItem(url: string, label: string) {
    const confirmed = window.confirm(`Удалить ${label}? Это действие нельзя отменить.`);

    if (!confirmed) {
      return;
    }

    const response = await fetch(url, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      window.alert(`Не удалось удалить: ${payload?.error ?? response.status}`);
      return;
    }

    startTransition(() => router.refresh());
  }

  return { deleteItem, isDeleting: isPending };
}

function PanelShell({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="border-b border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,rgba(59,130,246,0.10),transparent)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">Moderation</p>
            <h2 className="mt-2 text-3xl font-black">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-gray)]">{subtitle}</p>
          </div>
          <span className="rounded-full border border-[var(--color-border-sharp)] bg-white/70 px-4 py-2 text-sm font-black">
            {count}
          </span>
        </div>
      </div>

      <div className="p-5 md:p-8">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-[var(--color-border-sharp)] bg-white/50 px-5 py-8 text-sm text-[var(--color-text-gray)]">
      {text}
    </div>
  );
}

function IdeaModerationCard({ item }: { item: ModerationIdeaRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { deleteItem, isDeleting } = useDeleteAction();
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
      setMessage(`Не удалось обновить идею: ${payload?.error ?? response.status}`);
      return;
    }

    setMessage("Состояние идеи обновлено.");
    startTransition(() => router.refresh());
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
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
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-gray)]">{item.summary}</p>
          <p className="mt-3 text-xs font-bold text-[var(--color-text-gray)]">
            votes: +{item.votesUp} / -{item.votesDown}
          </p>
        </div>

        <div className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">Action</p>
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-[1rem] bg-[var(--color-accent-blue)] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => deleteItem(`/api/moderation/ideas/${item.id}`, "идею")}
              disabled={isDeleting}
              className="rounded-[1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-rose-600"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function BugModerationCard({ item }: { item: ModerationBugRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { deleteItem, isDeleting } = useDeleteAction();
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

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      setMessage(`Не удалось обновить баг: ${payload?.error ?? response.status}`);
      return;
    }

    setMessage("Состояние бага обновлено.");
    startTransition(() => router.refresh());
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
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
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-gray)]">{item.summary}</p>
          {item.location ? <p className="mt-3 text-xs text-[var(--color-text-gray)]">Где проявляется: {item.location}</p> : null}
          <p className="mt-3 text-sm leading-6 text-[var(--color-text)]/85">{item.details}</p>
        </div>

        <div className="rounded-[1.2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-600">Action</p>
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-[1rem] bg-rose-500 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => deleteItem(`/api/moderation/bugs/${item.id}`, "баг")}
              disabled={isDeleting}
              className="rounded-[1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-rose-600"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function NewsModerationPanel({ initialNews }: { initialNews: LauncherAnnouncementRecord[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { deleteItem, isDeleting } = useDeleteAction();
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
    <PanelShell
      title="Новости для лаунчера"
      subtitle="Публикуй объявления из Supabase `launcher_announcements`: они сразу доступны лаунчеру через `/api/launcher/news`."
      count={initialNews.length}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[1.4rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">New publication</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            rows={6}
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
            className="mt-4 w-full rounded-[1rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Опубликовать
          </button>
        </div>

        <div className="flex max-h-[680px] flex-col gap-3 overflow-auto pr-1">
          {initialNews.length === 0 ? (
            <EmptyState text="Новостей пока нет." />
          ) : (
            initialNews.map((item) => (
              <article key={item.id} className="rounded-[1.35rem] border border-[var(--color-border-sharp)] bg-white/70 p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 font-black uppercase tracking-[0.14em] text-[var(--color-accent-blue)]">
                    {item.scope}
                  </span>
                  <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-[var(--color-text-gray)]">{item.kind}</span>
                  {item.isPinned ? <span className="rounded-full border border-[var(--color-border-sharp)] px-3 py-1 text-[var(--color-text-gray)]">pinned</span> : null}
                  <span className="ml-auto text-[var(--color-text-gray)]">{formatDate(item.publishedAt)}</span>
                </div>
                <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-gray)]">{item.summary || item.body}</p>
                {item.ctaUrl ? <p className="mt-3 text-xs text-[var(--color-accent-blue)]">{item.ctaLabel || "Открыть"} → {item.ctaUrl}</p> : null}
                <button
                  type="button"
                  onClick={() => deleteItem(`/api/moderation/news?id=${encodeURIComponent(item.id)}`, "новость")}
                  disabled={isDeleting}
                  className="mt-4 rounded-[1rem] border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-rose-600"
                >
                  Удалить
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </PanelShell>
  );
}

export function ModerationDashboardClient({ initialIdeas, initialBugs, initialNews }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("news");
  const pendingIdeas = initialIdeas.filter((item) => item.status === "pending").length;
  const pendingBugs = initialBugs.filter((item) => item.status === "pending").length;
  const pinnedNews = initialNews.filter((item) => item.isPinned).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Новости</p>
          <p className="mt-2 text-3xl font-black">{initialNews.length}</p>
          <p className="mt-1 text-sm text-[var(--color-text-gray)]">закреплено: {pinnedNews}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">Идеи</p>
          <p className="mt-2 text-3xl font-black">{initialIdeas.length}</p>
          <p className="mt-1 text-sm text-[var(--color-text-gray)]">pending: {pendingIdeas}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">Баги</p>
          <p className="mt-2 text-3xl font-black">{initialBugs.length}</p>
          <p className="mt-1 text-sm text-[var(--color-text-gray)]">pending: {pendingBugs}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[1.1rem] px-5 py-3 text-left transition ${
                isActive
                  ? "bg-[var(--color-accent-blue)] text-white shadow-[0_14px_30px_rgba(59,130,246,0.22)]"
                  : "bg-transparent text-[var(--color-text-gray)] hover:bg-white/70 hover:text-[var(--color-text)]"
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{tab.eyebrow}</span>
              <span className="mt-1 block text-sm font-black">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "news" ? <NewsModerationPanel initialNews={initialNews} /> : null}

      {activeTab === "ideas" ? (
        <PanelShell title="Идеи сообщества" subtitle="Меняй статус, оставляй заметки модерации или удаляй мусорные предложения." count={initialIdeas.length}>
          <div className="flex flex-col gap-4">
            {initialIdeas.length === 0 ? <EmptyState text="Очередь идей пока пустая." /> : initialIdeas.map((item) => <IdeaModerationCard key={item.id} item={item} />)}
          </div>
        </PanelShell>
      ) : null}

      {activeTab === "bugs" ? (
        <PanelShell title="Баг-репорты" subtitle="Разбирай отчеты, меняй статус фикса и удаляй дубли или случайные сообщения." count={initialBugs.length}>
          <div className="flex flex-col gap-4">
            {initialBugs.length === 0 ? <EmptyState text="Очередь багов пока пустая." /> : initialBugs.map((item) => <BugModerationCard key={item.id} item={item} />)}
          </div>
        </PanelShell>
      ) : null}
    </div>
  );
}
