"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  HardDrive, ShieldAlert, 
  Monitor, Menu, X, Home,
  Info, Terminal, Cpu, Zap, 
  Moon, Sun, BookOpen, Rocket, 
  Hammer, ShieldCheck, ExternalLink, 
  ArrowRight, ChevronRight, ChevronLeft
} from "lucide-react";

const content = {
  RU: {
    nav_home: "Главная",
    nav_wiki: "Вики",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_back: "Назад",
    sidebar_title: "Навигация",
    link_intro: "Введение",
    link_launcher: "Лаунчер",
    link_commands: "Команды сервера",
    link_rules: "Правила",
    link_faq: "Чаво (FAQ)",
    
    breadcrumbs: "База знаний Subreel",
    page_title_1: "ДОБРО ПОЖАЛОВАТЬ В",
    page_title_2: "SUBREEL WIKI",
    page_desc: "Ваш путеводитель по экосистеме Subreel. Инструкции, технические спецификации и правила сообщества в одном месте.",
    
    start_title: "Быстрый старт",
    start_launcher_t: "Установка клиента",
    start_launcher_d: "Пошаговое руководство по загрузке и первой настройке лаунчера.",
    start_rules_t: "Кодекс игрока",
    start_rules_d: "Обязательные правила поведения на сервере и юридическая информация.",
    start_commands_t: "Справочник команд",
    start_commands_d: "Полный перечень консольных команд для взаимодействия с миром.",

    dev_title: "Технологии проекта",
    dev_desc: "Мы используем передовой стек для обеспечения стабильности и производительности. Каждая строка кода оптимизирована для вашего комфорта.",

    footer_help: "Остались вопросы?",
    footer_support: "Если вы не нашли нужную информацию, наша команда поддержки в Discord всегда готова помочь."
  },
  EN: {
    nav_home: "Home",
    nav_wiki: "Wiki",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_back: "Back",
    sidebar_title: "Navigation",
    link_intro: "Introduction",
    link_launcher: "Launcher",
    link_commands: "Commands",
    link_rules: "Rules",
    link_faq: "FAQ",

    breadcrumbs: "Subreel Knowledge Base",
    page_title_1: "WELCOME TO",
    page_title_2: "SUBREEL WIKI",
    page_desc: "Your guide to the Subreel ecosystem. Instructions, technical specs, and community rules all in one place.",

    start_title: "Quick Start",
    start_launcher_t: "Client Setup",
    start_launcher_d: "Step-by-step guide to downloading and configuring the launcher.",
    start_rules_t: "Player Code",
    start_rules_d: "Mandatory conduct rules and legal information.",
    start_commands_t: "Command Reference",
    start_commands_d: "Complete list of console commands for world interaction.",

    dev_title: "Technical Stack",
    dev_desc: "We use a cutting-edge stack to ensure stability and performance. Every line of code is optimized for your experience.",

    footer_help: "Still have questions?",
    footer_support: "If you can't find the info you need, our Discord support team is always ready to help."
  }
};

