"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  Github,
  Menu,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const content = {
  RU: {
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_mobile: "Мобильное",
    nav_back: "Назад",
    nav_wiki: "Вики",
    title: "Мобильное приложение",
    subtitle:
      "Отдельное приложение для сообщества Subreel. Хотим сделать удобный мессенджер с живыми чатами, новостями, ролями и понятной логикой взаимодействия.",
    badge: "Мессенджер",
    section_title: "Текущий этап",
    stage_title: "В планах, разработке и проработке логики",
    stage_desc:
      "Сейчас мы одновременно формируем идею приложения, собираем визуальное направление и продумываем логику общения, ролей, уведомлений и связей между игроками внутри мобильного пространства Subreel.",
    preview_title: "Что хотим получить",
    preview_desc:
      "Приложение должно быть не просто чатом, а удобной точкой входа в комьюнити: общение, новости, ивенты и важные сигналы в одном месте.",
    feature_chat: "Живые чаты",
    feature_chat_desc: "Личные и общие каналы для игроков, команд и сообщества.",
    feature_alerts: "Умные уведомления",
    feature_alerts_desc: "Пинги о новостях, ответах, важных событиях и онлайн-активности.",
    feature_identity: "Привязка к проекту",
    feature_identity_desc: "Роли, статусы и понятная логика взаимодействия внутри Subreel.",
    audience_title: "Для кого это",
    audience_desc:
      "Приложение делается для игроков, участников комьюнити и тех, кто хочет быть ближе к проекту даже вне игры.",
    audience_players: "Игроки",
    audience_players_desc: "Быстрая связь, общие чаты и важные обновления по проекту.",
    audience_team: "Команда",
    audience_team_desc: "Удобная коммуникация, организация каналов и понятное разделение ролей.",
    audience_community: "Комьюнити",
    audience_community_desc: "Новости, анонсы, обсуждения и вовлечённость в одном мобильном пространстве.",
    cta_title: "Страница ещё будет расти",
    cta_desc:
      "Мы не останавливаемся на этом описании. Со временем здесь могут появиться экранные концепты, схемы логики и новые идеи по продукту.",
    cta_btn: "Открыть GitHub",
    footer_since: "Subreel Studio • Mobile Concept",
  },
  EN: {
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_mobile: "Mobile",
    nav_back: "Back",
    nav_wiki: "Wiki",
    title: "Mobile App",
    subtitle:
      "A separate app for the Subreel community. We want a convenient messenger with live chats, updates, roles, and clear interaction logic.",
    badge: "Messenger",
    section_title: "Current Stage",
    stage_title: "Planning, development, and logic design together",
    stage_desc:
      "Right now we are shaping the app concept, building its visual direction, and designing the logic of chats, roles, notifications, and interaction inside the Subreel mobile space at the same time.",
    preview_title: "What We Want to Build",
    preview_desc:
      "The app should be more than just a chat. It should become a clean entry point into the community: communication, updates, events, and important signals in one place.",
    feature_chat: "Live Chats",
    feature_chat_desc: "Private and shared channels for players, teams, and the community.",
    feature_alerts: "Smart Alerts",
    feature_alerts_desc: "Pings about updates, replies, important events, and community activity.",
    feature_identity: "Project Identity",
    feature_identity_desc: "Roles, statuses, and a clearer interaction model inside Subreel.",
    audience_title: "Who It Is For",
    audience_desc:
      "The app is being designed for players, the team, and everyone who wants to stay close to the project even outside the game.",
    audience_players: "Players",
    audience_players_desc: "Fast communication, shared chats, and important project updates.",
    audience_team: "Team",
    audience_team_desc: "Better communication, channel structure, and role separation.",
    audience_community: "Community",
    audience_community_desc: "Updates, announcements, discussions, and stronger involvement in one mobile space.",
    cta_title: "This Page Will Keep Growing",
    cta_desc:
      "We are not stopping at this overview. Over time, this page can include screen concepts, logic demos, and new product ideas.",
    cta_btn: "Open GitHub",
    footer_since: "Subreel Studio • Mobile Concept",
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

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 md:gap-8">
            {[
              { name: t.nav_home, path: "/" },
              { name: t.nav_launcher, path: "/launcher" },
              { name: t.nav_server, path: "/server" },
              { name: t.nav_mobile, path: "/mobile" },
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
                <Link href="/mobile" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {t.nav_mobile}
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
            <StageCard title={t.stage_title} desc={t.stage_desc} />
          </section>

          <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-8 items-stretch">
            <div className="rounded-[2rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-6 md:p-10">
              <div className="w-14 h-14 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8">
                <Smartphone size={26} />
              </div>
              <h2 className="text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter mb-5">{t.preview_title}</h2>
              <p className="text-[var(--color-text-gray)] text-base md:text-lg leading-relaxed font-medium mb-8">{t.preview_desc}</p>
              <div className="grid gap-4">
                <FeatureLine icon={<MessageCircle size={18} />} title={t.feature_chat} desc={t.feature_chat_desc} />
                <FeatureLine icon={<Bell size={18} />} title={t.feature_alerts} desc={t.feature_alerts_desc} />
                <FeatureLine icon={<ShieldCheck size={18} />} title={t.feature_identity} desc={t.feature_identity_desc} />
              </div>
            </div>

            <div className="rounded-[2rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(180deg,var(--color-panel-bg),var(--color-card-bg))] p-5 md:p-8 flex items-center justify-center">
              <div className="w-full max-w-[320px] rounded-[2.5rem] border border-[var(--color-border-sharp)] bg-[#0c1018] p-4 shadow-2xl">
                <div className="rounded-[2rem] border border-white/10 bg-[#121826] p-4 text-white">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] opacity-50">Subreel Mobile</div>
                      <div className="text-xl font-black italic tracking-tight mt-1">Community Chat</div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <MessageCircle size={18} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <PhoneBubble side="left" title="Новости" text="Анонс ивента сегодня в 20:00" />
                    <PhoneBubble side="right" title="Команда" text="Нужно собрать удобную логику ролей и уведомлений." />
                    <PhoneBubble side="left" title="Игроки" text="Хочется быстрый чат и понятные оповещения." />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] md:rounded-[2.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 md:p-10">
            <div className="max-w-3xl mb-8">
              <h2 className="text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter mb-4">{t.audience_title}</h2>
              <p className="text-[var(--color-text-gray)] text-base md:text-lg leading-relaxed font-medium">{t.audience_desc}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <AudienceCard icon={<Users size={22} />} title={t.audience_players} desc={t.audience_players_desc} />
              <AudienceCard icon={<Workflow size={22} />} title={t.audience_team} desc={t.audience_team_desc} />
              <AudienceCard icon={<Sparkles size={22} />} title={t.audience_community} desc={t.audience_community_desc} />
            </div>
          </section>

          <section className="rounded-[2rem] md:rounded-[2.75rem] bg-[var(--color-accent-blue)] text-white p-6 md:p-10 flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between shadow-[0_20px_50px_-15px_rgba(59,130,246,0.4)]">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter mb-4">{t.cta_title}</h2>
              <p className="text-blue-100 text-base md:text-lg leading-relaxed font-medium">{t.cta_desc}</p>
            </div>
            <a
              href="https://github.com/Lemansen/SubReelWeb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-[1.5rem] bg-white px-7 py-4 text-blue-600 font-black uppercase italic tracking-wide transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Github size={18} />
              {t.cta_btn}
            </a>
          </section>
        </div>
      </main>

      <footer className="py-10 border-t border-[var(--color-border-sharp)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.32em] font-black text-[var(--color-text-gray)] opacity-60">{t.footer_since}</p>
        </div>
      </footer>
    </div>
  );
}

function StageCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <article className="rounded-[2rem] md:rounded-[2.5rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(135deg,var(--color-card-bg),var(--color-panel-bg))] p-6 md:p-10">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl border border-[var(--color-accent-blue)]/20 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center">
          <Sparkles size={22} />
        </div>
        <div className="w-12 h-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <MessageCircle size={22} />
        </div>
        <div className="w-12 h-12 rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500 flex items-center justify-center">
          <Workflow size={22} />
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-[1000] uppercase italic tracking-tight mb-4">{title}</h3>
      <p className="text-[var(--color-text-gray)] text-base md:text-lg leading-relaxed font-medium max-w-4xl">{desc}</p>
    </article>
  );
}

function FeatureLine({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-4 md:p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <h3 className="text-lg font-[1000] uppercase italic tracking-tight mb-1">{title}</h3>
          <p className="text-sm md:text-base text-[var(--color-text-gray)] leading-relaxed font-medium">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function PhoneBubble({
  side,
  title,
  text,
}: {
  side: "left" | "right";
  title: string;
  text: string;
}) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${side === "right" ? "bg-blue-500 text-white" : "bg-white/6 text-white border border-white/10"}`}>
        <div className="text-[10px] uppercase tracking-[0.18em] opacity-60 mb-1">{title}</div>
        <div className="text-sm leading-relaxed font-medium">{text}</div>
      </div>
    </div>
  );
}

function AudienceCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5 md:p-6">
      <div className="w-11 h-11 rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center mb-5">{icon}</div>
      <h3 className="text-xl font-[1000] uppercase italic tracking-tight mb-3">{title}</h3>
      <p className="text-sm md:text-base text-[var(--color-text-gray)] leading-relaxed font-medium">{desc}</p>
    </article>
  );
}
