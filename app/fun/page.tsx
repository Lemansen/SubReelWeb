"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Tv2,
  Calendar,
  Trophy,
  Clock,
  ExternalLink,
  Radio,
  Zap,
  Archive,
  Menu,
  X,
  Github,
  MessageCircle,
  BookOpen,
  Info,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = "stream" | "event" | "tournament";
type EventStatus = "upcoming" | "live" | "past";

interface GameEvent {
  id: number;
  type: EventType;
  status: EventStatus;
  titleRU: string;
  titleEN: string;
  descRU: string;
  descEN: string;
  date: string;
  duration: string;
  link?: string;
  prize?: string;
}

// ─── Заглушки — замени на свои данные ────────────────────────────────────────

const EVENTS: GameEvent[] = [
  // ── СЕЙЧАС ────────────────────────────────────────────────────────────────
  {
    id: 1,
    type: "event",
    status: "live",
    titleRU: "Совместное выживание: Поход в Незер",
    titleEN: "Co-op Survival: Nether Expedition",
    descRU: "Собираем команду и идём в Незер за ресурсами. Присоединяйся прямо сейчас — сервер онлайн.",
    descEN: "Gathering a team for a Nether resource run. Join now — server is online.",
    date: "2026-05-07T20:00:00",
    duration: "~2ч",
  },
  {
    id: 2,
    type: "stream",
    status: "live",
    titleRU: "Стрим: Строим базу с нуля",
    titleEN: "Stream: Building a Base from Scratch",
    descRU: "Стримим процесс постройки новой базы в ванильном выживании. Чат открыт, заходи.",
    descEN: "Streaming the process of building a new survival base. Chat is open.",
    date: "2026-05-07T21:00:00",
    duration: "3ч",
    link: "https://twitch.tv/subreel",
  },

  // ── ПРЕДСТОЯЩИЕ ───────────────────────────────────────────────────────────
  {
    id: 3,
    type: "tournament",
    status: "upcoming",
    titleRU: "PvP Турнир: Ванильный меч",
    titleEN: "PvP Tournament: Vanilla Sword",
    descRU: "Бои без зачарований и зелий — только скилл и тактика. Регистрация в Discord.",
    descEN: "No enchants, no potions — pure skill and tactics. Register on Discord.",
    date: "2026-05-14T18:00:00",
    duration: "4ч",
    prize: "Кастомный ник + титул на сервере",
  },
  {
    id: 4,
    type: "event",
    status: "upcoming",
    titleRU: "Строй-батл: Деревенский стиль",
    titleEN: "Build Battle: Village Style",
    descRU: "Командный строй-батл с темой «деревня». Судьи оценивают детали, стиль и атмосферу.",
    descEN: "Team build battle on the theme of 'village'. Judges score detail, style, and atmosphere.",
    date: "2026-05-17T16:00:00",
    duration: "2ч",
  },
  {
    id: 5,
    type: "event",
    status: "upcoming",
    titleRU: "Охота на Дракона: Сезон 2",
    titleEN: "Dragon Hunt: Season 2",
    descRU: "Открытый рейд на Края — кто нанесёт последний удар, получает особый трофей.",
    descEN: "Open raid on the End — whoever deals the final blow gets a special trophy.",
    date: "2026-05-22T19:00:00",
    duration: "~3ч",
    prize: "Дракон яйцо + особый статус",
  },
  {
    id: 6,
    type: "stream",
    status: "upcoming",
    titleRU: "Q&A: Планы на лето + показ сервера",
    titleEN: "Q&A: Summer Plans + Server Tour",
    descRU: "Отвечаем на вопросы про сервер, обновления и показываем что строим.",
    descEN: "Answering questions about the server, updates, and showing what we're building.",
    date: "2026-05-28T20:00:00",
    duration: "1.5ч",
    link: "https://twitch.tv/subreel",
  },

  // ── АРХИВ ─────────────────────────────────────────────────────────────────
  {
    id: 7,
    type: "tournament",
    status: "past",
    titleRU: "PvP Турнир: Сезон 1",
    titleEN: "PvP Tournament: Season 1",
    descRU: "Победитель: Dre4mW4lker. 24 участника, финал длился 40 минут.",
    descEN: "Winner: Dre4mW4lker. 24 players, the final lasted 40 minutes.",
    date: "2026-04-05T18:00:00",
    duration: "5ч",
    prize: "Rank + кастомный скин",
  },
  {
    id: 8,
    type: "event",
    status: "past",
    titleRU: "Ивент: Поиск клада",
    titleEN: "Event: Treasure Hunt",
    descRU: "Скрытые сундуки по всему миру — кто нашёл больше, тот победил.",
    descEN: "Hidden chests across the world — whoever finds the most wins.",
    date: "2026-03-22T15:00:00",
    duration: "2ч",
  },
  {
    id: 9,
    type: "stream",
    status: "past",
    titleRU: "Стрим: Хардкор выживание — попытка #3",
    titleEN: "Stream: Hardcore Survival — Attempt #3",
    descRU: "Дошли до 47-го дня. Убил скелет в пещере. Классика.",
    descEN: "Made it to day 47. Killed by a skeleton in a cave. Classic.",
    date: "2026-02-14T20:00:00",
    duration: "4ч",
    link: "https://twitch.tv/subreel",
  },
  {
    id: 10,
    type: "event",
    status: "past",
    titleRU: "Новогодний ивент 2026",
    titleEN: "New Year Event 2026",
    descRU: "Совместный фейерверк, конкурс на лучший дом и раздача подарков.",
    descEN: "Group fireworks, best house contest, and gift giveaway.",
    date: "2025-12-31T22:00:00",
    duration: "3ч",
  },
];

