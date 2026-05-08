"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  LayoutGrid,
  Info,
  BookOpen,
  ArrowRight,
  Github,
  MessageCircle,
  Menu,
  X,
  Tv2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const content = {
  RU: {
    about: "Про нас",
    hero_badge: "Игровая экосистема",
    hero_title_main: "Subreel",
    hero_title_sub: "Studio",
    hero_desc:
      "Разрабатываем инструменты и инфраструктуру для комфортной игры. Мы создаем среду, где технологии расширяют возможности Minecraft.",
    launcher_title: "Subreel Launcher",
    launcher_desc:
      "Собственный софт для управления сборками. Автоматическая установка модов, проверка файлов и высокая скорость загрузки.",
    server_title: "Сервер",
    server_desc:
      "Приватный сервер с уникальными механиками, стабильным TPS и активным комьюнити. Место, где начинается твоя история.",
    mobile_title: "Мобильное приложение",
    mobile_desc:
      "Мессенджер для сообщества Subreel, где будут чат, новости и удобная связь между игроками.",
    hint: "Подробнее",
    mobile_badge: "В разработке",
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_wiki: "Вики",
    footer_disclaimer:
      "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Работаем с 2020 года",
    footer_open_source: "Open Source",
    footer_code_text: "Проект придерживается принципов",
    fun_title: "Развлечения",
    fun_desc: "Ивенты, турниры и стримы от комьюнити Subreel. Следи за анонсами и не пропусти живой контент.",
    fun_badge_events: "Ивенты",
    fun_badge_streams: "Стримы",
  },
  EN: {
    about: "About Us",
    hero_badge: "Gaming Ecosystem",
    hero_title_main: "Subreel",
    hero_title_sub: "Studio",
    hero_desc:
      "Developing tools and infrastructure for seamless gameplay. We build an environment where technology enhances the Minecraft experience.",
    launcher_title: "Launcher",
    launcher_desc:
      "Custom software for build management. Automatic mod installation, file verification, and high download speeds.",
    server_title: "Server",
    server_desc:
      "A private server with unique mechanics, stable TPS, and an active community. The place where your story begins.",
    mobile_title: "Mobile App",
    mobile_desc:
      "A community messenger for Subreel with chat, updates, and easier communication between players.",
    hint: "Learn more",
    mobile_badge: "In Development",
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_wiki: "Wiki",
    footer_disclaimer:
      "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
    footer_open_source: "Open Source",
    footer_code_text: "The project adheres to",
    fun_title: "Entertainment",
    fun_desc: "Events, tournaments, and streams from the Subreel community. Stay tuned for announcements and live content.",
    fun_badge_events: "Events",
    fun_badge_streams: "Streams",
  },
};

const NAV_LINKS = (t: (typeof content)["RU"]) => [
  { name: t.nav_home, path: "/" },
  { name: t.nav_launcher, path: "/launcher" },
  { name: t.nav_server, path: "/server" },
  { name: t.nav_wiki, path: "/wiki" },
  { name: t.about, path: "/about" },
];

