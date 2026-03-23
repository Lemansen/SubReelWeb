"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ArrowRight, BookOpen, MessageCircle, Sparkles, Workflow, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const content = {
  RU: {
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_back: "Назад",
    nav_wiki: "Вики",
    title: "Мобильное приложение",
    subtitle:
      "Отдельное приложение для общения сообщества Subreel. Хотим сделать удобный мессенджер с живыми чатами, новостями и понятной логикой взаимодействия.",
    badge: "Мессенджер",
    section_title: "Что внутри сейчас",
    planning: "В планах",
    planning_desc:
      "Продумываем общий формат приложения, базовые сценарии общения и то, как оно будет связано с экосистемой проекта.",
    development: "Разработка",
    development_desc:
      "Собираем визуальное направление, экранную структуру и первые технические решения для будущего мобильного клиента.",
    logic: "Придумывание логики",
    logic_desc:
      "Прорабатываем поведение чатов, статусов, уведомлений, ролей и связи между игроками внутри приложения.",
  },
  EN: {
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_back: "Back",
    nav_wiki: "Wiki",
    title: "Mobile App",
    subtitle:
      "A separate app for the Subreel community. We want a convenient messenger with live chats, updates, and clear interaction logic.",
    badge: "Messenger",
    section_title: "Current Focus",
    planning: "Planned",
    planning_desc:
      "We are shaping the overall app direction, core communication scenarios, and how it should connect to the rest of the project.",
    development: "Development",
    development_desc:
      "We are building the visual direction, screen structure, and first technical decisions for the future mobile client.",
    logic: "Designing Logic",
    logic_desc:
      "We are working through chat behavior, statuses, notifications, roles, and how players will interact inside the app.",
  },
};

export default function MobilePage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = content[lang];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
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

          <div className="hidden md:flex order-3 md:order-none w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 items-center justify-center gap-3 md:gap-8 overflow-x-auto">
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
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${
                    isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
                  }`}
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
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase transition-colors group"
              >
                <BookOpen size={14} className="text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)] transition-colors" />
                <span className="hidden sm:block text-[var(--color-text-gray)] group-hover:text-[var(--color-text)] transition-colors">{t.nav_wiki}</span>
              </Link>

              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />

              <button
                onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                className="px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors"
              >
                {lang}
              </button>

              <ThemeToggle className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
            </div>
          </div>

          <div className="md:hidden ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden order-4 w-full rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-3 shadow-lg">
              <div className="grid gap-2">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {t.nav_home}
                </Link>
                <Link href="/launcher" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {t.nav_launcher}
                </Link>
                <Link href="/server" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {t.nav_server}
                </Link>
                <Link href="/wiki" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {t.nav_wiki}
                </Link>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
                <button
                  onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
                  className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]"
                >
                  {lang}
                </button>
                <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="grow px-4 md:px-6 py-12 md:py-24">
        <div className="max-w-6xl mx-auto space-y-16">
          <section className="relative overflow-hidden rounded-[2.25rem] md:rounded-[3rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,var(--color-card-bg),var(--color-panel-bg))] p-7 md:p-14">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <MessageCircle size={220} strokeWidth={1} />
            </div>

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)] mb-8">
                <MessageCircle size={14} />
                {t.badge}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-[1000] uppercase italic tracking-tighter leading-[0.95] md:leading-[0.9] mb-6 md:mb-8">
                {t.title}
              </h1>

              <p className="text-lg md:text-xl text-[var(--color-text-gray)] leading-relaxed font-medium max-w-2xl">
                {t.subtitle}
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter">{t.section_title}</h2>
              <div className="h-px grow bg-[var(--color-border-sharp)]" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <MobileStage
                icon={<Sparkles size={24} />}
                title={t.planning}
                desc={t.planning_desc}
                accent="blue"
              />
              <MobileStage
                icon={<MessageCircle size={24} />}
                title={t.development}
                desc={t.development_desc}
                accent="emerald"
              />
              <MobileStage
                icon={<Workflow size={24} />}
                title={t.logic}
                desc={t.logic_desc}
                accent="orange"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function MobileStage({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: "blue" | "emerald" | "orange";
}) {
  const styles = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  };

  return (
    <article className="rounded-[2rem] md:rounded-[2.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-6 md:p-10">
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-8 ${styles[accent]}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-[1000] uppercase italic tracking-tight mb-4">{title}</h3>
      <p className="text-[var(--color-text-gray)] text-base leading-relaxed font-medium">{desc}</p>
      <div className="mt-8 flex items-center gap-2 text-[var(--color-accent-blue)] text-sm font-black uppercase italic tracking-wide">
        Subreel <ArrowRight size={16} strokeWidth={3} />
      </div>
    </article>
  );
}
