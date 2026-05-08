"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users, Network, Copy, CheckCircle2, ExternalLink, ShieldCheck, Zap,
  ChevronLeft, Map as MapIcon, BookOpen, BarChart3, MessageSquare, Smile,
  ArrowRight, Menu, X, Globe, ChevronDown, ChevronUp,
  Skull, Sword, AlertTriangle, Ban, Check, Send, ThumbsUp, Flame,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// ─── CONTENT ────────────────────────────────────────────────────────────────

const content = {
  RU: {
    nav_home: "Главная", nav_launcher: "Лаунчер", nav_server: "Сервер",
    nav_back: "Назад", nav_wiki: "Вики",

    badge_version: "Java · 26.1.2", badge_started: "Запущен Завтра",

    hero_title_1: "Динамичность.", hero_title_2: "Сплочённость.", hero_title_3: "Разносторонность.",
    hero_subtitle: "Subreel — приватный сервер Minecraft. Не ждите тысяч игроков и мегаонлайна. Здесь нас мало — и мы выживаем.",

    status_online: "В сети", status_offline: "Офлайн", status_loading: "...",
    status_players: "Игроков", status_version: "Версия",
    ip_label: "Адрес сервера", copy_ip: "Скопировать IP", copied: "Скопировано!",
    join_btn: "Присоединиться", updated: "Обновлено", rules_btn: "Правила",

    survival_badge: "МАЛЕНЬКИЙ ОНЛАЙН • ХАОС ВЫЖИВАНИЯ",
    survival_title: "Не для больших серверов.",
    survival_desc: "Если вы ищете сервер с тысячами игроков и бесконечным шумом — это, скорее всего, не то место. Здесь нас мало, мы выживаем, строим истории и создаём атмосферу вместо постановочного ролеплея.",
    survival_points: [
      "Живое маленькое комьюнити",
      "Свобода без принудительных сценариев",
      "Выживание важнее ролеплея",
      "Хаос, союзы, предательство и настоящие истории",
    ],

    gameplay_title: "Что вас ждёт?",
    gameplay_subtitle: "Геймплей",
    gameplay_items: [
      { icon: "chaos", title: "Полная свобода", desc: "Буквально ничего на экране — никаких интерфейсов и ограничений. Суета геймплея в чистом виде." },
      { icon: "nether", title: "Нижний мир и Энд", desc: "Изначально выключены. Игроки сами решают, когда и как их открывать — это событие для всего сервера." },
      { icon: "trade", title: "Уникальные жители", desc: "Торговля изменена ванильными экспериментами: в каждом биоме житель уникален по набору торгов." },
    ],

    rules_title: "Правила",
    rules_subtitle: "Что нельзя и что можно",
    rules_ban: [
      "Мини-карты и связанные моды (точки смерти и т.д.)",
      "Моды на динамическое освещение и шейдеры",
      "Kill-aura, рентген, муха, автокликер и подобное",
      "Кража ресурсов и вред игрокам без их согласия",
    ],
    rules_allow: [
      "Любой багоюз внутри игры",
      "Дюп динамита, песка, рельс, ковриков — всего угодно",
      "Взлом зачарования и прочие механики",
      "Делай что угодно, пока не мешаешь другим игрокам",
    ],
    rules_ban_label: "Запрещено", rules_allow_label: "Разрешено",

    map_title: "Живая карта сервера", map_desc: "Исследуйте мир, находите других игроков и планируйте постройки в реальном времени.", map_btn: "Открыть карту",
    mods_title_1: "Голосовой чат", mods_desc_1: "Голосовой чат стирает грань между игрой и реальностью. Это основа нашего сервера.",
    mods_title_2: "Эмоции", mods_desc_2: "Мод позволяет ярко выражать эмоции на сервере, делая игру атмосфернее.",

    access_title: "Доступ на Subreel", access_cost: "Стоимость доступа", access_free: "БЕСПЛАТНО",
    access_desc: "Чистый Minecraft без лишних плагинов и привилегий. Доступен всем желающим.",
    access_perks: ["Без доната", "Приватный", "Честная игра"],

    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Существует с 2020 года",
  },
  EN: {
    nav_home: "Home", nav_launcher: "Launcher", nav_server: "Server",
    nav_back: "Back", nav_wiki: "Wiki",

    badge_version: "Java · 26.1.2", badge_started: "Started 10.03.2026",

    hero_title_1: "Dynamics.", hero_title_2: "Cohesion.", hero_title_3: "Versatility.",
    hero_subtitle: "Subreel — a private Minecraft server. Don't expect thousands of players. Here we are few — and we survive.",

    status_online: "Online", status_offline: "Offline", status_loading: "...",
    status_players: "Players", status_version: "Version",
    ip_label: "Server Address", copy_ip: "Copy IP", copied: "Copied!",
    join_btn: "Join", updated: "Updated", rules_btn: "Rules",

    survival_badge: "SMALL ONLINE • SURVIVAL CHAOS",
    survival_title: "Not for big servers.",
    survival_desc: "If you're looking for a server with thousands of players and endless noise — this probably isn't it. Here we are few, we survive, build stories and create atmosphere instead of staged roleplay.",
    survival_points: [
      "Small, living community",
      "Freedom without forced scripts",
      "Survival over roleplay",
      "Chaos, alliances, betrayal and real stories",
    ],  

    gameplay_title: "What to expect?",
    gameplay_subtitle: "Gameplay",
    gameplay_items: [
      { icon: "chaos", title: "Total freedom", desc: "Literally nothing on screen — no UI clutter or restrictions. Pure gameplay chaos." },
      { icon: "nether", title: "Nether & End", desc: "Initially disabled. Players decide when and how to unlock them — a server-wide event." },
      { icon: "trade", title: "Unique villagers", desc: "Trading is modified by vanilla experiments: each biome has unique villager trade sets." },
    ],

    rules_title: "Rules",
    rules_subtitle: "What's banned and what's allowed",
    rules_ban: [
      "Minimaps and related mods (death points, etc.)",
      "Dynamic lighting mods and shaders",
      "Kill-aura, x-ray, fly, autoclicker and similar",
      "Stealing resources or harming players without consent",
    ],
    rules_allow: [
      "Any in-game bug exploit",
      "TNT dupes, sand dupes, rails, carpets — anything",
      "Enchantment glitches and similar mechanics",
      "Do anything as long as you don't interfere with others",
    ],
    rules_ban_label: "Banned", rules_allow_label: "Allowed",

    map_title: "Live Server Map", map_desc: "Explore the world, find other players and plan builds in real time.", map_btn: "Open Map",
    mods_title_1: "Voice Chat", mods_desc_1: "Voice chat blurs the line between game and reality. It's the core of our server.",
    mods_title_2: "Emotes", mods_desc_2: "The mod lets you express emotions on the server, making the game more atmospheric.",

    access_title: "Access to Subreel", access_cost: "Access Cost", access_free: "FREE",
    access_desc: "Pure Minecraft without unnecessary plugins and privileges. Open to everyone.",
    access_perks: ["No donations", "Private", "Fair play"],

    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
  },
} as const;

