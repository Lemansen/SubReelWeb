"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  ExternalLink,
  Github,
  Info,
  Menu,
  MessageCircle,
  Music2,
  Play,
  Radio,
  Send,
  Sparkles,
  Tv2,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type Lang = "RU" | "EN";
type PlatformKey = "telegram" | "youtube" | "twitch" | "tiktok";

type Creator = {
  name: string;
  handle: string;
  href: string;
  labelRU: string;
  labelEN: string;
  followers: string;
};

type TikTokVideo = {
  titleRU: string;
  titleEN: string;
  author: string;
  href: string;
  views: string;
  duration: string;
};

const content = {
  RU: {
    about: "Про нас",
    heroBadge: "SubReel Fun",
    heroTitleMain: "Fun",
    heroTitleSub: "Hub",
    heroDesc:
      "Каталог всех медиа-площадок SubReel: Telegram-каналы, YouTube-авторы, Twitch-стримеры и TikTok-креаторы с подборкой коротких видео.",
    navHome: "Главная",
    navLauncher: "Лаунчер",
    navServer: "Сервер",
    navWiki: "Вики",
    hint: "Открыть",
    openProfile: "Перейти",
    platformLabel: "Площадка",
    channelsLabel: "Каналы",
    videosLabel: "Видео",
    telegramTitle: "Telegram-каналы",
    telegramDesc:
      "Новости, анонсы, мемы, быстрые посты и отдельные каналы по направлениям проекта.",
    youtubeTitle: "YouTube-авторы",
    youtubeDesc:
      "Видео по лаунчеру, серверу, гайдам, обзорам обновлений и нарезкам с комьюнити.",
    twitchTitle: "Twitch-стримеры",
    twitchDesc:
      "Живые трансляции, ивенты, прохождения, общение и стримы разработки SubReel.",
    tiktokTitle: "TikTok-креаторы",
    tiktokDesc:
      "Короткие ролики, клипы, мемы и вертикальные нарезки по серверу и лаунчеру.",
    featuredVideos: "Видео TikTok",
    featuredVideosDesc:
      "Сюда можно добавлять свежие ролики тиктокеров SubReel и вести пользователей сразу на видео.",
    footerDisclaimer:
      "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footerSince: "Работаем с 2020 года",
    footerOpenSource: "Open Source",
    footerCodeText: "Проект придерживается принципов",
  },
  EN: {
    about: "About Us",
    heroBadge: "SubReel Fun",
    heroTitleMain: "Fun",
    heroTitleSub: "Hub",
    heroDesc:
      "A catalog of all SubReel media platforms: Telegram channels, YouTube creators, Twitch streamers, and TikTok creators with short video picks.",
    navHome: "Home",
    navLauncher: "Launcher",
    navServer: "Server",
    navWiki: "Wiki",
    hint: "Open",
    openProfile: "Visit",
    platformLabel: "Platform",
    channelsLabel: "Channels",
    videosLabel: "Videos",
    telegramTitle: "Telegram Channels",
    telegramDesc:
      "News, announcements, memes, quick posts, and dedicated channels for different parts of the project.",
    youtubeTitle: "YouTube Creators",
    youtubeDesc:
      "Videos about the launcher, server, guides, update reviews, and community highlights.",
    twitchTitle: "Twitch Streamers",
    twitchDesc:
      "Live broadcasts, events, playthroughs, community talks, and SubReel development streams.",
    tiktokTitle: "TikTok Creators",
    tiktokDesc:
      "Short videos, clips, memes, and vertical highlights about the server and launcher.",
    featuredVideos: "TikTok Videos",
    featuredVideosDesc:
      "Fresh videos from SubReel TikTok creators can be added here and linked directly.",
    footerDisclaimer:
      "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footerSince: "Since 2020",
    footerOpenSource: "Open Source",
    footerCodeText: "The project adheres to",
  },
};

