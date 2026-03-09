"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Moon, Sun, Download, Info, Zap, 
  ShieldCheck, Smartphone, Monitor, Lock,
  Server, Wrench, Settings2, Newspaper, 
  DownloadCloud, Users, Palette, BookOpen, MessageSquare,
  ChevronLeft 
} from "lucide-react";

const content = {
  RU: {
    about: "Про нас",
    hero_title: "SubReel Launcher",
    hero_subtitle: "Твой пропуск в мир комфортной игры. Стабильно, быстро и ничего лишнего.",
    download_btn: "Скачать для",
    coming_soon: "Скоро для Вашей ОС",
    only_win: "В данный момент доступно только для Windows",
    version_info: "Версия 0.1.2 • Тестирование",
    
    // Навигация
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_back: "Назад",
    nav_wiki: "Вики",
    // --- Текущие фичи ---
    features_title: "Возможности лаунчера",
    feat_server: "Быстрый вход",
    feat_server_desc: "Залетай на наш сервер прямо с главного экрана лаунчера в один клик. Никакого ввода IP и лишних меню.",
    feat_builds: "Свои сборки",
    feat_builds_desc: "Создавай уникальные клиенты с любимыми модами под разные задачи легко и быстро.",
    feat_custom: "Полный контроль",
    feat_custom_desc: "Кастомизируй свои сборки как душе угодно: выделение памяти, аргументы Java и версии загрузчиков.",
    feat_news: "Лента новостей",
    feat_news_desc: "Встроенный блок новостей не даст тебе пропустить вайпы, ивенты и важные обновления проекта.",

    // --- В разработке ---
    soon_title: "В разработке",
    badge_soon: "Скоро",
    soon_mods: "CurseForge & Modrinth",
    soon_mods_desc: "Скачивание модов, ресурспаков и готовых сборок напрямую из базы прямо внутри лаунчера.",
    soon_social: "Сообщество",
    soon_social_desc: "Система друзей, личные сообщения и поиск команды для совместной игры.",
    soon_themes: "Кастомизация UI",
    soon_themes_desc: "Настраивай внешний вид самого лаунчера: темы, цвета и фоновые изображения.",

    // --- Блок Discord ---
    cta_title: "Чего бы вы хотели увидеть у нас в лаунчере?",
    cta_desc: "Мы делаем продукт для игроков и прислушиваемся к комьюнити. Нашли баг или есть гениальная идея? Ждем вас в нашем Discord!",
    cta_btn: "Написать в Discord",

    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Существует с 2020 года",
  },
  EN: {
    about: "About Us",
    hero_title: "SubReel Launcher",
    hero_subtitle: "Your gateway to comfortable gameplay. Stable, fast, and nothing extra.",
    download_btn: "Download for",
    coming_soon: "Soon for your OS",
    only_win: "Currently available only for Windows",
    version_info: "Version 0.1.2 • Testing",

    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_back: "Back",
    nav_wiki: "Wiki",

    features_title: "Launcher Features",
    feat_server: "Quick Join",
    feat_server_desc: "Jump into our server right from the main screen in one click. No IP typing or extra menus.",
    feat_builds: "Custom Builds",
    feat_builds_desc: "Create unique clients with your favorite mods for different tasks easily and quickly.",
    feat_custom: "Full Control",
    feat_custom_desc: "Customize your builds however you want: memory allocation, Java arguments, and loader versions.",
    feat_news: "News Feed",
    feat_news_desc: "The built-in news block ensures you never miss wipes, events, and important project updates.",

    soon_title: "In Development",
    badge_soon: "Soon",
    soon_mods: "CurseForge & Modrinth",
    soon_mods_desc: "Download mods, resource packs, and ready-made builds directly from the database inside the launcher.",
    soon_social: "Community",
    soon_social_desc: "Friends system, private messages, and finding a team for co-op play.",
    soon_themes: "UI Customization",
    soon_themes_desc: "Customize the look of the launcher itself: themes, colors, and background images.",

    cta_title: "What would you like to see in our launcher?",
    cta_desc: "We build a product for players and listen to the community. Found a bug or have a brilliant idea? We are waiting for you in our Discord!",
    cta_btn: "Join Discord",

    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
  },
};