export default function WikiHome() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const t = content[lang];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-accent-blue)] selection:text-white">
      
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
      className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg transition-colors group ${
        pathname.startsWith('/wiki') 
          ? "bg-[var(--color-accent-blue)] text-white" // Активное состояние
          : "hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
      } text-[10px] md:text-sm font-bold uppercase`}>
      <BookOpen size={14} className={pathname.startsWith('/wiki') ? "text-white" : "text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)]"}/>
        <span className="hidden sm:block">{t.nav_wiki}</span>
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

      <div className="flex max-w-[1600px] mx-auto">
        
        {/* SIDEBAR */}
        <aside className={`
          fixed lg:sticky top-16 left-0 z-50 w-72 h-[calc(100vh-4rem)] 
          bg-[var(--color-bg)] border-r border-[var(--color-border-sharp)] 
          transition-transform duration-300 lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-6 overflow-y-auto h-full scrollbar-hide">
            <div className="mb-8">
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-gray)] mb-4 px-4">{t.sidebar_title}</h2>
               <nav className="space-y-1">
                  <SidebarLink icon={<Home size={18}/>} label={t.link_intro} href="/wiki" active={pathname === "/wiki"} />
                  <SidebarLink icon={<Monitor size={18}/>} label={t.link_launcher} href="/wiki/launcher" active={pathname === "/wiki/launcher"} />
                  <SidebarLink icon={<Terminal size={18}/>} label={t.link_commands} href="/wiki/commands" active={pathname === "/wiki/commands"} />
                  <SidebarLink icon={<ShieldAlert size={18}/>} label={t.link_rules} href="/wiki/rules" active={pathname === "/wiki/rules"} />
                  <SidebarLink icon={<Info size={18}/>} label={t.link_faq} href="/wiki/faq" active={pathname === "/wiki/faq"} />
               </nav>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 lg:px-16 pt-12 pb-24 min-w-0">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)] mb-12">
            <Link href="/" className="hover:text-[var(--color-accent-blue)] transition-colors">Subreel</Link>
            <ChevronRight size={10} />
            <span className="text-[var(--color-accent-blue)]">{t.breadcrumbs}</span>
          </div>

          {/* Hero */}
          <header className="mb-24">
            <h1 className="text-5xl md:text-8xl font-[1000] italic uppercase tracking-tighter mb-8 leading-[0.8] animate-in fade-in slide-in-from-bottom-4 duration-700">
              {t.page_title_1} <br/> 
              <span className="text-[var(--color-accent-blue)]">{t.page_title_2}</span>
            </h1>
            <p className="text-xl text-[var(--color-text-gray)] font-medium max-w-2xl leading-relaxed italic opacity-80">
              {t.page_desc}
            </p>
          </header>

          <div className="space-y-32">
            
            {/* Quick Cards Grid */}
            <section>
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center font-black italic text-xl">01</div>
                <h3 className="text-3xl font-[1000] italic uppercase tracking-tighter">{t.start_title}</h3>
                <div className="flex-1 h-px bg-[var(--color-border-sharp)] ml-4 opacity-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <QuickCard 
                  href="/wiki/launcher"
                  icon={<Rocket size={24}/>}
                  title={t.start_launcher_t}
                  desc={t.start_launcher_d}
                  variant="blue"
                />
                <QuickCard 
                  href="/wiki/rules"
                  icon={<ShieldCheck size={24}/>}
                  title={t.start_rules_t}
                  desc={t.start_rules_d}
                  variant="white"
                />
                <QuickCard 
                  href="/wiki/commands"
                  icon={<Terminal size={24}/>}
                  title={t.start_commands_t}
                  desc={t.start_commands_d}
                  variant="ghost"
                />
              </div>
            </section>

            {/* Technical Section */}
            <section className="relative group">
               <div className="absolute inset-0 bg-[var(--color-accent-blue)]/5 blur-3xl rounded-[4rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               
               <div className="grid lg:grid-cols-2 gap-16 items-center bg-[var(--color-panel-bg)] rounded-[3rem] p-8 md:p-16 border border-[var(--color-border-sharp)] overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <span className="text-xl font-black italic text-[var(--color-accent-blue)]">02</span>
                       <h3 className="text-3xl font-[1000] italic uppercase tracking-tighter">{t.dev_title}</h3>
                    </div>
                    <p className="text-lg text-[var(--color-text-gray)] font-medium leading-relaxed italic mb-10">
                      {t.dev_desc}
                    </p>
                    <div className="flex flex-wrap gap-3">
                       <TechBadge icon={<Zap size={14}/>} text="C# / .NET 10" />
                       <TechBadge icon={<Cpu size={14}/>} text="React & Next.js" />
                       <TechBadge icon={<HardDrive size={14}/>} text="NVMe Storage" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                      <MetricBox value="99.9%" label="Server Uptime" />
                      <MetricBox value="< 20ms" label="Avg Latency" />
                  </div>
                  
                  <Hammer className="absolute -bottom-16 -right-16 w-80 h-80 opacity-[0.02] -rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-[2s]" />
               </div>
            </section>

            {/* Wiki Footer CTA */}
            <section className="bg-[var(--color-accent-blue)] rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-500/20">
               <div className="text-center md:text-left">
                 <h4 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{t.footer_help}</h4>
                 <p className="font-medium text-blue-100 italic opacity-80">{t.footer_support}</p>
               </div>
               <a href="https://discord.gg/t7bjdm9uDC" target="_blank" rel="noopener noreferrer" className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                  Discord <ExternalLink size={20}/>
               </a>
            </section>

          </div>
        </main>
      </div>

      {/* MOBILE TRIGGER */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)} 
        className="lg:hidden fixed bottom-6 right-6 z-[110] w-14 h-14 bg-[var(--color-accent-blue)] text-white rounded-2xl flex items-center justify-center shadow-2xl"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>
    </div>
  );
}

