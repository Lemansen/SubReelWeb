"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Network,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  ChevronLeft,
  Map as MapIcon,
  BookOpen,
  BarChart3,
  MessageSquare,
  Smile,
  HelpCircle,
  ArrowRight,
  Menu,
  X,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const content = {
  RU: {
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_back: "Назад",
    nav_wiki: "Вики",
    about: "Про нас",

    badge_version: "1.20.1 · Java Edition",
    badge_started: "Запущен 10.03.2026",

    hero_title_1: "Динамичность.",
    hero_title_2: "Сплочённость.",
    hero_title_3: "Разносторонность.",
    hero_subtitle:
      "Subreel — приватный сервер Minecraft с необычным геймплеем. Перед началом игры нужно подать заявку в Discord.",

    status_online: "В сети",
    status_offline: "Офлайн",
    status_loading: "Загрузка",
    status_players: "Игроков",
    status_version: "Версия",
    ip_label: "Адрес сервера",
    copy_ip: "Копировать IP",
    copied: "Скопировано!",
    join_btn: "Присоединиться",
    updated: "Обновлено",

    wiki_title: "Википедия Subreel",
    wiki_subtitle: "Важно к прочтению",
    wiki_read_more: "Читать дальше",
    wiki_all: "Все статьи",

    wiki_cards: [
      { title: "Территории", tag: "Геймплей", desc: "Не придется больше ставить таблички и писать в ДС свою территорию." },
      { title: "Начало игры!", tag: "Основное", desc: "Инструкция «Как зайти на сервер» с поэтапным объяснением от нашей команды." },
      { title: "Вход без пароля", tag: "Аккаунт", desc: "Если вам надоело каждый раз вводить пароль при входе, то можно это выключить (при наличии лицензии)." },
      { title: "2FA", tag: "Аккаунт", desc: "Безопасность аккаунта — превыше всего. Защитите свои данные." },
      { title: "Гильдии", tag: "Геймплей", desc: "Группа людей или друзей, у которых общая цель и общие идеи. Объединение и сплоченность." },
      { title: "Порталы", tag: "Геймплей", desc: "На сервере можно создать порталы любым размером замкнутой формы." },
    ],

    map_title: "Динамическая карта сервера",
    map_desc: "Находите красивые места! Используя карту вам предоставится возможность искать других игроков и планировать постройки.",
    map_btn: "Открыть карту",

    mods_title_1: "Голосовой чат",
    mods_desc_1: "Голосовой чат стирает грань между игрой и реальностью — вы общаетесь с персонажами как вживую. Это основа нашего сервера.",
    mods_title_2: "Эмоции",
    mods_desc_2: "Мод позволит вам ярко выражать свои эмоции на сервере, делая игру ещё атмосфернее.",

    faq_title: "Часто задаваемые вопросы",
    faq_subtitle: "Вопрос — Ответ",
    faq_cards: [
      { q: "Какое ядро?", a: "Мы используем оптимизированный форк, который исправляет ошибки и вносит улучшения в производительность." },
      { q: "Какой радиус деспавна?", a: "Полезно знать тем, у кого есть фермы. Радиус уменьшен для оптимизации TPS." },
      { q: "Характеристики VDS?", a: "Intel Core i9-13900K, 128GB DDR5 RAM, NVMe SSD Raid 1. Локация: Германия." },
      { q: "Нужна ли лицензия?", a: "Лицензия не обязательна, но даёт дополнительные возможности — например, вход без пароля." },
      { q: "Как подать заявку?", a: "Зайдите в наш Discord и следуйте инструкции в канале #заявки. Это быстро и просто." },
    ],

    access_title: "Доступ на Subreel",
    access_desc: "Наш сервер — это чистый Minecraft без лишних плагинов и привилегий. Присоединиться могут все желающие.",
    access_cost: "Стоимость доступа",
    access_free: "БЕСПЛАТНО",
    access_perks: [
      "Без доната и привилегий",
      "Приватный — по заявке",
      "Честная игра для всех",
    ],

    rules_btn: "Правила",

    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Существует с 2020 года",

    survival_badge: "МАЛЫЙ ОНЛАЙН • ХАРДКОРНАЯ СУЕТА",

survival_title: "Мы не про большой онлайн.",
survival_desc:
  "Если вы ищете сервер с тысячами игроков и вечным шумом — этот сервер не для вас. Здесь нас мало. Здесь мы выживаем, строим историю и создаём атмосферу, а не играем в постановочное РП.",

survival_points: [
  "Маленькое, живое комьюнити",
  "Свобода действий без навязанных сценариев",
  "Выживание важнее РП",
  "Суета, хаос, альянсы и предательства",
],

join_steps_title: "Как зайти на сервер?",
join_steps: [
  "Иметь любой уровень платной подписки",
  "Написать мне в личные сообщения BOOSTY ваш ник в Minecraft",
  "Зайти на flectone.net",
],

version_title: "Какая версия Minecraft?",
version_desc:
  "Самая последняя — 1.26.1.2. В дальнейшем сервер будет обновляться выше.",

pirate_title: "Можно ли без лицензии?",
pirate_desc:
  "Да. Но ваш никнейм должен быть уникальным и не существовать в свободной среде.",

world_title: "Что будет на сервере?",
world_points: [
  "Полная свобода действий и живой геймплей",
  "Нижний мир и Энд сначала будут закрыты",
  "Игроки сами решают, когда открывать измерения",
  "Торговля жителей изменена экспериментами Mojang",
],

forbidden_title: "Что запрещено?",
forbidden_points: [
  "Миникарты и точки смерти",
  "Динамическое освещение и шейдеры",
  "KillAura, X-Ray, Fly, AutoClicker и прочие читы",
  "Вред игрокам и кража ресурсов без согласия",
],

allowed_title: "Что разрешено?",
allowed_points: [
  "Любой багоюз внутри ванильного Minecraft",
  "Дюпы ковров, рельс, песка, TNT и прочего",
  "Делай что угодно, пока не мешаешь другим игрокам",
],
  },
  EN: {
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_back: "Back",
    nav_wiki: "Wiki",
    about: "About Us",

    badge_version: "1.20.1 · Java Edition",
    badge_started: "Started 10.03.2026",

    hero_title_1: "Dynamics.",
    hero_title_2: "Cohesion.",
    hero_title_3: "Versatility.",
    hero_subtitle: "Subreel is a private Minecraft server with unique gameplay. You must apply in Discord before playing.",

    status_online: "Online",
    status_offline: "Offline",
    status_loading: "Loading",
    status_players: "Players",
    status_version: "Version",
    ip_label: "Server Address",
    copy_ip: "Copy IP",
    copied: "Copied!",
    join_btn: "Join Now",
    updated: "Updated",

    wiki_title: "Subreel Wiki",
    wiki_subtitle: "Important to read",
    wiki_read_more: "Read more",
    wiki_all: "All articles",

    wiki_cards: [
      { title: "Territories", tag: "Gameplay", desc: "No need to place signs and write your territory in Discord anymore." },
      { title: "Getting Started!", tag: "Basics", desc: "Instructions on 'How to join the server' with a step-by-step explanation." },
      { title: "Passwordless Login", tag: "Account", desc: "Tired of entering your password every time? Turn it off (premium account required)." },
      { title: "2FA", tag: "Account", desc: "Account security is paramount. Protect your data." },
      { title: "Guilds", tag: "Gameplay", desc: "A group of people or friends with a common goal and ideas. Unity and cohesion." },
      { title: "Portals", tag: "Gameplay", desc: "You can create portals of any size and closed shape on the server." },
    ],

    map_title: "Dynamic Server Map",
    map_desc: "Find beautiful places! Using the map, you will have the opportunity to look for other players and plan builds.",
    map_btn: "Open Live Map",

    mods_title_1: "Voice Chat",
    mods_desc_1: "Voice chat blurs the line between game and reality — you communicate with characters as if in real life.",
    mods_title_2: "Emotes",
    mods_desc_2: "The mod allows you to express your emotions brightly on the server, making the game even more atmospheric.",

    faq_title: "Frequently Asked Questions",
    faq_subtitle: "Q & A",
    faq_cards: [
      { q: "What core do you use?", a: "We use an optimized fork that fixes bugs and brings performance improvements." },
      { q: "Mob despawn radius?", a: "Useful for farm builders. The radius is reduced for TPS optimization." },
      { q: "VDS Specs?", a: "Intel Core i9-13900K, 128GB DDR5 RAM, NVMe SSD Raid 1. Location: Germany." },
      { q: "Is a license required?", a: "A license is not required, but it unlocks extra features like passwordless login." },
      { q: "How to apply?", a: "Join our Discord and follow the instructions in the #applications channel. It's quick and easy." },
    ],

    access_title: "Access to Subreel",
    access_desc: "Our server is pure Minecraft without unnecessary plugins and privileges. Everyone can join.",
    access_cost: "Access Cost",
    access_free: "FREE",
    access_perks: [
      "No donations or privileges",
      "Private — apply to join",
      "Fair play for everyone",
    ],

    rules_btn: "Rules",

    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",

    survival_badge: "SMALL ONLINE • HARDCORE CHAOS",
    survival_title: "We are not about massive online.",
    survival_desc:
      "If you are looking for a server with thousands of players and endless noise, this is probably not the place. Here we are few, we survive, build stories, and create atmosphere instead of staged roleplay.",
    survival_points: [
      "Small, living community",
      "Freedom without forced scripts",
      "Survival matters more than roleplay",
      "Chaos, alliances, betrayal, and stories",
    ],
  },
} as const;

