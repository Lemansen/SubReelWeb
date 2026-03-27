"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Download, Lock,
  Server, Wrench, Settings2, Newspaper, 
  DownloadCloud, Users, Palette, BookOpen, Plus, Play, User,
  MessageSquare, Search,
  ChevronLeft, Menu, X
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const content = {
  RU: {
    about: "Про нас",
    hero_title: "SubReel",
    hero_subtitle: "Твой пропуск в мир комфортной игры. Стабильно, быстро и ничего лишнего.",
    download_btn: "Скачать для",
    coming_soon: "Скоро для Вашей ОС",
    only_win: "В данный момент доступно только для Windows",
    version_info: "Версия 0.1.2 • Тестирование",
    hero_title_accent: "Лаунчер",
    download_unix: "Другие платформы",

    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_back: "Назад",
    nav_wiki: "Вики",
    
    features_title: "Возможности лаунчера",
    feat_server: "Быстрый вход",
    feat_server_desc: "Залетай на наш сервер прямо с главного экрана лаунчера в один клик. Никакого ввода IP и лишних меню.",
    feat_builds: "Свои сборки",
    feat_builds_desc: "Создавай уникальные клиенты с любимыми модами под разные задачи легко и быстро.",
    feat_custom: "Полный контроль",
    feat_custom_desc: "Кастомизируй свои сборки как душе угодно: выделение памяти, аргументы Java и версии загрузчиков.",
    feat_news: "Лента новостей",
    feat_news_desc: "Встроенный блок новостей не даст тебе пропустить вайпы, ивенты и важные обновления проекта.",

    preview_search: "Поиск сборок...",
    preview_our_server: "Наш сервер",
    preview_server_desc: "Наши моды и настройки",
    preview_create: "СОЗДАТЬ СБОРКУ",
    preview_create_desc: "Свои моды и настройки",
    preview_status: "Готов к запуску",
    preview_play: "ИГРАТЬ",
    preview_online: "ОНЛАЙН: 42",

    soon_title: "В разработке",
    badge_soon: "Скоро",
    soon_mods: "CurseForge & Modrinth",
    soon_mods_desc: "Скачивание модов, ресурспаков и готовых сборок напрямую из базы прямо внутри лаунчера.",
    soon_social: "Сообщество",
    soon_social_desc: "Система друзей, личные сообщения и поиск команды для совместной игры.",
    soon_themes: "Кастомизация UI",
    soon_themes_desc: "Настраивай внешний вид самого лаунчера: темы, цвета и фоновые изображения.",
    auth_title: "Единый вход для сайта и лаунчера",
    auth_desc: "Общая авторизация уже готовится в проекте: сайт, кабинет и лаунчер смогут использовать один профиль и один поток доступа.",
    auth_step_one: "Войди на сайте или создай аккаунт",
    auth_step_two: "Открой кабинет и получи launcher token",
    auth_step_three: "Используй тот же аккаунт внутри лаунчера",
    auth_doc_btn: "Документация входа",
    auth_account_btn: "Открыть кабинет",

    cta_title: "Чего бы вы хотели увидеть у нас в лаунчере?",
    cta_desc: "Мы делаем продукт для игроков и прислушиваемся к комьюнити. Нашли баг или есть гениальная идея? Ждем вас в нашем Discord!",
    cta_btn: "Написать в Discord",

    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Существует с 2026 года",
  },
  EN: {
    about: "About Us",
    hero_title: "SubReel",
    hero_subtitle: "Your gateway to comfortable gameplay. Stable, fast, and nothing extra.",
    download_btn: "Download for",
    coming_soon: "Soon for your OS",
    only_win: "Currently available only for Windows",
    version_info: "Version 0.1.2 • Testing",
    hero_title_accent: "Launcher",
    download_unix: "Other platforms",

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

    preview_search: "Search builds...",
    preview_our_server: "Our server",
    preview_server_desc: "Our mods & settings",
    preview_create: "CREATE BUILD",
    preview_create_desc: "Your mods & settings",
    preview_status: "Ready to launch",
    preview_play: "PLAY",
    preview_online: "ONLINE: 42",

    soon_title: "In Development",
    badge_soon: "Soon",
    soon_mods: "CurseForge & Modrinth",
    soon_mods_desc: "Download mods, resource packs, and ready-made builds directly from the database inside the launcher.",
    soon_social: "Community",
    soon_social_desc: "Friends system, private messages, and finding a team for co-op play.",
    soon_themes: "UI Customization",
    soon_themes_desc: "Customize the look of the launcher itself: themes, colors, and background images.",
    auth_title: "One account for website and launcher",
    auth_desc: "The shared auth flow is already being prepared: the website, account page, and launcher will use one profile and one access flow.",
    auth_step_one: "Sign in on the website or create an account",
    auth_step_two: "Open the account page and get a launcher token",
    auth_step_three: "Use the same account inside the launcher",
    auth_doc_btn: "Auth docs",
    auth_account_btn: "Open account",

    cta_title: "What would you like to see in our launcher?",
    cta_desc: "We build a product for players and listen to the community. Found a bug or have a brilliant idea? We are waiting for you in our Discord!",
    cta_btn: "Join Discord",

    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2026",
  },
};

