"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Github, Heart, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// ... (начало файла без изменений)

export default function AboutPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const router = useRouter();

  // Функция для получения аватарки из GitHub
  // Если ника не указано, возвращаем null для отображения стандартной иконки User
  const getGhAvatar = (username: string) => 
    username !== "#" ? `https://github.com/${username.split('/').pop()}.png` : null;

  const team = [
    {
      name: "Terrona",
      role: lang === "RU" ? "Основатель" : "Founder / Dev",
      about: lang === "RU" 
        ? "Тот самый человек, который когда-то давно запустил первый сервер на Aternos и позвал друзей. Идейный вдохновитель, превративший ламповые посиделки в Subreel." 
        : "The one who started it all with a simple Aternos server for friends. The visionary who turned chill hangouts into Subreel.",
      bannerColor: "bg-cyan-600",
      github: "https://github.com/Terrona"
    },
    {
      name: "Lemansen",
      role: lang === "RU" ? "Разработчик SubReelLauncher" : "Developer of SubReelLauncher",
      about: lang === "RU" 
        ? "Архитектура лаунчера, логика работы с API Modrinth/Curse и общая концепция." 
        : "Launcher architecture, Modrinth/Curse API logic, and general concept.",
      bannerColor: "bg-blue-600",
      github: "https://github.com/lemansen"
    },
    {
      name: "User 3",
      role: lang === "RU" ? "Дизайнер" : "UI/UX Designer",
      about: lang === "RU" 
        ? "Создание визуального стиля Subreel Studio, дизайн интерфейсов сайта и лаунчера." 
        : "Creating visual style, designing site and launcher interfaces.",
      bannerColor: "bg-purple-600",
      github: "#"
    },
    {
      name: "User 4",
      role: lang === "RU" ? "Тех. Администратор" : "Tech Admin",
      about: lang === "RU" 
        ? "Оптимизация серверной части, работа с базами данных и поддержка стабильности." 
        : "Backend optimization, database management, and stability maintenance.",
      bannerColor: "bg-orange-600",
      github: "#"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      
      {/* NAVBAR */}
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-6 w-1/3">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors">
              <ChevronLeft size={16} strokeWidth={3} /> {lang === "RU" ? "Назад" : "Back"}
            </button>
                        <Link href="/" className="text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] hidden md:block">
                          Subreel
                        </Link>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-8">
            <Link href="/" className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-all py-2">
              {lang === "RU" ? "Главная" : "Home"}
            </Link>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)] py-2 relative">
              {lang === "RU" ? "Про нас" : "About"}
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 w-1/3">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)]">
              <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-xs font-black uppercase transition-colors">{lang}</button>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] opacity-50" />
              <ThemeToggle className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] transition-colors" />
            </div>
          </div>
        </div>
      </nav>


      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05]" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-9xl font-[1000] tracking-[-0.04em] mb-8 uppercase italic leading-[0.8]">
            Subreel <span className="text-[var(--color-accent-blue)]">Studio</span>
          </h1>
          <p className="text-xl text-[var(--color-text-gray)] max-w-2xl mx-auto font-medium leading-relaxed">
            {lang === "RU" 
              ? "Мы создаем инструменты и игровые миры, в которые хотели бы играть сами."
              : "We create tools and game worlds we’d want to play ourselves."}
          </p>
        </div>
      </section>

      {/* TEAM GRID */}
      <main className="grow px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-[1000] uppercase italic tracking-tighter">
              {lang === "RU" ? "Наша команда" : "Our Team"}
            </h2>
            <div className="h-px grow bg-[var(--color-border-sharp)]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, idx) => {
              const avatarUrl = getGhAvatar(member.github); // Динамическая ссылка
              
              return (
                <div key={idx} className="group bg-[var(--color-card-bg)] border border-[var(--color-border-sharp)] rounded-[2rem] overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500">
                  <div className={`h-20 w-full ${member.bannerColor} relative`} />
                  
                  <div className="px-6 pb-6 relative flex flex-col grow">
                    <div className="relative -mt-10 mb-4">
                      <div className="w-20 h-20 rounded-full bg-[var(--color-card-bg)] p-1.5">
                        <div className="w-full h-full rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-border-sharp)] overflow-hidden flex items-center justify-center group-hover:border-[var(--color-accent-blue)] transition-colors">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={member.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={32} className="opacity-20" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-2xl font-[1000] uppercase italic tracking-tighter leading-none">{member.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent-blue)] mt-1">
                        {member.role}
                      </p>
                    </div>

                    <div className="bg-[var(--color-bg)]/50 border border-[var(--color-border-sharp)] rounded-xl p-4 grow">
                      <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-gray)] mb-2 opacity-50">
                        {lang === "RU" ? "ДЕЯТЕЛЬНОСТЬ" : "ACTIVITY"}
                      </div>
                      <p className="text-sm text-[var(--color-text-gray)] font-medium leading-snug group-hover:text-[var(--color-text)] transition-colors">
                        {member.about}
                      </p>
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

          {/* Идеология / Миссия */}
          <div className="mt-24 grid md:grid-cols-2 gap-12 items-center bg-[var(--color-panel-bg)] rounded-[3rem] p-12 border border-[var(--color-border-sharp)]">
            <div>
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <Heart size={24} strokeWidth={3} />
              </div>
              <h2 className="text-4xl font-[1000] uppercase italic tracking-tighter mb-6">
                {lang === "RU" ? "Почему мы это делаем?" : "Why we do it?"}
              </h2>
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
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{lang === "RU" ? "Open Source" : "Open Source"}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-[var(--color-border-sharp)] text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] font-black text-[var(--color-text-gray)] opacity-60">
          Subreel Studio • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