const CREATORS: Record<PlatformKey, Creator[]> = {
  telegram: [
    {
      name: "SubReel News",
      handle: "@subreel",
      href: "https://t.me/subreel",
      labelRU: "главные новости проекта",
      labelEN: "main project news",
      followers: "news",
    },
    {
      name: "SubReel Fun",
      handle: "@subreel_fun",
      href: "https://t.me/subreel_fun",
      labelRU: "мемы, клипы и движ",
      labelEN: "memes, clips, and community fun",
      followers: "fun",
    },
    {
      name: "SubReel Updates",
      handle: "@subreel_updates",
      href: "https://t.me/subreel_updates",
      labelRU: "обновления сайта и лаунчера",
      labelEN: "site and launcher updates",
      followers: "dev",
    },
  ],
  youtube: [
    {
      name: "SubReel Studio",
      handle: "@SubReel",
      href: "https://youtube.com/@SubReel",
      labelRU: "официальные видео и трейлеры",
      labelEN: "official videos and trailers",
      followers: "official",
    },
    {
      name: "SubReel Guides",
      handle: "@SubReelGuides",
      href: "https://youtube.com/@SubReelGuides",
      labelRU: "гайды, туториалы и разборы",
      labelEN: "guides, tutorials, and breakdowns",
      followers: "guides",
    },
    {
      name: "SubReel Clips",
      handle: "@SubReelClips",
      href: "https://youtube.com/@SubReelClips",
      labelRU: "нарезки и лучшие моменты",
      labelEN: "clips and best moments",
      followers: "clips",
    },
  ],
  twitch: [
    {
      name: "SubReel Live",
      handle: "subreel",
      href: "https://twitch.tv/subreel",
      labelRU: "официальные эфиры",
      labelEN: "official live streams",
      followers: "live",
    },
    {
      name: "Lemansen",
      handle: "lemansen",
      href: "https://twitch.tv/lemansen",
      labelRU: "разработка и сервер",
      labelEN: "development and server",
      followers: "dev",
    },
    {
      name: "SubReel Events",
      handle: "subreel_events",
      href: "https://twitch.tv/subreel_events",
      labelRU: "ивенты и турниры",
      labelEN: "events and tournaments",
      followers: "events",
    },
  ],
  tiktok: [
    {
      name: "SubReel TikTok",
      handle: "@subreel",
      href: "https://www.tiktok.com/@subreel",
      labelRU: "официальные короткие ролики",
      labelEN: "official short videos",
      followers: "shorts",
    },
    {
      name: "SubReel Clips",
      handle: "@subreel.clips",
      href: "https://www.tiktok.com/@subreel.clips",
      labelRU: "моменты со стримов",
      labelEN: "stream highlights",
      followers: "clips",
    },
    {
      name: "SubReel Builds",
      handle: "@subreel.builds",
      href: "https://www.tiktok.com/@subreel.builds",
      labelRU: "постройки и серверные вайбы",
      labelEN: "builds and server vibes",
      followers: "builds",
    },
  ],
};

const TIKTOK_VIDEOS: TikTokVideo[] = [
  {
    titleRU: "Лучший момент с ивента SubReel",
    titleEN: "Best SubReel event moment",
    author: "@subreel.clips",
    href: "https://www.tiktok.com/@subreel.clips",
    views: "12.4K",
    duration: "0:24",
  },
  {
    titleRU: "Новая база на сервере за 30 секунд",
    titleEN: "New server base in 30 seconds",
    author: "@subreel.builds",
    href: "https://www.tiktok.com/@subreel.builds",
    views: "8.1K",
    duration: "0:31",
  },
  {
    titleRU: "Лаунчер SubReel: быстрый обзор",
    titleEN: "SubReel Launcher quick showcase",
    author: "@subreel",
    href: "https://www.tiktok.com/@subreel",
    views: "5.7K",
    duration: "0:18",
  },
];

const NAV_LINKS = (t: (typeof content)["RU"]) => [
  { name: t.navHome, path: "/" },
  { name: t.navLauncher, path: "/launcher" },
  { name: t.navServer, path: "/server" },
  { name: t.navWiki, path: "/wiki" },
  { name: t.about, path: "/about" },
];

