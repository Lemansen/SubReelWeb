"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Info,
  BookOpen,
  ArrowRight,
  Github,
  MessageCircle,
  Menu,
  X,
  Monitor,
  Smartphone,
  ShieldCheck,
  Gamepad2,
  Image as ImageIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const content = {
  RU: {
    about: "Про нас",
    hero_badge: "Лаборатория дизайна",
    hero_title_main: "Визуальные",
    hero_title_sub: "Концепты",
    hero_desc: "Галерея примеров и концепт-артов будущих интерфейсов экосистемы Subreel. Посмотрите, как всё будет выглядеть в финальном релизе.",
    
    // Карточка 1: Лаунчер
    concept_launcher_title: "Лаунчер",
    concept_launcher_desc: "Редизайн десктопного лаунчера с упором на минимализм, плавные анимации и удобный менеджер модов.",
    concept_launcher_badge: "В разработке",
    concept_launcher_action: "Смотреть макет",

    // Карточка 2: Клиент
    concept_client_title: "Игровой клиент",
    concept_client_desc: "Новое ядро игрового клиента с оптимизированным FPS, встроенными шейдерами и кастомным внутриигровым HUD интерфейсом.",
    concept_client_badge: "Утверждено",
    concept_client_action: "Смотреть макет",

    // Карточка 3: Мобилка
    concept_mobile_title: "Subreel Mobile",
    concept_mobile_desc: "Приложение-компаньон для общения с друзьями, проверки аукциона и получения пуш-уведомлений с сервера.",
    concept_mobile_badge: "Черновик",
    concept_mobile_action: "Смотреть макет",

    // Алерт при отсутствии ссылки
    alert_not_ready: "Этот концепт пока находится в разработке или в планах. Макет скоро появится!",

    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_wiki: "Вики",
    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Работаем с 2020 года",
    footer_open_source: "Open Source",
    footer_code_text: "Проект придерживается принципов",
    
    feature_auth: "Единая дизайн-система Subreel UI",
  },
  EN: {
    about: "About Us",
    hero_badge: "Design Laboratory",
    hero_title_main: "Visual",
    hero_title_sub: "Concepts",
    hero_desc: "A gallery of examples and concept art for future interfaces of the Subreel ecosystem. See what everything will look like in the final release.",
    
    // Card 1: Launcher
    concept_launcher_title: "Launcher",
    concept_launcher_desc: "Desktop launcher redesign focusing on minimalism, smooth animations, and a convenient mod manager.",
    concept_launcher_badge: "In Progress",
    concept_launcher_action: "View Mockup",

    // Card 2: Client
    concept_client_title: "Game Client",
    concept_client_desc: "Next-gen game client core featuring FPS optimization, built-in shaders, and custom in-game HUD layout.",
    concept_client_badge: "Approved",
    concept_client_action: "View Mockup",

    // Card 3: Mobile
    concept_mobile_title: "Subreel Mobile",
    concept_mobile_desc: "Companion app for chatting with friends, checking the auction house, and receiving server push notifications.",
    concept_mobile_badge: "Draft",
    concept_mobile_action: "View Mockup",

    // Alert when link is missing
    alert_not_ready: "This concept is currently under development or planned. The mockup will be available soon!",

    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_wiki: "Wiki",
    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
    footer_open_source: "Open Source",
    footer_code_text: "The project adheres to",

    feature_auth: "Unified Subreel UI Design System",
  },
};

const NAV_LINKS = (t: (typeof content)["RU"]) => [
  { name: t.nav_home, path: "/" },
  { name: t.nav_launcher, path: "/launcher" },
  { name: t.nav_server, path: "/server" },
  { name: t.nav_wiki, path: "/wiki" },
  { name: t.about, path: "/about" },
];