export default function DownloadPage() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [discordOnline, setDiscordOnline] = useState<number | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const discordServerId = "1143957199786364959"; 
  
      fetch(`https://discord.com/api/guilds/${discordServerId}/widget.json`)
      .then(res => res.json())
      .then(data => {
        if (data && data.presence_count !== undefined) {
          setDiscordOnline(data.presence_count);
        } else {
          setDiscordOnline(0);
        }
      })
      .catch(() => setDiscordOnline(0));
  }, []);

  const t = content[lang];
  const os: "Windows" | "Other" =
    typeof navigator !== "undefined" && !navigator.platform.toLowerCase().includes("win")
      ? "Other"
      : "Windows";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      
            {/* NAVBAR */}
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-16 py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 relative">
          
          {/* Левая часть: Кнопка назад и Лого */}
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

          {/* Центр: Ссылки */}
          <div className="hidden md:flex order-3 md:order-none w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 items-center justify-center gap-3 md:gap-8 overflow-x-auto">
            {[
              { name: t.nav_home, path: "/" },
              { name: t.nav_launcher, path: "/launcher" },
              { name: t.nav_server, path: "/server" },
            ].filter((item) => item.path !== "/account").map((item) => {
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
                  Mobile
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

      <main className="max-w-7xl mx-auto px-4 md:px-6 w-full">
        {/* HERO SECTION */}
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center py-12 md:py-16 lg:py-28">
          <div className="relative z-10 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-black uppercase tracking-widest mb-8 border border-[var(--color-accent-blue)]/20 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-blue)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-blue)]"></span>
              </span>
              {t.version_info}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-[1000] italic uppercase tracking-tighter leading-[0.95] md:leading-[0.9] mb-6 md:mb-8">
              {t.hero_title} <br/>
              <span className="text-[var(--color-accent-blue)]">{t.hero_title_accent}</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-text-gray)] font-medium italic mb-10 max-w-lg leading-relaxed mx-auto lg:mx-0">
              {t.hero_subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {os === "Windows" ? (
                <a 
                  href="https://github.com/Lemansen/SubReel/releases/download/0.1.3/SubReel.exe"
                  className="group relative flex-1 flex items-center gap-4 md:gap-6 bg-[var(--color-accent-blue)] text-white px-6 md:px-8 py-4 md:py-5 rounded-[1.75rem] md:rounded-[2rem] font-black transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)] cursor-pointer"
                >
                  <div className="text-left">
                    <span className="block text-[10px] uppercase opacity-70 tracking-widest mb-1">{t.download_btn}</span>
                    <span className="block text-2xl leading-none tracking-tighter">WINDOWS</span>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform ml-auto">
                    <Download size={24} strokeWidth={3} />
                  </div>
                </a>
              ) : (
                <div className="flex-1 bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] px-6 md:px-8 py-4 md:py-5 rounded-[1.75rem] md:rounded-[2rem] font-black uppercase italic flex items-center justify-center gap-3 opacity-50">
                  <Lock size={20} /> {t.only_win}
                </div>
              )}
              <a
                href="https://github.com/Lemansen/SubReel/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 md:px-8 py-4 md:py-5 border border-[var(--color-border-sharp)] rounded-[1.75rem] md:rounded-[2rem] font-black uppercase italic flex items-center justify-center gap-3 hover:bg-[var(--color-panel-hover)] transition-all text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
              >
                <Settings2 size={20} /> {t.download_unix}
              </a>
            </div>
          </div>

          {/* LAUNCHER UI PREVIEW */}
          <div className="relative group order-1 lg:order-2">
            <div className="absolute inset-0 bg-[var(--color-accent-blue)]/20 blur-[100px] rounded-full group-hover:bg-[var(--color-accent-blue)]/30 transition-all duration-1000" />
            
            <div className="relative aspect-[16/10] bg-[#0c0d11] rounded-[1.25rem] md:rounded-[1.5rem] border border-white/5 overflow-hidden shadow-2xl flex font-sans transform lg:rotate-2 group-hover:rotate-0 transition-transform duration-700">
              {/* Sidebar */}
              <div className="w-[22%] border-r border-white/5 bg-[#0a0b0e] p-4 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-blue)]/20 border border-[var(--color-accent-blue)] flex items-center justify-center mb-6">
                  <User size={20} className="text-[var(--color-accent-blue)]" />
                </div>
                <div className="w-full space-y-3">
                  <div className="h-7 w-full bg-[var(--color-accent-blue)]/10 border-l-2 border-[var(--color-accent-blue)] flex items-center px-4">
                    <div className="h-1 w-12 bg-[var(--color-accent-blue)] rounded-full" />
                  </div>
                  <div className="h-7 w-full flex items-center px-4 opacity-20"><div className="h-1 w-10 bg-white rounded-full" /></div>
                  <div className="h-7 w-full flex items-center px-4 opacity-20"><div className="h-1 w-8 bg-white rounded-full" /></div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-5 md:p-8 flex flex-col relative">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-30 italic">SubReel Studio</div>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  </div>
                </div>

                <div className="w-full h-9 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3 mb-8">
                  <Search size={14} className="opacity-20" />
                  <div className="text-[9px] opacity-20 uppercase font-bold tracking-widest">{t.preview_search}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-video bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center group-hover:border-[var(--color-accent-blue)]/40 transition-colors">
                    <div className="text-[10px] font-black uppercase italic mb-1 tracking-tighter">{t.preview_our_server}</div>
                    <div className="text-[8px] opacity-40 uppercase font-bold">{t.preview_server_desc}</div>
                  </div>
                  <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center opacity-40">
                    <Plus size={16} className="text-[var(--color-accent-blue)] mb-1" />
                    <div className="text-[10px] font-black uppercase italic tracking-tighter">{t.preview_create}</div>
                  </div>
                </div>

                <div className="mt-auto flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black italic opacity-80">{t.preview_status}</div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <div className="text-[8px] font-black uppercase opacity-60 tracking-widest">{t.preview_online}</div>
                    </div>
                  </div>
                  
                  <div className="w-28 h-10 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <div className="flex items-center gap-2">
                      <Play size={12} fill="white" className="text-white" />
                      <span className="text-white font-black italic uppercase text-[11px] tracking-tighter">{t.preview_play}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. БЛОК: АКТУАЛЬНЫЕ ФИЧИ */}
        <section className="py-24 border-t border-[var(--color-border-sharp)]">
          <div className="mb-16 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter flex items-center justify-center lg:justify-start gap-4">
              <div className="w-2 h-12 bg-[var(--color-accent-blue)] rounded-full hidden lg:block"/>
              {t.features_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        </section>

        {/* 2. БЛОК: В РАЗРАБОТКЕ */}
        <section className="pb-24">
          <div className="mb-16 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl text-[var(--color-text-gray)] font-black uppercase italic tracking-tighter flex items-center justify-center lg:justify-start gap-4">
              <div className="w-2 h-10 bg-[var(--color-text-gray)]/30 rounded-full hidden lg:block"/>
              {t.soon_title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
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
        </section>

      </main>

            {/* 3. БЛОК: ОБРАТНАЯ СВЯЗЬ (DISCORD) */}
      <section className="px-4 md:px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[3rem] bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] overflow-hidden p-8 md:p-20 shadow-2xl">
            
            {/* Декоративное свечение на фоне */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-accent-blue)]/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2]/10 text-[#5865F2] text-xs font-black uppercase tracking-[0.2em] mb-8 border border-[#5865F2]/20">
                  <MessageSquare size={16} fill="currentColor" className="opacity-80" />
                  Community Feedback
                </div>
                
                <h2 className="text-4xl md:text-6xl font-[1000] uppercase italic tracking-tighter mb-8 leading-[0.95] text-balance">
                  {t.cta_title.split('?')[0]}<span className="text-[var(--color-accent-blue)]">?</span>
                </h2>
                
                <p className="text-lg md:text-xl text-[var(--color-text-gray)] font-medium leading-relaxed mb-0">
                  {t.cta_desc}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <a 
                  href="https://discord.gg/t7bjdm9uDC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-6 bg-[#5865F2] text-white px-10 py-6 rounded-[2rem] font-black text-2xl transition-all hover:scale-105 hover:shadow-[0_20px_50px_-10px_rgba(88,101,242,0.5)] active:scale-95 overflow-hidden"
                >
                  {/* Эффект блика на кнопке при наведении */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <div className="bg-white/20 p-2 rounded-xl">
                    <svg width="28" height="28" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.7,77.7,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.36,46,96.26,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                  </div>
                  <span className="italic uppercase tracking-tighter">{t.cta_btn}</span>
                </a>
                
                <div className="flex -space-x-3">
  {[1, 2, 3, 4].map((i) => (
    <div key={i} className="w-10 h-10 rounded-full border-4 border-[var(--color-panel-bg)] bg-[var(--color-bg)] flex items-center justify-center overflow-hidden">
       <User size={20} className="text-[var(--color-text-gray)]" />
    </div>
  ))}
  <div className="min-w-[40px] px-2 h-10 rounded-full border-4 border-[var(--color-panel-bg)] bg-[var(--color-accent-blue)] flex items-center justify-center text-[10px] font-black text-white">
  {typeof discordOnline === 'number' ? `+${discordOnline}` : "..."}
</div>
</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 md:py-16 bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col gap-12">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-12 text-center md:text-left">
            <div className="flex flex-col gap-5 max-w-xl">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-10 h-10 bg-[var(--color-accent-blue)] rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-md">S</div>
                <span className="font-black text-2xl tracking-tighter uppercase italic">Subreel Studio</span>
              </div>
              <p className="text-[10px] md:text-[11px] uppercase opacity-50 font-bold tracking-widest text-[var(--color-text-gray)] leading-loose">
                {t.footer_disclaimer}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-xs font-black uppercase tracking-widest">
              <a href="https://discord.gg/t7bjdm9uDC" className="text-[var(--color-text-gray)] hover:text-[#5865F2] transition-colors">Discord</a>
              <a href="https://github.com/Lemansen/SubReel" className="text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors">GitHub</a>
              <Link href="/wiki" className="text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors">Wiki</Link>
            </div>
          </div>
          <div className="pt-10 border-t border-[var(--color-border-sharp)] opacity-50 text-center">
            <p className="text-[9px] uppercase tracking-[0.4em] font-black text-[var(--color-text-gray)]">{t.footer_since}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, badge }: { icon: React.ReactNode, title: string, desc: string, badge?: string }) {
  return (
    <div className="bg-[var(--color-card-bg)] border border-[var(--color-border-sharp)] p-8 md:p-10 rounded-[2.5rem] hover:border-[var(--color-accent-blue)]/50 hover:bg-[var(--color-panel-hover)] transition-all group relative overflow-hidden flex flex-col h-full shadow-sm">
      {badge && (
        <div className="absolute top-8 right-8 bg-[var(--color-text-gray)]/10 text-[var(--color-text-gray)] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[var(--color-border-sharp)] backdrop-blur-sm group-hover:text-[var(--color-accent-blue)] group-hover:bg-[var(--color-accent-blue)]/10 transition-colors">
          {badge}
        </div>
      )}
      
      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:-rotate-3 ${badge ? 'bg-[var(--color-text-gray)]/10 text-[var(--color-text-gray)]' : 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'}`}>
        {icon}
      </div>
      <h3 className="text-xl md:text-2xl font-black uppercase italic mb-4 tracking-tighter group-hover:text-[var(--color-accent-blue)] transition-colors">{title}</h3>
      <p className="text-[var(--color-text-gray)] text-sm md:text-base font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{desc}</p>
    </div>
  );
}