export default function FunPage() {
  const [lang, setLang] = useState<Lang>("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const t = content[lang];
  const navLinks = NAV_LINKS(t);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const platforms = [
    {
      key: "telegram" as const,
      title: t.telegramTitle,
      desc: t.telegramDesc,
      stat: `${CREATORS.telegram.length} ${t.channelsLabel}`,
      icon: <Send size={30} strokeWidth={2.5} />,
      ghostIcon: <Send size={170} strokeWidth={1} />,
      accent: "from-sky-500 to-blue-600",
      glow: "hover:shadow-[0_30px_70px_-20px_rgba(14,165,233,0.45)]",
    },
    {
      key: "youtube" as const,
      title: t.youtubeTitle,
      desc: t.youtubeDesc,
      stat: `${CREATORS.youtube.length} ${t.channelsLabel}`,
      icon: <Youtube size={33} strokeWidth={2.5} />,
      ghostIcon: <Play size={178} strokeWidth={1} />,
      accent: "from-red-500 to-rose-600",
      glow: "hover:shadow-[0_30px_70px_-20px_rgba(239,68,68,0.42)]",
    },
    {
      key: "twitch" as const,
      title: t.twitchTitle,
      desc: t.twitchDesc,
      stat: `${CREATORS.twitch.length} ${t.channelsLabel}`,
      icon: <Tv2 size={31} strokeWidth={2.5} />,
      ghostIcon: <Radio size={170} strokeWidth={1} />,
      accent: "from-violet-500 to-fuchsia-600",
      glow: "hover:shadow-[0_30px_70px_-20px_rgba(168,85,247,0.42)]",
    },
    {
      key: "tiktok" as const,
      title: t.tiktokTitle,
      desc: t.tiktokDesc,
      stat: `${CREATORS.tiktok.length} ${t.channelsLabel}`,
      icon: <Music2 size={31} strokeWidth={2.5} />,
      ghostIcon: <Clapperboard size={170} strokeWidth={1} />,
      accent: "from-cyan-400 via-zinc-900 to-pink-500",
      glow: "hover:shadow-[0_30px_70px_-20px_rgba(236,72,153,0.38)]",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors selection:bg-[var(--color-accent-blue)] selection:text-white">
      <nav
        ref={menuRef}
        className="sticky top-0 z-50 border-b border-[var(--color-border-sharp)] bg-[var(--color-bg)]/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] shrink-0"
          >
            Subreel
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.slice(0, 3).map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative text-[11px] font-black uppercase tracking-[0.2em] py-1 transition-colors ${
                    isActive
                      ? "text-[var(--color-accent-blue)]"
                      : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-xl p-1">
              <Link
                href="/wiki"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors group"
              >
                <BookOpen size={14} className="group-hover:text-[var(--color-accent-blue)] transition-colors" />
                {t.navWiki}
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)]" />
              <Link
                href="/about"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors group"
              >
                <Info size={14} className="group-hover:text-[var(--color-accent-blue)] transition-colors" />
                {t.about}
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)]" />
              <button
                onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                className="px-3 py-1.5 rounded-lg text-[11px] font-black uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors"
              >
                {lang}
              </button>
              <ThemeToggle className="p-1.5 rounded-lg text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors" />
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
              className="h-9 px-3 rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[11px] font-black uppercase text-[var(--color-text-gray)]"
            >
              {lang}
            </button>
            <ThemeToggle className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text-gray)]" />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]"
              aria-label="Меню"
            >
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
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-black uppercase tracking-[0.15em] transition-colors ${
                      isActive
                        ? "bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-panel-hover)]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <section className="relative pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-20 md:pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--color-accent-blue)]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-[1000] uppercase tracking-[0.3em] mb-6 sm:mb-8 border border-[var(--color-accent-blue)]/20">
            <Sparkles size={12} />
            {t.heroBadge}
          </div>

          <h1 className="text-[3rem] xs:text-[3.5rem] sm:text-7xl md:text-8xl lg:text-[10rem] font-[1000] tracking-[-0.04em] mb-4 sm:mb-6 md:mb-8 uppercase italic leading-[0.85] md:leading-[0.78]">
            {t.heroTitleMain}{" "}
            <span className="text-[var(--color-accent-blue)]">{t.heroTitleSub}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-gray)] max-w-xl sm:max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
            {t.heroDesc}
          </p>
        </div>
      </section>

      <main className="grow px-4 sm:px-6 pb-16 sm:pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8">
          {platforms.map((platform) => (
            <section
              key={platform.key}
              className={`group relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] md:rounded-[3rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-5 sm:p-7 md:p-9 transition-all hover:border-[var(--color-accent-blue)] ${platform.glow}`}
            >
              <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all pointer-events-none">
                {platform.ghostIcon}
              </div>

              <div className="relative z-10 grid gap-6 lg:grid-cols-[0.95fr_1.6fr] lg:items-stretch">
                <div className="flex min-h-[260px] flex-col justify-between rounded-[1.4rem] sm:rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)]/45 p-5 sm:p-7">
                  <div>
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-6 rounded-2xl bg-gradient-to-br ${platform.accent} text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}
                    >
                      {platform.icon}
                    </div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-accent-blue)]">
                      <Users size={12} />
                      {platform.stat}
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-[1000] mb-4 uppercase italic tracking-tighter leading-none">
                      {platform.title}
                    </h2>
                    <p className="text-[var(--color-text-gray)] text-sm sm:text-base leading-relaxed font-medium">
                      {platform.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3 text-xs sm:text-sm font-black uppercase italic tracking-wider text-[var(--color-accent-blue)]">
                    {t.platformLabel} <ArrowRight size={16} strokeWidth={3} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {CREATORS[platform.key].map((creator) => (
                    <CreatorCard key={`${platform.key}-${creator.handle}`} creator={creator} lang={lang} t={t} />
                  ))}
                </div>
              </div>
            </section>
          ))}

          <section className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] md:rounded-[3rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-5 sm:p-7 md:p-9">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-pink-500">
                  <Music2 size={12} />
                  {t.videosLabel}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-[1000] uppercase italic tracking-tighter leading-none">
                  {t.featuredVideos}
                </h2>
              </div>
              <p className="max-w-xl text-sm sm:text-base leading-relaxed font-medium text-[var(--color-text-gray)]">
                {t.featuredVideosDesc}
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {TIKTOK_VIDEOS.map((video) => (
                <TikTokVideoCard key={`${video.author}-${video.titleEN}`} video={video} lang={lang} t={t} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border-sharp)] py-10 sm:py-12 md:py-16 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 sm:gap-12 mb-10 sm:mb-16">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center text-white font-black italic text-lg sm:text-xl shadow-lg shadow-blue-500/20">
                  S
                </div>
                <span className="font-[1000] text-xl sm:text-2xl tracking-tighter uppercase italic">
                  Subreel Studio
                </span>
              </div>
              <p className="text-[11px] uppercase opacity-50 font-bold tracking-[0.1em] leading-relaxed text-[var(--color-text-gray)]">
                {t.footerDisclaimer}
              </p>
            </div>

            <div className="flex items-center gap-6 sm:gap-10">
              <FooterLink icon={<MessageCircle size={16} />} label="Discord" href="https://discord.gg/t7bjdm9uDC" />
              <FooterLink icon={<Github size={16} />} label="GitHub" href="https://github.com/Lemansen/SubReelWeb" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-[var(--color-border-sharp)]/50">
            <div className="text-[10px] uppercase tracking-[0.4em] font-[1000] text-[var(--color-text-gray)] opacity-60">
              {t.footerSince}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-gray)] text-center sm:text-right">
              {t.footerCodeText}{" "}
              <a
                href="https://github.com/Lemansen/SubReelWeb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent-blue)] hover:underline decoration-2 underline-offset-4 transition-all"
              >
                {t.footerOpenSource}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CreatorCard({
  creator,
  lang,
  t,
}: {
  creator: Creator;
  lang: Lang;
  t: (typeof content)["RU"];
}) {
  return (
    <a
      href={creator.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/card flex min-h-[210px] flex-col justify-between rounded-[1.35rem] sm:rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)]/55 p-5 transition-all hover:-translate-y-1 hover:border-[var(--color-accent-blue)] hover:bg-[var(--color-panel-bg)]"
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[var(--color-accent-blue)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">
            {creator.followers}
          </span>
          <ExternalLink
            size={16}
            className="text-[var(--color-text-gray)] transition-transform group-hover/card:translate-x-1 group-hover/card:-translate-y-1"
          />
        </div>
        <h3 className="mb-2 text-xl font-[1000] uppercase italic tracking-tight">{creator.name}</h3>
        <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-accent-blue)]">
          {creator.handle}
        </p>
        <p className="text-sm font-medium leading-relaxed text-[var(--color-text-gray)]">
          {lang === "RU" ? creator.labelRU : creator.labelEN}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[11px] font-black uppercase italic tracking-widest text-[var(--color-accent-blue)]">
        {t.openProfile}
        <ArrowRight size={14} strokeWidth={3} />
      </div>
    </a>
  );
}

function TikTokVideoCard({
  video,
  lang,
  t,
}: {
  video: TikTokVideo;
  lang: Lang;
  t: (typeof content)["RU"];
}) {
  return (
    <a
      href={video.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/video relative flex min-h-[300px] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-[var(--color-border-sharp)] bg-zinc-950 p-5 text-white transition-all hover:-translate-y-1 hover:border-pink-400/70 hover:shadow-[0_30px_70px_-25px_rgba(236,72,153,0.55)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.25),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(236,72,153,0.25),transparent_28%)]" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
            {video.duration}
          </span>
          <Play className="text-pink-300 transition-transform group-hover/video:scale-110" size={22} fill="currentColor" />
        </div>

        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">{video.author}</p>
          <h3 className="mb-4 text-2xl font-[1000] uppercase italic leading-none tracking-tight">
            {lang === "RU" ? video.titleRU : video.titleEN}
          </h3>
          <div className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-widest text-white/65">
            <span>{video.views} views</span>
            <span className="inline-flex items-center gap-2 text-pink-200">
              {t.hint}
              <ArrowRight size={14} strokeWidth={3} />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function FooterLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-all group"
    >
      <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      {label}
    </a>
  );
}