// Sub-components
function SidebarLink({ icon, label, href, active = false }: any) {
  return (
    <Link href={href} className={`
      flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
      ${active 
        ? "bg-[var(--color-accent-blue)] text-white shadow-lg shadow-blue-500/10" 
        : "text-[var(--color-text-gray)] hover:bg-[var(--color-panel-hover)] hover:text-[var(--color-text)]"}
    `}>
      <span className={`${active ? "text-white" : "group-hover:text-[var(--color-accent-blue)]"} transition-colors`}>{icon}</span>
      <span className="font-bold uppercase italic text-xs tracking-tight">{label}</span>
    </Link>
  );
}

function QuickCard({ href, icon, title, desc, variant }: any) {
  const styles: any = {
    blue: "bg-[var(--color-accent-blue)] text-white border-transparent hover:bg-blue-600",
    white: "bg-[var(--color-panel-bg)] border-[var(--color-border-sharp)] hover:border-[var(--color-accent-blue)]",
    ghost: "bg-transparent border-dashed border-2 border-[var(--color-border-sharp)] hover:border-[var(--color-accent-blue)] hover:bg-[var(--color-panel-bg)]"
  };

  return (
    <Link href={href} className={`
      group p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col h-full
      ${styles[variant]}
    `}>
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 group-hover:rotate-3
        ${variant === 'blue' ? 'bg-white/20' : 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'}
      `}>
        {icon}
      </div>
      <h4 className="text-xl font-black uppercase italic mb-3 tracking-tighter leading-tight">{title}</h4>
      <p className={`text-sm font-medium leading-relaxed italic mb-10 opacity-70 ${variant === 'blue' ? 'text-blue-50' : 'text-[var(--color-text-gray)]'}`}>
        {desc}
      </p>
      <div className="mt-auto flex items-center gap-2 text-[10px] font-[1000] uppercase tracking-widest group-hover:gap-4 transition-all">
        Explore <ArrowRight size={14} />
      </div>
    </Link>
  );
}

function MetricBox({ value, label }: { value: string, label: string }) {
  return (
    <div className="aspect-square bg-[var(--color-bg)] rounded-[2.5rem] border border-[var(--color-border-sharp)] flex flex-col items-center justify-center p-6 text-center group hover:border-[var(--color-accent-blue)] transition-all duration-500">
      <span className="text-4xl font-black italic text-[var(--color-accent-blue)] mb-2 group-hover:scale-110 transition-transform">{value}</span>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-gray)] opacity-60">{label}</span>
    </div>
  );
}

function TechBadge({ icon, text }: any) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border-sharp)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-gray)] hover:text-[var(--color-accent-blue)] transition-colors cursor-default">
      {icon} {text}
    </div>
  );
}