export default function ConceptsPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const t = content[lang];
  const navLinks = NAV_LINKS(t);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Массив конфигурации карточек со ссылками (href)
  const concepts = [
    {
      id: "launcher",
      title: t.concept_launcher_title,
      description: t.concept_launcher_desc,
      icon: <Monitor size={20} strokeWidth={2.5} />,
      badge: t.concept_launcher_badge,
      actionText: t.concept_launcher_action,
      href: "./concept/launcher", // <-- Сюда вставляйте ссылку
      popular: true,
      colorClass: "text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]/20",
    },
    {
      id: "client",
      title: t.concept_client_title,
      description: t.concept_client_desc,
      icon: <Gamepad2 size={20} strokeWidth={2.5} />,
      badge: t.concept_client_badge,
      actionText: t.concept_client_action,
      href: "", // <-- Оставь пустой для статуса "В разработке / В планах"
      popular: false,
      colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "mobile",
      title: t.concept_mobile_title,
      description: t.concept_mobile_desc,
      icon: <Smartphone size={20} strokeWidth={2.5} />,
      badge: t.concept_mobile_badge,
      actionText: t.concept_mobile_action,
      href: "", // <-- Оставь пустой для статуса "В разработке / В планах"
      popular: false,
      colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  // Обработчик нажатия на карточку
  const handleCardClick = (href: string) => {
    if (href && href.trim() !== "") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      alert(t.alert_not_ready);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors selection:bg-[var(--color-accent-blue)] selection:text-white relative">
      
      {/* Декоративные размытые сферы на фоне */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[var(--color-accent-blue)]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[140px] pointer-events-none" />

      {/* ── NAVBAR ── */}
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
      <section className="relative pt-12 sm:pt-20 md:pt-24 pb-10 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-[1000] uppercase tracking-[0.3em] mb-6 border border-[var(--color-accent-blue)]/20">
            {t.hero_badge}
          </div>

          <h1 className="text-[2.8rem] xs:text-[3.5rem] sm:text-6xl md:text-7xl lg:text-[7.5rem] font-[1000] tracking-[-0.04em] mb-4 uppercase italic leading-[0.85]">
            {t.hero_title_main}{" "}
            <span className="text-[var(--color-accent-blue)]">{t.hero_title_sub}</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[var(--color-text-gray)] max-w-xl sm:max-w-2xl mx-auto font-medium leading-relaxed opacity-80 mt-4">
            {t.hero_desc}
          </p>
        </div>
      </section>

      {/* ── СЕТКА КОНЦЕПТОВ (3 Карточки) ── */}
      <main className="grow px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {concepts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.href)}
              className={`group relative overflow-hidden rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-accent-blue)] hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.15)] flex flex-col justify-between min-h-[380px] cursor-pointer ${
                item.popular ? "border-[var(--color-accent-blue)]/40 bg-gradient-to-b from-[var(--color-accent-blue)]/[0.02] to-transparent" : ""
              }`}
            >
              {item.popular && (
                <div className="absolute top-4 right-4 bg-[var(--color-accent-blue)] text-black text-[9px] font-black tracking-widest px-2.5 py-1 rounded-bl-lg rounded-tr-sm uppercase z-10">
                  NEW
                </div>
              )}

              <div>
                {/* Заглушка для скриншота/изображения концепта */}
                <div className="w-full h-36 sm:h-44 rounded-xl bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] mb-6 flex flex-col items-center justify-center overflow-hidden relative group-hover:border-[var(--color-accent-blue)]/30 transition-colors">
                  <ImageIcon size={32} className="text-[var(--color-text-gray)] opacity-20 mb-2 group-hover:scale-110 transition-transform duration-500" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text-gray)] opacity-30">Image Placeholder</span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-gray)] px-2.5 py-1 rounded-md bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)]">
                    {item.badge}
                  </span>
                  <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${item.colorClass} bg-transparent border-none px-0`}>
                    {item.icon}
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-[1000] mb-2 uppercase italic tracking-tighter text-[var(--color-text)]">
                  {item.title}
                </h3>
                <p className="text-[var(--color-text-gray)] text-xs sm:text-sm leading-relaxed font-medium opacity-80 line-clamp-3">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border-sharp)]">
                <button className="w-full text-xs font-black uppercase tracking-wider text-[var(--color-text-gray)] flex items-center justify-between transition-colors group-hover:text-[var(--color-accent-blue)]">
                  {item.actionText}
                  <div className="w-8 h-8 rounded-full bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] flex items-center justify-center group-hover:border-[var(--color-accent-blue)] group-hover:bg-[var(--color-accent-blue)]/10 transition-colors">
                    <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Инфо-плашка снизу */}
        <div className="max-w-md mx-auto mt-12 flex justify-center items-center opacity-40">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-[var(--color-border-sharp)] px-4 py-2 rounded-full bg-[var(--color-panel-bg)]">
            <ShieldCheck size={16} className="text-[var(--color-accent-blue)]" />
            <span>{t.feature_auth}</span>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--color-border-sharp)] py-10 bg-[var(--color-bg)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10">
            <div className="flex flex-col gap-4 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg shadow-blue-500/20">
                  S
                </div>
                <span className="font-[1000] text-xl tracking-tighter uppercase italic">
                  Subreel Studio
                </span>
              </div>
              <p className="text-[11px] uppercase opacity-50 font-bold tracking-[0.1em] leading-relaxed text-[var(--color-text-gray)]">
                {t.footer_disclaimer}
              </p>
            </div>

            <div className="flex items-center gap-6 sm:gap-10">
              <FooterLink icon={<MessageCircle size={16} />} label="Discord" href="https://discord.gg/t7bjdm9uDC" />
              <FooterLink icon={<Github size={16} />} label="GitHub" href="https://github.com/Lemansen/SubReelWeb" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-[var(--color-border-sharp)]/50">
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