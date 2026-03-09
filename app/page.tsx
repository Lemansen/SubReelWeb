"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Download, LayoutGrid, Info, ArrowRight, Github, MessageCircle } from "lucide-react";

const content = {
  RU: {
    about: "Про нас",
    hero_badge: "Игровая экосистема",
    hero_title_main: "Subreel",
    hero_title_sub: "Studio",
    hero_desc: "Разрабатываем инструменты и инфраструктуру для комфортной игры. Мы создаем среду, где технологии расширяют возможности Minecraft.",
    launcher_title: "Subreel Launcher",
    launcher_desc: "Собственный софт для управления сборками. Автоматическая установка модов, проверка файлов и высокая скорость загрузки.",
    server_title: "Сервер",
    server_desc: "Приватный сервер с уникальными механиками, стабильным TPS и активным комьюнити. Место, где начинается твоя история.",
    hint: "Подробнее",
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Работаем с 2020 года",
    footer_open_source: "Open Source",
    footer_code_text: "Проект придерживается принципов",
  },
  EN: {
    about: "About Us",
    hero_badge: "Gaming Ecosystem",
    hero_title_main: "Subreel",
    hero_title_sub: "Studio",
    hero_desc: "Developing tools and infrastructure for seamless gameplay. We build an environment where technology enhances the Minecraft experience.",
    launcher_title: "Launcher",
    launcher_desc: "Custom software for build management. Automatic mod installation, file verification, and high download speeds.",
    server_title: "Server",
    server_desc: "A private server with unique mechanics, stable TPS, and an active community. The place where your story begins.",
    hint: "Learn more",
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
    footer_open_source: "Open Source",
    footer_code_text: "The project adheres to",
  },
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const t = content[lang];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors selection:bg-[var(--color-accent-blue)] selection:text-white">
      
      {/* NAVBAR */}

<nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
    
    {/* Левая часть: Лого */}
    <div className="flex items-center gap-6 w-1/3">
            <Link href="/" className={`text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)] transition-opacity ${pathname !== "/" ? "opacity-0 pointer-events-none hidden md:block md:opacity-100" : "opacity-100"}`}>
              Subreel
            </Link>
      <Link href="/about" className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors shrink-0">
        <Info size={14}/> {t.about}
      </Link>
    </div>

    {/* Центр: Ссылки (Единый размер md:text-xs) */}
    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-8">
      {[
        { name: t.nav_home, path: "/" },
        { name: t.nav_launcher, path: "/launcher" },
        { name: t.nav_server, path: "/server" }
      ].map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link 
            key={item.path} 
            href={item.path}
            className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
              isActive 
                ? "text-[var(--color-accent-blue)]" 
                : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
            }`}
          >
            {item.name}
            {isActive && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />
            )}
          </Link>
        );
      })}
    </div>

    {/* Правая часть: Панель (Единый размер элементов) */}
    <div className="flex items-center justify-end gap-3 w-1/3">
      <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)]">
        
        {/* Язык */}
        <button 
          onClick={() => setLang(lang === "RU" ? "EN" : "RU")} 
          className="px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-xs font-black uppercase transition-colors"
        >
          {lang}
        </button>

        <div className="w-px h-4 bg-[var(--color-border-sharp)] opacity-50" />

        {/* Тема */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
          className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors"
        >
          {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
        </button>
      </div>
    </div>
  </div>
</nav>


      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-[1000] uppercase tracking-[0.3em] mb-8 border border-[var(--color-accent-blue)]/20 shadow-sm">
            {t.hero_badge}
          </div>
          
          <h1 className="text-7xl md:text-[10rem] font-[1000] tracking-[-0.05em] mb-8 uppercase italic leading-[0.75] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t.hero_title_main} <span className="text-[var(--color-accent-blue)]">{t.hero_title_sub}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--color-text-gray)] max-w-2xl mx-auto font-medium leading-relaxed mb-12 opacity-80">
            {t.hero_desc}
          </p>
        </div>
      </section>

      {/* MAIN CONTENT / CARDS */}
      <main className="grow px-6 pb-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          
          {/* Launcher Card */}
          <Link href="/launcher" className="group relative overflow-hidden rounded-[3rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-12 transition-all hover:border-[var(--color-accent-blue)] hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2)] flex flex-col justify-between min-h-[420px]">
            <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-10 pointer-events-none">
               <Download size={180} strokeWidth={1} />
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 mb-10 rounded-2xl bg-[var(--color-accent-blue)] text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                <Download size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-5xl font-[1000] mb-6 uppercase italic tracking-tighter leading-none">
                {t.launcher_title}
              </h2>
              <p className="text-[var(--color-text-gray)] text-lg leading-relaxed font-medium max-w-[320px]">
                {t.launcher_desc}
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-3 text-sm font-black uppercase italic tracking-wider text-[var(--color-accent-blue)] group-hover:translate-x-2 transition-transform">
              {t.hint} <ArrowRight size={18} strokeWidth={3} />
            </div>
          </Link>

          {/* Server Card */}
          <Link href="/server" className="group relative overflow-hidden rounded-[3rem] border border-[var(--color-border-sharp)] bg-[var(--color-card-bg)] p-12 transition-all hover:border-[var(--color-accent-blue)] hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.2)] flex flex-col justify-between min-h-[420px]">
            <div className="absolute top-0 right-0 p-12 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-10 pointer-events-none">
               <LayoutGrid size={180} strokeWidth={1} />
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 mb-10 rounded-2xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center border border-[var(--color-accent-blue)]/20 group-hover:-rotate-6 transition-transform">
                <LayoutGrid size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-5xl font-[1000] mb-6 uppercase italic tracking-tighter leading-none">
                {t.server_title}
              </h2>
              <p className="text-[var(--color-text-gray)] text-lg leading-relaxed font-medium max-w-[320px]">
                {t.server_desc}
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center gap-3 text-sm font-black uppercase italic tracking-wider text-[var(--color-accent-blue)] group-hover:translate-x-2 transition-transform">
              {t.hint} <ArrowRight size={18} strokeWidth={3} />
            </div>
          </Link>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--color-border-sharp)] py-16 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="flex flex-col gap-6 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-blue-500/20">S</div>
                <span className="font-[1000] text-2xl tracking-tighter uppercase italic">Subreel Studio</span>
              </div>
              <p className="text-[11px] uppercase opacity-50 font-bold tracking-[0.1em] leading-relaxed text-[var(--color-text-gray)]">
                {t.footer_disclaimer}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-12 gap-y-6">
               <FooterLink icon={<MessageCircle size={16}/>} label="Discord" href="#" />
               <FooterLink icon={<Github size={16}/>} label="GitHub" href="#" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-[var(--color-border-sharp)]/50">
            <div className="text-[10px] uppercase tracking-[0.4em] font-[1000] text-[var(--color-text-gray)] opacity-60">
              {t.footer_since}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-gray)]">
              {t.footer_code_text}{" "}
              <a className="text-[var(--color-accent-blue)] hover:underline decoration-2 underline-offset-4 transition-all cursor-pointer">
                {t.footer_open_source}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <a href={href} className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-all group">
      <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
      {label}
    </a>
  );
}