type LiveStatus = {
  online: boolean;
  version: string;
  playersOnline: number;
  playersMax: number;
  motd: string;
  tps: string;
  updatedAt: string;
};

// Tag colour mapping for wiki cards
const tagColors: Record<string, string> = {
  "Геймплей": "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "Gameplay": "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "Основное": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Basics": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  "Аккаунт": "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  "Account": "bg-purple-500/15 text-purple-400 border border-purple-500/20",
};

export default function ServerPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const serverIP = "mc.subreel.online";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const t = content[lang];

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const response = await fetch("/api/server-status", { method: "GET", cache: "no-store" });
        const result = (await response.json()) as {
          online?: boolean; version?: string; playersOnline?: number;
          playersMax?: number; motd?: string; tps?: string; updatedAt?: string;
        };
        if (!cancelled) {
          setLiveStatus({
            online: Boolean(result.online),
            version: result.version ?? "1.20.1",
            playersOnline: result.playersOnline ?? 0,
            playersMax: result.playersMax ?? 0,
            motd: result.motd ?? "",
            tps: result.tps ?? "--",
            updatedAt: result.updatedAt ?? new Date().toISOString(),
          });
        }
      } catch {
        if (!cancelled) {
          setLiveStatus({
            online: false, version: "1.20.1", playersOnline: 0,
            playersMax: 0, motd: "", tps: "--", updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    loadStatus();
    const interval = setInterval(loadStatus, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const playersValue = liveStatus ? `${liveStatus.playersOnline} / ${liveStatus.playersMax || "?"}` : "-- / --";
  const onlineValue = liveStatus
    ? liveStatus.online ? t.status_online : t.status_offline
    : t.status_loading;
  const isOnline = liveStatus?.online ?? false;
  const motdValue = liveStatus?.motd ? liveStatus.motd : "Subreel";
  const versionValue = liveStatus?.version ?? "1.20.1";
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
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={3} /> {t.nav_back}
            </button>
            <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] hidden md:block">
              Subreel
            </Link>
          </div>

          <div className="hidden md:flex order-3 md:order-none w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 items-center justify-center gap-8">
            {[
              { name: t.nav_home, path: "/" },
              { name: t.nav_launcher, path: "/launcher" },
              { name: t.nav_server, path: "/server" },
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-5 ${isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"}`}
                >
                  {item.name}
                  {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center justify-end w-auto md:w-1/3 gap-3 ml-auto">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)] shadow-sm">
              <Link
                href="/wiki"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-sm font-bold uppercase transition-colors group"
              >
                <BookOpen size={14} className="text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)] transition-colors" />
                <span className="text-[var(--color-text-gray)] group-hover:text-[var(--color-text)] transition-colors">{t.nav_wiki}</span>
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />
              <button
                onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-sm font-bold uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors"
              >
                <Globe size={13} />
                {lang}
              </button>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />
              <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
            </div>
          </div>

          {/* Mobile right controls */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <button
              onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-sharp)] text-[10px] font-black uppercase text-[var(--color-text-gray)]"
            >
              {lang}
            </button>
            <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] transition-colors" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors border border-[var(--color-border-sharp)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden order-4 w-full rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-2 shadow-xl mt-1">
              {[
                { name: t.nav_home, path: "/" },
                { name: t.nav_launcher, path: "/launcher" },
                { name: t.nav_server, path: "/server" },
                { name: "Mobile", path: "/mobile" },
                { name: t.nav_wiki, path: "/wiki" },
              ].map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors ${pathname === item.path ? "text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/8" : "text-[var(--color-text)] hover:bg-[var(--color-panel-hover)]"}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-14 md:pt-24 pb-14 md:pb-24 px-4 md:px-6 overflow-hidden">
        {/* Dot grid bg */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.045] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_60%,transparent_100%)]" />
        {/* Glow blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* LEFT: Text + buttons */}
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] uppercase tracking-wider border border-[var(--color-accent-blue)]/20">
                {t.badge_version}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold rounded-lg px-3 py-1.5 bg-[var(--color-panel-bg)] text-[var(--color-text-gray)] uppercase tracking-wider border border-[var(--color-border-sharp)]">
                {t.badge_started}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-[1000] tracking-[-0.04em] mb-6 uppercase italic leading-[0.92] text-balance">
              <div className="text-[var(--color-text)]">{t.hero_title_1}</div>
              <div className="text-[var(--color-text)]">{t.hero_title_2}</div>
              <div className="text-[var(--color-accent-blue)]">{t.hero_title_3}</div>
            </h1>

            <p className="text-base md:text-lg text-[var(--color-text-gray)] mb-8 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.hero_subtitle}
            </p>

            {/* CTA buttons – mobile: 2 col grid */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center lg:justify-start gap-3 mb-8">
              <a
                href="https://discord.gg/t7bjdm9uDC"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-[var(--color-accent-blue)] text-white px-6 py-3.5 rounded-xl font-black uppercase italic tracking-wider transition-all hover:bg-blue-600 active:scale-95 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.55)] text-sm"
              >
                {t.join_btn} <ExternalLink size={16} strokeWidth={3} />
              </a>

              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 bg-[var(--color-panel-bg)] text-[var(--color-text)] border border-[var(--color-border-sharp)] px-5 py-3.5 rounded-xl font-black uppercase italic tracking-wider hover:bg-[var(--color-panel-hover)] transition-all active:scale-95 text-sm"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={3} /> : <Copy size={16} strokeWidth={3} />}
                {copied ? t.copied : t.copy_ip}
              </button>

              <Link
                href="/wiki"
                className="flex items-center justify-center gap-2 bg-[var(--color-panel-bg)] text-[var(--color-text)] border border-[var(--color-border-sharp)] px-5 py-3.5 rounded-xl font-black uppercase italic tracking-wider hover:bg-[var(--color-panel-hover)] transition-all active:scale-95 text-sm"
              >
                <BookOpen size={16} strokeWidth={3} />
                {t.rules_btn}
              </Link>

              <Link
                href="/stats"
                className="flex items-center justify-center gap-2 bg-[var(--color-panel-bg)] text-[var(--color-text)] border border-[var(--color-border-sharp)] px-5 py-3.5 rounded-xl font-black uppercase italic tracking-wider hover:bg-[var(--color-panel-hover)] transition-all active:scale-95 text-sm"
              >
                <BarChart3 size={16} strokeWidth={3} />
                {lang === "RU" ? "Статистика" : "Stats"}
              </Link>
            </div>

            {/* IP card */}
            <div className="rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)]/80 backdrop-blur-sm p-4 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-black tracking-[0.22em] text-[var(--color-text-gray)] mb-1">{t.ip_label}</div>
                  <div className="text-lg font-black tracking-tight text-[var(--color-accent-blue)] truncate">{serverIP}</div>
                  <div className="mt-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
                    <span
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"}`}
                    />
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

          {/* RIGHT: Stat cards – 2×2 grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StatCard
              icon={<Users size={26} strokeWidth={2} />}
              value={playersValue}
              label={t.status_players}
              color="blue"
              pulse={isOnline}
            />
            <StatCard
              icon={<Zap size={26} strokeWidth={2} />}
              value={tpsValue}
              label="TPS"
              color="emerald"
              pulse={isOnline}
            />
            <StatCard
              icon={<ShieldCheck size={26} strokeWidth={2} />}
              value={motdValue}
              label="MOTD"
              color="purple"
            />
            <StatCard
              icon={<Network size={26} strokeWidth={2} />}
              value={versionValue}
              label={t.status_version}
              color="orange"
            />
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-14">
  <div className="max-w-7xl mx-auto">
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 md:p-10 lg:p-14">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_45%)]" />

      <div className="relative grid lg:grid-cols-2 gap-10 items-center">

        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.25em] mb-6">
            {t.survival_badge}
          </div>

          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-[-0.04em] leading-[0.95] mb-6">
            {t.survival_title}
          </h2>

          <p className="text-sm md:text-lg leading-relaxed text-[var(--color-text-gray)] max-w-2xl">
            {t.survival_desc}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {t.survival_points.map((point, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5"
            >
              <div className="text-xs uppercase tracking-[0.25em] text-blue-400 font-black mb-3">
                0{idx + 1}
              </div>

              <div className="font-bold text-sm md:text-base leading-relaxed">
                {point}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>

<section className="relative overflow-hidden py-24 bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
  {/* Декоративный фон */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-10 pointer-events-none">
    <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[120px]" />
  </div>

  <div className="container relative mx-auto px-6">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-neutral-900 dark:text-white sm:text-5xl">
          Рекомендации <span className="text-indigo-500">сообщества</span>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
          Мы ценим труд талантливых разработчиков и художников. Здесь собраны сторонние проекты, которые мы официально рекомендуем для лучшего игрового опыта на нашем сервере.
        </p>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Карточка 1: SP DuoPack */}
      <a 
        href="https://sp.duopack.ru/" 
        target="_blank" 
        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-8 transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10"
      >
        <div>
          <div className="mb-4 inline-flex h-10 items-center rounded-full bg-orange-500/10 px-4 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Resource Pack
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">SP DuoPack</h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Эксклюзивные визуальные улучшения и проработанные модели для погружения в мир.
          </p>
        </div>
        <div className="mt-8 flex items-center text-sm font-bold text-neutral-900 dark:text-white group-hover:text-indigo-500 transition-colors">
          Подробнее <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </a>

      {/* Карточка 2: SPEmotes */}
      <a 
        href="https://spemotes.com/" 
        target="_blank" 
        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-8 transition-all hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10"
      >
        <div>
          <div className="mb-4 inline-flex h-10 items-center rounded-full bg-blue-500/10 px-4 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Animations
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">SPEmotes</h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Мод на эмоции, делающий общение между игроками по-настоящему живым.
          </p>
        </div>
        <div className="mt-8 flex items-center text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-500 transition-colors">
<svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </a>

      {/* Карточка 3: DuoPack */}
      <a 
        href="https://duopack.ru/" 
        target="_blank" 
        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-8 transition-all hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10"
      >
        <div>
          <div className="mb-4 inline-flex h-10 items-center rounded-full bg-emerald-500/10 px-4 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Vanilla Plus
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">DuoPack Classic</h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Оригинальный взгляд на стандартные текстуры в высоком качестве.
          </p>
        </div>
        <div className="mt-8 flex items-center text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-500 transition-colors">
          Открыть <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </a>

      {/* Карточка 4: Flectone */}
      <a 
        href="https://flectone.net/ru" 
        target="_blank" 
        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-8 transition-all hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10"
      >
        <div>
          <div className="mb-4 inline-flex h-10 items-center rounded-full bg-purple-500/10 px-4 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Community Hub
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Flectone</h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Глобальный портал с модификациями и инструментами для игроков.
          </p>
        </div>
        <div className="mt-8 flex items-center text-sm font-bold text-neutral-900 dark:text-white group-hover:text-purple-500 transition-colors">
          Перейти <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </div>
      </a>
    </div>
  </div>
</section>

      {/* ── WIKI ── */}
      <section className="px-4 md:px-6 py-14 md:py-20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-[2rem] p-6 md:p-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-accent-blue)] mb-2">{t.wiki_subtitle}</p>
                <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-[var(--color-text)]">{t.wiki_title}</h2>
              </div>
              <Link
                href="/wiki"
                className="inline-flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border-sharp)] px-5 py-3 rounded-xl font-black uppercase italic tracking-wider text-sm text-[var(--color-text-gray)] hover:border-[var(--color-accent-blue)] hover:text-[var(--color-accent-blue)] transition-colors self-start sm:self-auto"
              >
                <BookOpen size={15} strokeWidth={2.5} />
                {t.wiki_all}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {t.wiki_cards.map((card, idx) => (
                <Link
                  key={idx}
                  href="/wiki"
                  className="bg-[var(--color-bg)] border border-[var(--color-border-sharp)] hover:border-[var(--color-accent-blue)] hover:shadow-[0_8px_32px_-12px_rgba(59,130,246,0.3)] transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="font-black italic text-base uppercase tracking-tight leading-tight">{card.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${tagColors[card.tag] ?? "bg-[var(--color-panel-bg)] text-[var(--color-text-gray)]"}`}>
                        {card.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-gray)] font-medium leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--color-accent-blue)] text-[11px] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    {t.wiki_read_more} <ArrowRight size={13} strokeWidth={3} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ── MAP ── */}
      <section className="px-4 md:px-6 py-6 md:py-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[var(--color-panel-bg)] to-[var(--color-accent-blue)]/10 border border-[var(--color-border-sharp)] flex flex-col md:flex-row items-center justify-between p-6 md:p-14 gap-8">
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <div className="bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-5">
                Squaremap
              </div>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-3 leading-tight">
                {t.map_title}
              </h2>
              <p className="text-[var(--color-text-gray)] font-medium text-base mb-7 leading-relaxed">
                {t.map_desc}
              </p>
              <Link href="http://mc.subreel.online:21168/" className="inline-flex items-center gap-2 bg-[var(--color-accent-blue)] text-white px-7 py-3.5 rounded-xl font-black uppercase italic tracking-wider transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-lg text-sm">
                <MapIcon size={17} strokeWidth={3} /> {t.map_btn}
              </Link>
            </div>
            <div className="hidden md:flex relative w-1/2 h-48 items-center justify-center opacity-40 pointer-events-none">
              <MapIcon size={180} className="text-[var(--color-accent-blue)]" strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MODS ── */}
      <section className="px-4 md:px-6 py-6 md:py-8 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-4">
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] p-7 md:p-10 rounded-[2rem] flex flex-col justify-between gap-4 hover:border-orange-500/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-5">
                <MessageSquare size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-3">{t.mods_title_1}</h3>
              <p className="text-[var(--color-text-gray)] font-medium text-base leading-relaxed">{t.mods_desc_1}</p>
            </div>
          </div>
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] p-7 md:p-10 rounded-[2rem] flex flex-col justify-between gap-4 hover:border-purple-500/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-5">
                <Smile size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-3">{t.mods_title_2}</h3>
              <p className="text-[var(--color-text-gray)] font-medium text-base leading-relaxed">{t.mods_desc_2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 md:px-6 py-14 md:py-20 bg-white/[0.02] border-y border-[var(--color-border-sharp)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-accent-blue)] mb-3">{t.faq_subtitle}</p>
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">{t.faq_title}</h2>
          </div>

          <div className="flex flex-col gap-3">
            {t.faq_cards.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className={`w-full text-left bg-[var(--color-panel-bg)] border rounded-2xl p-5 md:p-6 transition-all ${isOpen ? "border-[var(--color-accent-blue)] shadow-[0_8px_32px_-12px_rgba(59,130,246,0.25)]" : "border-[var(--color-border-sharp)] hover:border-[var(--color-accent-blue)]/50"}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)] flex-shrink-0 w-6 text-center">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-base font-black uppercase italic tracking-tight">{faq.q}</h3>
                    </div>
                    <div className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-0" : ""}`}>
                      {isOpen
                        ? <ChevronUp size={18} className="text-[var(--color-accent-blue)]" strokeWidth={2.5} />
                        : <ChevronDown size={18} className="text-[var(--color-text-gray)]" strokeWidth={2.5} />
                      }
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-4 pl-10 text-[var(--color-text-gray)] font-medium text-sm leading-relaxed text-left">
                      {faq.a}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>



      {/* ── ACCESS ── */}
      <section className="px-4 md:px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.03] [mask-image:radial-gradient(ellipse_50%_80%_at_50%_50%,#000_60%,transparent_100%)]" />
        <div className="max-w-2xl mx-auto text-center relative">
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[var(--color-accent-blue)] mb-4">{t.access_cost}</p>
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
            {t.access_title}
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-gray)] font-medium mb-10">
            {t.access_desc}
          </p>

          <div className="bg-gradient-to-br from-[var(--color-accent-blue)] to-blue-800 p-px rounded-[2.5rem]">
            <div className="bg-[var(--color-bg)] rounded-[2.45rem] py-12 px-6 md:px-12">
              <div className="text-6xl md:text-8xl font-[1000] italic uppercase tracking-tighter text-[var(--color-accent-blue)] mb-8">
                {t.access_free}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {t.access_perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] px-4 py-2 rounded-xl">
                    <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={3} />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-gray)]">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 mt-auto bg-[var(--color-bg)] border-t border-[var(--color-border-sharp)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-8 h-8 bg-[var(--color-accent-blue)] rounded-lg flex items-center justify-center text-white font-bold italic text-sm">S</div>
              <span className="font-bold text-lg tracking-tight uppercase italic text-[var(--color-accent-blue)]">Subreel Studio</span>
            </div>
            <p className="text-xs text-[var(--color-text-gray)] max-w-sm font-medium">
              {t.footer_disclaimer}
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--color-text-gray)]">
            {t.footer_since}
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: "blue" | "emerald" | "purple" | "orange";
  pulse?: boolean;
}) {
  const palette = {
    blue:    { card: "border-blue-500/20 hover:border-blue-500/40",    icon: "text-blue-500 bg-blue-500/10",    glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(59,130,246,0.35)]" },
    emerald: { card: "border-emerald-500/20 hover:border-emerald-500/40", icon: "text-emerald-500 bg-emerald-500/10", glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(34,197,94,0.35)]" },
    purple:  { card: "border-purple-500/20 hover:border-purple-500/40",  icon: "text-purple-500 bg-purple-500/10",  glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(168,85,247,0.35)]" },
    orange:  { card: "border-orange-500/20 hover:border-orange-500/40",  icon: "text-orange-500 bg-orange-500/10",  glow: "group-hover:shadow-[0_8px_32px_-8px_rgba(249,115,22,0.35)]" },
  };
  const p = palette[color];

  return (
    <div className={`bg-[var(--color-card-bg)] border ${p.card} ${p.glow} p-4 md:p-6 rounded-2xl md:rounded-[2rem] transition-all hover:scale-[1.02] group`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-5 transition-transform group-hover:rotate-3 ${p.icon}`}>
        {icon}
      </div>
      <div className="text-lg md:text-2xl font-[900] tracking-tighter mb-1 uppercase italic leading-none break-all">{value}</div>
      <div className="flex items-center gap-1.5">
        {pulse && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />}
        <div className="text-[9px] md:text-[10px] uppercase font-bold text-[var(--color-text-gray)] tracking-[0.2em]">{label}</div>
      </div>
    </div>
  );
  
}