type LiveStatus = {
  online: boolean; version: string; playersOnline: number;
  playersMax: number; motd: string; tps: string; updatedAt: string;
};

const tagColors: Record<string, string> = {
  "Геймплей": "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "Gameplay": "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "Основное": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Basics": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Аккаунт": "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  "Account": "bg-purple-500/15 text-purple-400 border border-purple-500/20",
};

const gameplayIcons: Record<string, React.ReactNode> = {
  chaos: <Flame size={22} strokeWidth={2} />,
  nether: <Skull size={22} strokeWidth={2} />,
  trade: <Zap size={22} strokeWidth={2} />,
};

export default function ServerPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [suggestText, setSuggestText] = useState("");
  const [suggestSent, setSuggestSent] = useState(false);
  const [votedIdeas, setVotedIdeas] = useState<Set<number>>(new Set());
  const pathname = usePathname();
  const router = useRouter();

  const serverIP = "mc.subreel.online";
  const t = content[lang];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSuggest = () => {
    if (!suggestText.trim()) return;
    setSuggestSent(true);
    setSuggestText("");
    setTimeout(() => setSuggestSent(false), 4000);
  };

  const toggleVote = (idx: number) => {
    setVotedIdeas(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const response = await fetch("/api/server-status", { method: "GET", cache: "no-store" });
        const result = await response.json() as {
          online?: boolean; version?: string; playersOnline?: number;
          playersMax?: number; motd?: string; tps?: string; updatedAt?: string;
        };
        if (!cancelled) {
          setLiveStatus({
            online: Boolean(result.online), version: result.version ?? "26.1.2",
            playersOnline: result.playersOnline ?? 0, playersMax: result.playersMax ?? 0,
            motd: result.motd ?? "", tps: result.tps ?? "--",
            updatedAt: result.updatedAt ?? new Date().toISOString(),
          });
        }
      } catch {
        if (!cancelled) setLiveStatus({ online: false, version: "26.1.2", playersOnline: 0, playersMax: 0, motd: "", tps: "--", updatedAt: new Date().toISOString() });
      }
    }
    loadStatus();
    const interval = setInterval(loadStatus, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const playersValue = liveStatus ? `${liveStatus.playersOnline} / ${liveStatus.playersMax || "?"}` : "-- / --";
  const onlineValue = liveStatus ? (liveStatus.online ? t.status_online : t.status_offline) : t.status_loading;
  const isOnline = liveStatus?.online ?? false;
  const motdValue = liveStatus?.motd || "Subreel";
  const versionValue = liveStatus?.version ?? "26.1.2";
  const tpsValue = liveStatus?.tps ?? "--";
  const updatedLabel = liveStatus?.updatedAt
    ? new Date(liveStatus.updatedAt).toLocaleTimeString(lang === "RU" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">

      {/* ── NAV ── */}
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/80 backdrop-blur-lg z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-16 py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 md:gap-6 w-auto md:w-1/3 min-w-0">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors">
              <ChevronLeft size={16} strokeWidth={3} /> {t.nav_back}
            </button>
            <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] hidden md:block">Subreel</Link>
          </div>
          <div className="hidden md:flex order-3 md:order-none w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 items-center justify-center gap-8">
            {[{ name: t.nav_home, path: "/" }, { name: t.nav_launcher, path: "/launcher" }, { name: t.nav_server, path: "/server" }].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} className={`text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-5 ${isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"}`}>
                  {item.name}
                  {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />}
                </Link>
              );
            })}
          </div>
          <div className="hidden md:flex items-center justify-end w-auto md:w-1/3 gap-3 ml-auto">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)] shadow-sm">
              <Link href="/wiki" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-sm font-bold uppercase transition-colors group">
                <BookOpen size={14} className="text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)] transition-colors" />
                <span className="text-[var(--color-text-gray)] group-hover:text-[var(--color-text)] transition-colors">{t.nav_wiki}</span>
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />
              <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-sm font-bold uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors">
                <Globe size={13} /> {lang}
              </button>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />
              <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-sharp)] text-[10px] font-black uppercase text-[var(--color-text-gray)]">{lang}</button>
            <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] transition-colors" />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] transition-colors border border-[var(--color-border-sharp)]" aria-label="Toggle navigation menu">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden order-4 w-full rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-2 shadow-xl mt-1">
              {[{ name: t.nav_home, path: "/" }, { name: t.nav_launcher, path: "/launcher" }, { name: t.nav_server, path: "/server" }, { name: t.nav_wiki, path: "/wiki" }].map((item) => (
                <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors ${pathname === item.path ? "text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/8" : "text-[var(--color-text)] hover:bg-[var(--color-panel-hover)]"}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-12 md:pt-20 lg:pt-28 pb-12 md:pb-20 lg:pb-28 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.04] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_60%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6 md:mb-8">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] uppercase tracking-wider border border-[var(--color-accent-blue)]/20">{t.badge_version}</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 bg-[var(--color-panel-bg)] text-[var(--color-text-gray)] uppercase tracking-wider border border-[var(--color-border-sharp)]">{t.badge_started}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-[1000] tracking-[-0.04em] mb-5 md:mb-6 uppercase italic leading-[0.92]">
              <div className="text-[var(--color-text)]">{t.hero_title_1}</div>
              <div className="text-[var(--color-text)]">{t.hero_title_2}</div>
              <div className="text-[var(--color-accent-blue)]">{t.hero_title_3}</div>
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-[var(--color-text-gray)] mb-7 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">{t.hero_subtitle}</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 max-w-md mx-auto lg:mx-0">
<Link 
  href="/launcher"
  className="col-span-2 flex items-center justify-center gap-2 bg-[var(--color-accent-blue)] text-white px-5 py-3.5 rounded-xl font-black uppercase italic tracking-wider transition-all hover:bg-blue-600 active:scale-95 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.55)] text-sm"
>
  {t.join_btn} <ArrowRight size={15} strokeWidth={3} />
</Link>
              <button onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 bg-[var(--color-panel-bg)] text-[var(--color-text)] border border-[var(--color-border-sharp)] px-4 py-3 rounded-xl font-black uppercase italic tracking-wider hover:bg-[var(--color-panel-hover)] transition-all active:scale-95 text-xs md:text-sm">
                {copied ? <CheckCircle2 size={15} className="text-emerald-500" strokeWidth={3} /> : <Copy size={15} strokeWidth={3} />}
                {copied ? t.copied : t.copy_ip}
              </button>
              <Link href="/wiki"
                className="flex items-center justify-center gap-2 bg-[var(--color-panel-bg)] text-[var(--color-text)] border border-[var(--color-border-sharp)] px-4 py-3 rounded-xl font-black uppercase italic tracking-wider hover:bg-[var(--color-panel-hover)] transition-all active:scale-95 text-xs md:text-sm">
                <BookOpen size={15} strokeWidth={3} /> {t.rules_btn}
              </Link>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)]/80 backdrop-blur-sm p-4 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-black tracking-[0.22em] text-[var(--color-text-gray)] mb-1">{t.ip_label}</div>
                  <div className="text-base md:text-lg font-black tracking-tight text-[var(--color-accent-blue)] truncate">{serverIP}</div>
                  <div className="mt-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"}`} />
                    {onlineValue}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] uppercase font-black tracking-[0.22em] text-[var(--color-text-gray)] mb-1">{t.updated}</div>
                  <div className="text-sm font-bold text-[var(--color-text)]">{updatedLabel}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StatCard icon={<Users size={24} strokeWidth={2} />} value={playersValue} label={t.status_players} color="blue" pulse={isOnline} />
            <StatCard icon={<Zap size={24} strokeWidth={2} />} value={tpsValue} label="TPS" color="emerald" pulse={isOnline} />
            <StatCard icon={<ShieldCheck size={24} strokeWidth={2} />} value={motdValue} label="MOTD" color="purple" />
            <StatCard icon={<Network size={24} strokeWidth={2} />} value={versionValue} label={t.status_version} color="orange" />
          </div>
        </div>
      </section>

      {/* ── ACCESS ── */}
      <section className="px-4 md:px-6 py-10 md:py-16 relative overflow-hidden border-t border-[var(--color-border-sharp)]">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.025] [mask-image:radial-gradient(ellipse_50%_80%_at_50%_50%,#000_60%,transparent_100%)]" />
        <div className="max-w-xl mx-auto text-center relative">
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-accent-blue)] mb-3">{t.access_cost}</p>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-3">{t.access_title}</h2>
          <p className="text-sm md:text-base text-[var(--color-text-gray)] font-medium mb-8">{t.access_desc}</p>
          <div className="bg-gradient-to-br from-[var(--color-accent-blue)] to-blue-800 p-px rounded-[2.5rem]">
            <div className="bg-[var(--color-bg)] rounded-[2.45rem] py-10 px-6">
              <div className="text-5xl md:text-7xl font-[1000] italic uppercase tracking-tighter text-[var(--color-accent-blue)] mb-6">{t.access_free}</div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {t.access_perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] px-3.5 py-2 rounded-xl">
                    <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={3} />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)]">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-950/30 via-[var(--color-panel-bg)] to-[var(--color-panel-bg)] p-6 md:p-10 lg:p-14">
            <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-5">
                  <Skull size={12} strokeWidth={3} /> {t.survival_badge}
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter leading-[0.92] mb-4">{t.survival_title}</h2>
                <p className="text-sm md:text-base text-[var(--color-text-gray)] font-medium leading-relaxed">{t.survival_desc}</p>
              </div>
              <div className="grid gap-2.5">
                {t.survival_points.map((point, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[var(--color-bg)]/60 border border-[var(--color-border-sharp)] rounded-xl px-4 py-3">
                    <Sword size={14} className="text-red-400 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-bold text-[var(--color-text)]">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── GAMEPLAY ── */}
      <section className="px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-center">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-accent-blue)] mb-2">{t.gameplay_subtitle}</p>
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">{t.gameplay_title}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {t.gameplay_items.map((item, i) => (
              <div key={i} className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-2xl p-5 md:p-6 hover:border-[var(--color-accent-blue)]/40 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {gameplayIcons[item.icon]}
                </div>
                <h3 className="font-black uppercase italic text-base tracking-tight mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-gray)] font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RULES ── */}
      <section className="px-4 md:px-6 py-10 md:py-14 border-y border-[var(--color-border-sharp)] bg-white/[0.015]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-accent-blue)] mb-2">{t.rules_subtitle}</p>
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">{t.rules_title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[var(--color-panel-bg)] border border-red-500/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center flex-shrink-0"><Ban size={15} strokeWidth={2.5} /></div>
                <span className="text-sm font-black uppercase tracking-widest text-red-400">{t.rules_ban_label}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {t.rules_ban.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                    <X size={13} className="text-red-500 flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-sm font-medium text-[var(--color-text)] leading-snug">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--color-panel-bg)] border border-emerald-500/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0"><Check size={15} strokeWidth={3} /></div>
                <span className="text-sm font-black uppercase tracking-widest text-emerald-400">{t.rules_allow_label}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {t.rules_allow.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3">
                    <Check size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-sm font-medium text-[var(--color-text)] leading-snug">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[var(--color-panel-bg)] to-[var(--color-accent-blue)]/8 border border-[var(--color-border-sharp)] flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-10">
            <div className="text-center sm:text-left">
              <div className="inline-block bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">Squaremap</div>
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter mb-2">{t.map_title}</h2>
              <p className="text-sm text-[var(--color-text-gray)] font-medium leading-relaxed mb-5 max-w-md">{t.map_desc}</p>
              <Link href="http://mc.subreel.online:21168/" className="inline-flex items-center gap-2 bg-[var(--color-accent-blue)] text-white px-5 py-3 rounded-xl font-black uppercase italic tracking-wider transition-all hover:bg-blue-600 active:scale-95 text-sm">
                <MapIcon size={15} strokeWidth={3} /> {t.map_btn}
              </Link>
            </div>
            <div className="hidden md:flex opacity-15 pointer-events-none flex-shrink-0">
              <MapIcon size={120} className="text-[var(--color-accent-blue)]" strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MODS ── */}
      <section className="px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 gap-4">
          {[
            { icon: <MessageSquare size={20} strokeWidth={2.5} />, color: "orange", title: t.mods_title_1, desc: t.mods_desc_1, border: "hover:border-orange-500/40" },
            { icon: <Smile size={20} strokeWidth={2.5} />, color: "purple", title: t.mods_title_2, desc: t.mods_desc_2, border: "hover:border-purple-500/40" },
          ].map((mod, i) => (
            <div key={i} className={`bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] ${mod.border} p-6 md:p-8 rounded-2xl flex flex-col gap-4 transition-colors group`}>
              <div className={`w-10 h-10 rounded-xl bg-${mod.color}-500/10 text-${mod.color}-500 flex items-center justify-center group-hover:scale-110 transition-transform`}>{mod.icon}</div>
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter mb-2">{mod.title}</h3>
                <p className="text-sm text-[var(--color-text-gray)] font-medium leading-relaxed">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 mt-auto bg-[var(--color-bg)] border-t border-[var(--color-border-sharp)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-7 h-7 bg-[var(--color-accent-blue)] rounded-lg flex items-center justify-center text-white font-bold italic text-sm">S</div>
              <span className="font-bold text-base tracking-tight uppercase italic text-[var(--color-accent-blue)]">Subreel Studio</span>
            </div>
            <p className="text-xs text-[var(--color-text-gray)] max-w-xs font-medium opacity-60">{t.footer_disclaimer}</p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--color-text-gray)] opacity-60">{t.footer_since}</div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, value, label, color, pulse }: {
  icon: React.ReactNode; value: string; label: string;
  color: "blue" | "emerald" | "purple" | "orange"; pulse?: boolean;
}) {
  const palette = {
    blue:    { card: "border-blue-500/20 hover:border-blue-500/40",    icon: "text-blue-500 bg-blue-500/10",    glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(59,130,246,0.35)]" },
    emerald: { card: "border-emerald-500/20 hover:border-emerald-500/40", icon: "text-emerald-500 bg-emerald-500/10", glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(34,197,94,0.35)]" },
    purple:  { card: "border-purple-500/20 hover:border-purple-500/40",  icon: "text-purple-500 bg-purple-500/10",  glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(168,85,247,0.35)]" },
    orange:  { card: "border-orange-500/20 hover:border-orange-500/40",  icon: "text-orange-500 bg-orange-500/10",  glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(249,115,22,0.35)]" },
  };
  const p = palette[color];
  return (
    <div className={`bg-[var(--color-card-bg)] border ${p.card} ${p.glow} p-4 md:p-5 rounded-2xl transition-all hover:scale-[1.02] group`}>
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition-transform group-hover:rotate-3 ${p.icon}`}>{icon}</div>
      <div className="text-base md:text-xl lg:text-2xl font-[900] tracking-tighter mb-1 uppercase italic leading-none break-all">{value}</div>
      <div className="flex items-center gap-1.5">
        {pulse && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />}
        <div className="text-[9px] uppercase font-bold text-[var(--color-text-gray)] tracking-[0.2em]">{label}</div>
      </div>
    </div>
  );
}