// ─── i18n ─────────────────────────────────────────────────────────────────────

const content = {
  RU: {
    nav_home: "Главная", nav_launcher: "Лаунчер", nav_server: "Сервер",
    nav_wiki: "Вики", about: "Про нас",
    hero_badge: "Живой контент",
    hero_title: "Развлечения",
    hero_desc: "Ивенты, турниры и стримы от комьюнити Subreel. Следи за анонсами и не пропусти живой контент.",
    tab_upcoming: "Предстоящие", tab_archive: "Архив",
    filter_all: "Все", filter_stream: "Стримы", filter_event: "Ивенты", filter_tournament: "Турниры",
    badge_live: "LIVE", badge_upcoming: "Скоро", badge_past: "Прошло",
    badge_stream: "Стрим", badge_event: "Ивент", badge_tournament: "Турнир",
    label_prize: "Награда", label_duration: "Длительность", label_watch: "Смотреть",
    label_announce_title: "Ближайшее событие",
    label_announce_sub: "Не пропусти — следи в Discord",
    label_discord: "Discord",
    label_no_events: "Событий пока нет",
    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Работаем с 2020 года",
    footer_open_source: "Open Source",
    footer_code_text: "Проект придерживается принципов",
  },
  EN: {
    nav_home: "Home", nav_launcher: "Launcher", nav_server: "Server",
    nav_wiki: "Wiki", about: "About Us",
    hero_badge: "Live Content",
    hero_title: "Entertainment",
    hero_desc: "Events, tournaments, and streams from the Subreel community. Stay tuned for live content.",
    tab_upcoming: "Upcoming", tab_archive: "Archive",
    filter_all: "All", filter_stream: "Streams", filter_event: "Events", filter_tournament: "Tournaments",
    badge_live: "LIVE", badge_upcoming: "Soon", badge_past: "Past",
    badge_stream: "Stream", badge_event: "Event", badge_tournament: "Tournament",
    label_prize: "Prize", label_duration: "Duration", label_watch: "Watch",
    label_announce_title: "Next Event",
    label_announce_sub: "Don't miss it — follow on Discord",
    label_discord: "Discord",
    label_no_events: "No events yet",
    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
    footer_open_source: "Open Source",
    footer_code_text: "The project adheres to",
  },
};

type Lang = "RU" | "EN";
type T = (typeof content)["RU"];

const NAV_LINKS = (t: T) => [
  { name: t.nav_home, path: "/" },
  { name: t.nav_launcher, path: "/launcher" },
  { name: t.nav_server, path: "/server" },
  { name: t.nav_wiki, path: "/wiki" },
  { name: t.about, path: "/about" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === "RU" ? "ru-RU" : "en-US", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const TYPE_ICON: Record<EventType, React.ReactNode> = {
  stream: <Tv2 size={14} strokeWidth={2.5} />,
  event: <Zap size={14} strokeWidth={2.5} />,
  tournament: <Trophy size={14} strokeWidth={2.5} />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, t }: { status: EventStatus; t: T }) {
  if (status === "live")
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-500">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        {t.badge_live}
      </span>
    );
  if (status === "upcoming")
    return (
      <span className="rounded-full bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-accent-blue)]">
        {t.badge_upcoming}
      </span>
    );
  return (
    <span className="rounded-full bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">
      {t.badge_past}
    </span>
  );
}