export default function Home() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const t = content[lang];
  const navLinks = NAV_LINKS(t);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors selection:bg-[var(--color-accent-blue)] selection:text-white">

      {/* ── NAVBAR ── */}
      <nav
        ref={menuRef}
        className="sticky top-0 z-50 border-b border-[var(--color-border-sharp)] bg-[var(--color-bg)]/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] shrink-0"
          >
            Subreel
          </Link>

          {/* Desktop nav links — центр */}
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

          {/* Desktop right controls */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-xl p-1">
              <Link
                href="/wiki"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel-hover)] transition-colors group"
              >
                <BookOpen size={14} className="group-hover:text-[var(--color-accent-blue)] transition-colors" />
                {t.nav_wiki}
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

          {/* Mobile right: lang + theme + burger */}
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
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]"
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
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

      {/* ── HERO ── */}
      <section className="relative pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-20 md:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-[1000] uppercase tracking-[0.3em] mb-6 sm:mb-8 border border-[var(--color-accent-blue)]/20">
            {t.hero_badge}
          </div>

          <h1 className="text-[3rem] xs:text-[3.5rem] sm:text-7xl md:text-8xl lg:text-[10rem] font-[1000] tracking-[-0.04em] mb-4 sm:mb-6 md:mb-8 uppercase italic leading-[0.85] md:leading-[0.78]">
            {t.hero_title_main}{" "}
            <span className="text-[var(--color-accent-blue)]">{t.hero_title_sub}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-gray)] max-w-xl sm:max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
            {t.hero_desc}
          </p>
        </div>
      </section>

      {/* ── CARDS ── */}
      <main className="grow px-4 sm:px-6 pb-16 sm:pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">

          {/* Launcher */}
          <Link
            href="/launcher"
            className="group relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] md:rounded-[3rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-6 sm:p-8 md:p-12 transition-all hover:border-[var(--color-accent-blue)] hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2)] flex flex-col justify-between min-h-[280px] sm:min-h-[360px] md:min-h-[420px]"
          >
            <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all pointer-events-none">
              <Download size={140} strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-6 sm:mb-8 md:mb-10 rounded-2xl bg-[var(--color-accent-blue)] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                <Download size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-[1000] mb-3 sm:mb-4 md:mb-6 uppercase italic tracking-tighter leading-none">
                {t.launcher_title}
              </h2>
              <p className="text-[var(--color-text-gray)] text-sm sm:text-base md:text-lg leading-relaxed font-medium max-w-[300px]">
                {t.launcher_desc}
              </p>
            </div>

            <div className="relative z-10 mt-6 sm:mt-8 flex items-center gap-3 text-xs sm:text-sm font-black uppercase italic tracking-wider text-[var(--color-accent-blue)] group-hover:translate-x-2 transition-transform">
              {t.hint} <ArrowRight size={16} strokeWidth={3} />
            </div>
          </Link>

          {/* Server */}
          <Link
            href="/server"
            className="group relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] md:rounded-[3rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-6 sm:p-8 md:p-12 transition-all hover:border-[var(--color-accent-blue)] hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2)] flex flex-col justify-between min-h-[280px] sm:min-h-[360px] md:min-h-[420px]"
          >
            <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all pointer-events-none">
              <LayoutGrid size={140} strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-6 sm:mb-8 md:mb-10 rounded-2xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center border border-[var(--color-accent-blue)]/20 group-hover:-rotate-6 transition-transform">
                <LayoutGrid size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-[1000] mb-3 sm:mb-4 md:mb-6 uppercase italic tracking-tighter leading-none">
                {t.server_title}
              </h2>
              <p className="text-[var(--color-text-gray)] text-sm sm:text-base md:text-lg leading-relaxed font-medium max-w-[300px]">
                {t.server_desc}
              </p>
            </div>

            <div className="relative z-10 mt-6 sm:mt-8 flex items-center gap-3 text-xs sm:text-sm font-black uppercase italic tracking-wider text-[var(--color-accent-blue)] group-hover:translate-x-2 transition-transform">
              {t.hint} <ArrowRight size={16} strokeWidth={3} />
            </div>
          </Link>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--color-border-sharp)] py-10 sm:py-12 md:py-16 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 sm:gap-12 mb-10 sm:mb-16">

            {/* Brand */}
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
                {t.footer_disclaimer}
              </p>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-6 sm:gap-10">
              <FooterLink icon={<MessageCircle size={16} />} label="Discord" href="https://discord.gg/t7bjdm9uDC" />
              <FooterLink icon={<Github size={16} />} label="GitHub" href="https://github.com/Lemansen/SubReelWeb" />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-[var(--color-border-sharp)]/50">
            <div className="text-[10px] uppercase tracking-[0.4em] font-[1000] text-[var(--color-text-gray)] opacity-60">
              {t.footer_since}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-gray)] text-center sm:text-right">
              {t.footer_code_text}{" "}
              <a
                href="https://github.com/Lemansen/SubReelWeb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent-blue)] hover:underline decoration-2 underline-offset-4 transition-all"
              >
                {t.footer_open_source}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
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
      <span className="opacity-60 group-hover:opacity-100 transition-opacity">
        {icon}
      </span>
      {label}
    </a>
  );
}