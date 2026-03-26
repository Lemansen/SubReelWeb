"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, Github, Heart, Menu, User, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileEntry } from "@/components/profile-entry";

export default function AboutPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const getGhAvatar = (username: string) => (username !== "#" ? `https://github.com/${username.split("/").pop()}.png` : null);

  const team = [
    {
      name: "Terrona",
      role: lang === "RU" ? "Основатель" : "Founder / Dev",
      about:
        lang === "RU"
          ? "Тот самый человек, который когда-то давно запустил первый сервер на Aternos и позвал друзей. Идейный вдохновитель, превративший ламповые посиделки в Subreel."
          : "The one who started it all with a simple Aternos server for friends. The visionary who turned chill hangouts into Subreel.",
      bannerColor: "bg-cyan-600",
      github: "https://github.com/Terrona",
    },
    {
      name: "Lemansen",
      role: lang === "RU" ? "Разработчик SubReelLauncher" : "Developer of SubReelLauncher",
      about:
        lang === "RU"
          ? "Архитектура лаунчера, логика работы с API Modrinth/Curse и общая концепция."
          : "Launcher architecture, Modrinth/Curse API logic, and general concept.",
      bannerColor: "bg-blue-600",
      github: "https://github.com/lemansen",
    },
    {
      name: "User 3",
      role: lang === "RU" ? "Дизайнер" : "UI/UX Designer",
      about:
        lang === "RU"
          ? "Создание визуального стиля Subreel Studio, дизайн интерфейсов сайта и лаунчера."
          : "Creating visual style, designing site and launcher interfaces.",
      bannerColor: "bg-purple-600",
      github: "#",
    },
    {
      name: "User 4",
      role: lang === "RU" ? "Тех. Администратор" : "Tech Admin",
      about:
        lang === "RU"
          ? "Оптимизация серверной части, работа с базами данных и поддержка стабильности."
          : "Backend optimization, database management, and stability maintenance.",
      bannerColor: "bg-orange-600",
      github: "#",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-16 py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 md:gap-6 w-auto md:w-1/3 min-w-0">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors">
              <ChevronLeft size={16} strokeWidth={3} /> {lang === "RU" ? "Назад" : "Back"}
            </button>
            <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] hidden md:block">
              Subreel
            </Link>
          </div>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 md:gap-8">
            <Link href="/" className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-all py-2">
              {lang === "RU" ? "Главная" : "Home"}
            </Link>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)] py-2 relative">
              {lang === "RU" ? "Про нас" : "About"}
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />
            </span>
          </div>

          <div className="hidden md:flex items-center justify-end gap-3 w-1/3 ml-auto">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)]">
              <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-xs font-black uppercase transition-colors">
                {lang}
              </button>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] opacity-50" />
              <ThemeToggle className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] transition-colors" />
            </div>
            <ProfileEntry profileLabel="Профиль" loginLabel="Войти" pendingLabel="Профиль" />
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
                  {lang === "RU" ? "Главная" : "Home"}
                </Link>
                <Link href="/launcher" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {lang === "RU" ? "Лаунчер" : "Launcher"}
                </Link>
                <Link href="/server" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {lang === "RU" ? "Сервер" : "Server"}
                </Link>
                <Link href="/mobile" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {lang === "RU" ? "Мобильное" : "Mobile"}
                </Link>
                <Link href="/wiki" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)] flex items-center gap-2">
                  <BookOpen size={16} />
                  {lang === "RU" ? "Вики" : "Wiki"}
                </Link>
                <ProfileEntry profileLabel={lang === "RU" ? "Профиль" : "Profile"} loginLabel={lang === "RU" ? "Войти" : "Login"} pendingLabel={lang === "RU" ? "Профиль" : "Profile"} mobile onNavigate={() => setMobileMenuOpen(false)} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
                <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
                  {lang}
                </button>
                <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] transition-colors" />
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="relative pt-16 md:pt-24 pb-16 md:pb-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl md:text-9xl font-[1000] tracking-[-0.04em] mb-6 md:mb-8 uppercase italic leading-[0.88] md:leading-[0.8]">
            Subreel <span className="text-[var(--color-accent-blue)]">Studio</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-gray)] max-w-2xl mx-auto font-medium leading-relaxed">
            {lang === "RU" ? "Мы создаем инструменты и игровые миры, в которые хотели бы играть сами." : "We create tools and game worlds we’d want to play ourselves."}
          </p>
        </div>
      </section>

      <main className="grow px-4 md:px-6 pb-20 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter">{lang === "RU" ? "Наша команда" : "Our Team"}</h2>
            <div className="h-px grow bg-[var(--color-border-sharp)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, idx) => {
              const avatarUrl = getGhAvatar(member.github);
              return (
                <div key={idx} className="group bg-[var(--color-card-bg)] border border-[var(--color-border-sharp)] rounded-[2rem] overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500">
                  <div className={`h-20 w-full ${member.bannerColor} relative`} />
                  <div className="px-6 pb-6 relative flex flex-col grow">
                    <div className="relative -mt-10 mb-4">
                      <div className="w-20 h-20 rounded-full bg-[var(--color-card-bg)] p-1.5">
                        <div className="w-full h-full rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-border-sharp)] overflow-hidden flex items-center justify-center group-hover:border-[var(--color-accent-blue)] transition-colors">
                          {avatarUrl ? <Image src={avatarUrl} alt={member.name} width={80} height={80} className="w-full h-full object-cover" /> : <User size={32} className="opacity-20" />}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-2xl font-[1000] uppercase italic tracking-tighter leading-none">{member.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent-blue)] mt-1">{member.role}</p>
                    </div>

                    <div className="bg-[var(--color-bg)]/50 border border-[var(--color-border-sharp)] rounded-xl p-4 grow">
                      <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)] mb-2 opacity-50">{lang === "RU" ? "ДЕЯТЕЛЬНОСТЬ" : "ACTIVITY"}</div>
                      <p className="text-sm text-[var(--color-text-gray)] font-medium leading-snug group-hover:text-[var(--color-text)] transition-colors">{member.about}</p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <a
                        href={member.github}
                        target={member.github === "#" ? undefined : "_blank"}
                        rel={member.github === "#" ? undefined : "noopener noreferrer"}
                        className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors"
                      >
                        <Github size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-24 grid md:grid-cols-2 gap-12 items-center bg-[var(--color-panel-bg)] rounded-[2.25rem] md:rounded-[3rem] p-7 md:p-12 border border-[var(--color-border-sharp)]">
            <div>
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <Heart size={24} strokeWidth={3} />
              </div>
              <h2 className="text-3xl md:text-4xl font-[1000] uppercase italic tracking-tighter mb-6">{lang === "RU" ? "Почему мы это делаем?" : "Why we do it?"}</h2>
              <p className="text-[var(--color-text-gray)] text-lg leading-relaxed font-medium">
                {lang === "RU"
                  ? "С 2020 года мы прошли путь от маленького сервера до разработки собственного софта. Наша цель — сделать игровой процесс максимально бесшовным и приятным для каждого."
                  : "Since 2020, we have evolved from a small server to developing our own software. Our goal is to make the gameplay as seamless and enjoyable as possible for everyone."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--color-bg)] p-6 rounded-2xl border border-[var(--color-border-sharp)] text-center">
                <div className="text-3xl font-[1000] text-[var(--color-accent-blue)] mb-1">4+</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{lang === "RU" ? "Года опыта" : "Years exp"}</div>
              </div>
              <div className="bg-[var(--color-bg)] p-6 rounded-2xl border border-[var(--color-border-sharp)] text-center">
                <div className="text-3xl font-[1000] text-[var(--color-accent-blue)] mb-1">100%</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Open Source</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-[var(--color-border-sharp)] text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] font-black text-[var(--color-text-gray)] opacity-60">Subreel Studio • {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