export default function DownloadPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [os, setOs] = useState<"Windows" | "Other">("Windows");

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const platform = window.navigator.platform.toLowerCase();
      if (!platform.includes("win")) setOs("Other");
    }
  }, []);

  if (!mounted) return null;
  const t = content[lang];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      
      {/* NAVBAR */}
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          
          {/* Левая часть: Кнопка назад и Лого */}
          <div className="flex items-center gap-6 w-1/3">
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

          {/* Центр: Ссылки */}
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

          {/* Правая часть: Управление (Вики, Язык, Тема) */}
          <div className="flex items-center justify-end w-1/3 gap-3">
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
<section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Декоративная сетка на фоне */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-black uppercase tracking-[0.2em] mb-10 border border-[var(--color-accent-blue)]/20 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-blue)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-blue)]"></span>
            </span>
            {t.version_info}
          </div>

          <h1 className="text-6xl md:text-9xl font-[1000] tracking-[-0.04em] mb-8 uppercase italic leading-[0.8] text-balance">
            SubReel <span className="text-[var(--color-accent-blue)]">Launcher</span>
          </h1>
          
          <p className="text-xl text-[var(--color-text-gray)] max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
            {t.hero_subtitle}
          </p>

          <div className="flex flex-col items-center gap-6">
            {os === "Windows" ? (
              <button className="group relative flex items-center gap-8 bg-[var(--color-accent-blue)] text-white px-12 py-6 rounded-[2rem] font-black text-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_-10px_rgba(59,130,246,0.4)]">
                <div className="text-left">
                  <span className="block text-[10px] uppercase opacity-70 tracking-widest mb-1">{t.download_btn}</span>
                  <span className="block leading-none tracking-tighter">WINDOWS</span>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Download size={32} strokeWidth={3} />
                </div>
              </button>
            ) : (
              <div className="bg-[var(--color-panel-bg)] p-8 rounded-[2.5rem] border border-[var(--color-border-sharp)] inline-flex flex-col items-center gap-4">
                 <button disabled className="flex items-center gap-6 opacity-40 px-10 py-5 rounded-2xl font-black text-xl cursor-not-allowed border border-white/5">
                  <span className="italic uppercase">macOS / Linux</span>
                  <Lock size={24} />
                </button>
                <p className="text-[10px] uppercase font-bold text-red-500 tracking-widest">{t.only_win}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 1. БЛОК: АКТУАЛЬНЫЕ ФИЧИ */}
      <section className="px-6 py-20 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter flex items-center justify-center md:justify-start gap-3">
              <div className="w-2 h-10 bg-[var(--color-accent-blue)] rounded-full hidden md:block"/>
              {t.features_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard 
              icon={<Server size={32} />} 
              title={t.feat_server} 
              desc={t.feat_server_desc} 
            />
            <FeatureCard 
              icon={<Wrench size={32} />} 
              title={t.feat_builds} 
              desc={t.feat_builds_desc} 
            />
            <FeatureCard 
              icon={<Settings2 size={32} />} 
              title={t.feat_custom} 
              desc={t.feat_custom_desc} 
            />
            <FeatureCard 
              icon={<Newspaper size={32} />} 
              title={t.feat_news} 
              desc={t.feat_news_desc} 
            />
          </div>
        </div>
      </section>

      {/* 2. БЛОК: В РАЗРАБОТКЕ */}
      <section className="px-6 pb-20 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl text-[var(--color-text-gray)] font-black uppercase italic tracking-tighter flex items-center justify-center md:justify-start gap-3">
              <div className="w-2 h-8 bg-[var(--color-text-gray)]/30 rounded-full hidden md:block"/>
              {t.soon_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-70">
            <FeatureCard 
              icon={<DownloadCloud size={28} />} 
              title={t.soon_mods} 
              desc={t.soon_mods_desc} 
              badge={t.badge_soon}
            />
            <FeatureCard 
              icon={<Users size={28} />} 
              title={t.soon_social} 
              desc={t.soon_social_desc} 
              badge={t.badge_soon}
            />
            <FeatureCard 
              icon={<Palette size={28} />} 
              title={t.soon_themes} 
              desc={t.soon_themes_desc} 
              badge={t.badge_soon}
            />
          </div>
        </div>
      </section>

      {/* 3. БЛОК: DISCORD */}
      <section className="px-6 py-20 border-t border-[var(--color-border-sharp)] bg-[var(--color-accent-blue)]/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[var(--color-accent-blue)]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="w-20 h-20 bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <MessageSquare size={40} />
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
            {t.cta_title}
          </h2>
          <p className="text-xl text-[var(--color-text-gray)] mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            {t.cta_desc}
          </p>
          
          <a 
            href="https://discord.gg/your-invite-link" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-2xl font-black text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-[#5865F2]/20"
          >
            <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.7,77.7,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.36,46,96.26,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            {t.cta_btn}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 mt-auto bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-4 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--color-accent-blue)] rounded-lg flex items-center justify-center text-white font-bold">S</div>
                <span className="font-bold text-xl tracking-tight uppercase italic">Subreel Studio</span>
              </div>
              <p className="text-[11px] uppercase opacity-60 font-semibold tracking-wider text-[var(--color-text-gray)]">
                {t.footer_disclaimer}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold uppercase tracking-tighter">
              <a href="https://discord.gg/your-invite-link" className="text-[var(--color-text-gray)] hover:text-[#5865F2] transition-colors">Discord</a>
              <a href="#" className="text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors">GitHub</a>
            </div>
          </div>
          <hr className="border-[var(--color-border-sharp)] opacity-50"/>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--color-text-gray)] text-center">{t.footer_since}</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, badge }: { icon: React.ReactNode, title: string, desc: string, badge?: string }) {
  return (
    <div className="bg-[var(--color-card-bg)] border border-[var(--color-border-sharp)] p-10 rounded-[2.5rem] hover:border-[var(--color-accent-blue)] hover:bg-[var(--color-panel-hover)] transition-all group relative overflow-hidden flex flex-col h-full">
      {badge && (
        <div className="absolute top-8 right-8 bg-[var(--color-text-gray)]/20 text-[var(--color-text)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--color-text-gray)]/30 backdrop-blur-sm">
          {badge}
        </div>
      )}
      
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:-rotate-3 ${badge ? 'bg-[var(--color-text-gray)]/10 text-[var(--color-text-gray)]' : 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black uppercase italic mb-4 tracking-tighter">{title}</h3>
      <p className="text-[var(--color-text-gray)] text-base font-medium leading-relaxed mt-auto">{desc}</p>
    </div>
  );
}