function TypeBadge({ type, t }: { type: EventType; t: T }) {
  const label = type === "stream" ? t.badge_stream : type === "event" ? t.badge_event : t.badge_tournament;
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)]">
      {TYPE_ICON[type]} {label}
    </span>
  );
}

function EventCard({ ev, lang, t }: { ev: GameEvent; lang: Lang; t: T }) {
  const title = lang === "RU" ? ev.titleRU : ev.titleEN;
  const desc = lang === "RU" ? ev.descRU : ev.descEN;
  const isLive = ev.status === "live";
  const isPast = ev.status === "past";

  return (
    <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 sm:p-7 flex flex-col gap-4 transition-all duration-200
      ${isLive
        ? "border-red-500/40 bg-red-500/5 shadow-[0_0_40px_-10px_rgba(239,68,68,0.2)]"
        : isPast
        ? "border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] opacity-70"
        : "border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] hover:border-[var(--color-accent-blue)] hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.15)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={ev.status} t={t} />
        <TypeBadge type={ev.type} t={t} />
      </div>

      <div>
        <h3 className="text-lg sm:text-xl font-[1000] uppercase italic tracking-tight leading-tight mb-1.5">{title}</h3>
        <p className="text-sm text-[var(--color-text-gray)] leading-relaxed font-medium">{desc}</p>
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-5 text-[11px] font-black uppercase tracking-wider text-[var(--color-text-gray)]">
        <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(ev.date, lang)}</span>
        <span className="flex items-center gap-1.5"><Clock size={11} />{formatTime(ev.date)} · {ev.duration}</span>
        {ev.prize && (
          <span className="flex items-center gap-1.5 text-amber-500">
            <Trophy size={11} />{t.label_prize}: {ev.prize}
          </span>
        )}
      </div>

      {ev.link && !isPast && (
        <a href={ev.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[var(--color-accent-blue)] text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 hover:opacity-90 transition-opacity">
          {isLive ? <Radio size={13} /> : <ExternalLink size={13} />}
          {t.label_watch}
        </a>
      )}
    </div>
  );
}

function AnnounceBanner({ lang, t }: { lang: Lang; t: T }) {
  const next = EVENTS
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!next) return null;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[var(--color-accent-blue)]/30 bg-[var(--color-accent-blue)]/5 p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
      <div className="w-12 h-12 shrink-0 rounded-2xl bg-[var(--color-accent-blue)] text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
        <Zap size={22} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-accent-blue)] mb-1">{t.label_announce_title}</p>
        <p className="text-base sm:text-lg font-[1000] uppercase italic tracking-tight">{lang === "RU" ? next.titleRU : next.titleEN}</p>
        <p className="text-[11px] text-[var(--color-text-gray)] mt-1 font-medium">{formatDate(next.date, lang)} · {formatTime(next.date)}</p>
      </div>
      <a href="https://discord.gg/t7bjdm9uDC" target="_blank" rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-2 rounded-xl border border-[var(--color-accent-blue)]/30 bg-[var(--color-accent-blue)]/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/20 transition-colors">
        <MessageCircle size={13} />{t.label_discord}
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FunPage() {
  const [lang, setLang] = useState<Lang>("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "archive">("upcoming");
  const [filter, setFilter] = useState<"all" | EventType>("all");

  const pathname = usePathname();
  const t = content[lang];
  const navLinks = NAV_LINKS(t);

  const filtered = EVENTS.filter((e) => {
    const matchTab = tab === "upcoming" ? e.status !== "past" : e.status === "past";
    const matchFilter = filter === "all" || e.type === filter;
    return matchTab && matchFilter;
  });

  const FILTERS: { key: "all" | EventType; label: string }[] = [
    { key: "all", label: t.filter_all },
    { key: "stream", label: t.filter_stream },
    { key: "event", label: t.filter_event },
    { key: "tournament", label: t.filter_tournament },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border-sharp)] bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] shrink-0">Subreel</Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.slice(0, 3).map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path}
                  className={`relative text-[11px] font-black uppercase tracking-[0.2em] py-1 transition-colors ${isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"}`}>
                  {item.name}
                  {isActive && <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-xl p-1">
              <Link href="/wiki" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors">
                <BookOpen size={14} /> {t.nav_wiki}
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)]" />
              <Link href="/about" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors">
                <Info size={14} /> {t.about}
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)]" />
              <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors">
                {lang}
              </button>
              <ThemeToggle className="p-1.5 rounded-lg text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors" />
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="h-9 px-3 rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[11px] font-black uppercase text-[var(--color-text-gray)]">
              {lang}
            </button>
            <ThemeToggle className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text-gray)]" />
            <button onClick={() => setMobileMenuOpen((v) => !v)} className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)]">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-black uppercase tracking-[0.15em] transition-colors ${isActive ? "bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]" : "text-[var(--color-text)] hover:bg-[var(--color-panel-hover)]"}`}>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-14 sm:pt-20 md:pt-28 pb-10 sm:pb-14 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.04] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-[1000] uppercase tracking-[0.3em] mb-5 sm:mb-7 border border-[var(--color-accent-blue)]/20">
            <Tv2 size={12} /> {t.hero_badge}
          </div>
          <h1 className="text-[2.8rem] sm:text-7xl md:text-8xl font-[1000] tracking-[-0.04em] mb-4 sm:mb-5 uppercase italic leading-[0.85]">
            {t.hero_title}
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-gray)] max-w-xl mx-auto font-medium leading-relaxed opacity-80">
            {t.hero_desc}
          </p>
        </div>
      </section>

      {/* ── ANNOUNCE BANNER ── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 mb-8 sm:mb-10">
        <AnnounceBanner lang={lang} t={t} />
      </div>

      {/* ── CONTROLS ── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-2xl p-1 self-start">
          {(["upcoming", "archive"] as const).map((tabKey) => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                tab === tabKey ? "bg-[var(--color-accent-blue)] text-white shadow-md shadow-blue-500/20" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
              }`}>
              {tabKey === "upcoming" ? <Calendar size={13} /> : <Archive size={13} />}
              {tabKey === "upcoming" ? t.tab_upcoming : t.tab_archive}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest border transition-all ${
                filter === f.key
                  ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]"
                  : "border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text-gray)] hover:border-[var(--color-accent-blue)]/40"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── EVENTS ── */}
      <main className="grow max-w-6xl mx-auto w-full px-4 sm:px-6 pb-16 sm:pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--color-text-gray)]">
            <Calendar size={40} strokeWidth={1.5} className="opacity-30" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-40">{t.label_no_events}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* LIVE — full width */}
            {filtered.filter((e) => e.status === "live").map((ev) => (
              <div key={ev.id} className="sm:col-span-2">
                <EventCard ev={ev} lang={lang} t={t} />
              </div>
            ))}
            {/* Rest */}
            {filtered.filter((e) => e.status !== "live").map((ev) => (
              <EventCard key={ev.id} ev={ev} lang={lang} t={t} />
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--color-border-sharp)] py-10 sm:py-12 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-8 sm:mb-12">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg shadow-blue-500/20">S</div>
                <span className="font-[1000] text-xl tracking-tighter uppercase italic">Subreel Studio</span>
              </div>
              <p className="text-[11px] uppercase opacity-50 font-bold tracking-[0.1em] leading-relaxed text-[var(--color-text-gray)]">{t.footer_disclaimer}</p>
            </div>
            <div className="flex items-center gap-6 sm:gap-10">
              <a href="https://discord.gg/t7bjdm9uDC" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-all">
                <MessageCircle size={16} /> Discord
              </a>
              <a href="https://github.com/Lemansen/SubReelWeb" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-all">
                <Github size={16} /> GitHub
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-[var(--color-border-sharp)]/50">
            <div className="text-[10px] uppercase tracking-[0.4em] font-[1000] text-[var(--color-text-gray)] opacity-60">{t.footer_since}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-gray)] text-center">
              {t.footer_code_text}{" "}
              <a href="https://github.com/Lemansen/SubReelWeb" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-blue)] hover:underline underline-offset-4">
                {t.footer_open_source}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}