"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Moon, Sun, Info, Server, Users, 
  Cpu, HardDrive, Network, Copy, 
  CheckCircle2, ExternalLink, ShieldCheck, 
  Activity, Zap, ChevronLeft, Map as MapIcon, 
  BookOpen, Lock, MessageSquare, Smile, HelpCircle, ArrowRight
} from "lucide-react";

const content = {
  RU: {
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_back: "Назад",
    nav_wiki: "Вики",
    about: "Про нас",

    badge_version: "1.20.1 · Java Edition",
    badge_started: "Запущен 10.03.2026",
    
    hero_title_1: "Динамичность.",
    hero_title_2: "Сплочённость.",
    hero_title_3: "Разносторонность.",
    hero_subtitle: "Subreel - это приватный сервер Minecraft с необычным геймплеем! Перед началом игры нужно подать заявку в Discord.",
    
    status_online: "В сети",
    status_players: "Игроков",
    status_version: "Версия 1.20.1",
    ip_label: "Адрес сервера",
    copy_ip: "Копировать IP",
    copied: "Скопировано!",
    join_btn: "Присоединиться",

    wiki_title: "Википедия Subreel",
    wiki_subtitle: "Важно к прочтению",
    wiki_read_more: "Читать дальше",
    
    wiki_cards: [
      { title: "Территории", tag: "Геймплей", desc: "Не придется больше ставить таблички и писать в ДС свою территорию." },
      { title: "Начало игры!", tag: "Основное", desc: "Инструкция «Как зайти на сервер» с поэтапным объяснением от нашей команды." },
      { title: "Вход без пароля", tag: "Аккаунт", desc: "Если вам надоело каждый раз вводить пароль при входе, то можно это выключить (при наличии лицензии)." },
      { title: "2FA", tag: "Аккаунт", desc: "Безопасность аккаунта — превыше всего. Защитите свои данные." },
      { title: "Гильдии", tag: "Геймплей", desc: "Группа людей или друзей, у которых общая цель и общие идеи. Объединение и сплоченность." },
      { title: "Порталы", tag: "Геймплей", desc: "На сервере можно создать порталы любым размером замкнутой формы." }
    ],

    map_title: "Динамическая карта сервера",
    map_desc: "Находите красивые места! Используя карту вам предоставится возможность искать других игроков и планировать постройки.",
    map_btn: "Открыть карту",

    mods_title_1: "Голосовой чат",
    mods_desc_1: "Голосовой чат стирает грань между игрой и реальностью — вы общаетесь с персонажами как вживую. Это основа нашего сервера.",
    mods_title_2: "Эмоции",
    mods_desc_2: "Мод позволит вам ярко выражать свои эмоции на сервере, делая игру ещё атмосфернее.",

    faq_title: "Вопрос – Ответ & FAQ",
    faq_cards: [
      { q: "Какое ядро?", a: "Мы используем оптимизированный форк, который исправляет ошибки и вносит улучшения в производительность." },
      { q: "Какой радиус деспавна?", a: "Полезно знать тем, у кого есть фермы. Радиус уменьшен для оптимизации TPS." },
      { q: "Характеристики VDS?", a: "Intel Core i9-13900K, 128GB DDR5 RAM, NVMe SSD Raid 1. Локация: Германия." }
    ],

    access_title: "Доступ на Subreel",
    access_desc: "Наш сервер — это чистый Minecraft без лишних плагинов и привилегий. Присоединиться могут все желающие.",
    access_cost: "СТОИМОСТЬ ДОСТУПА",
    access_free: "БЕСПЛАТНО",

    rules_btn: "Правила",

    footer_disclaimer: "Не является официальным сервисом Minecraft. Не одобрено Mojang или Microsoft.",
    footer_since: "Существует с 2020 года",
  },
  EN: {
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_back: "Back",
    nav_wiki: "Wiki",
    about: "About Us",

    badge_version: "1.20.1 · Java Edition",
    badge_started: "Started 15.08.2023",

    hero_title_1: "Dynamics.",
    hero_title_2: "Cohesion.",
    hero_title_3: "Versatility.",
    hero_subtitle: "Subreel is a private Minecraft server with unique gameplay! You must apply in Discord before playing.",

    status_online: "Online",
    status_players: "Players",
    status_version: "Version 1.20.1",
    ip_label: "Server Address",
    copy_ip: "Copy IP",
    copied: "Copied!",
    join_btn: "Join Now",

    wiki_title: "Subreel Wiki",
    wiki_subtitle: "Important to read",
    wiki_read_more: "Read more",

    wiki_cards: [
      { title: "Territories", tag: "Gameplay", desc: "No need to place signs and write your territory in Discord anymore." },
      { title: "Getting Started!", tag: "Basics", desc: "Instructions on 'How to join the server' with a step-by-step explanation." },
      { title: "Passwordless Login", tag: "Account", desc: "Tired of entering your password every time? Turn it off (premium account required)." },
      { title: "2FA", tag: "Account", desc: "Account security is paramount. Protect your data." },
      { title: "Guilds", tag: "Gameplay", desc: "A group of people or friends with a common goal and ideas. Unity and cohesion." },
      { title: "Portals", tag: "Gameplay", desc: "You can create portals of any size and closed shape on the server." }
    ],

    map_title: "Dynamic Server Map",
    map_desc: "Find beautiful places! Using the map, you will have the opportunity to look for other players and plan builds.",
    map_btn: "Open Live Map",

    mods_title_1: "Voice Chat",
    mods_desc_1: "Voice chat blurs the line between game and reality — you communicate with characters as if in real life.",
    mods_title_2: "Emotes",
    mods_desc_2: "The mod allows you to express your emotions brightly on the server, making the game even more atmospheric.",

    faq_title: "Q&A & FAQ",
    faq_cards: [
      { q: "What core do you use?", a: "We use an optimized fork that fixes bugs and brings performance improvements." },
      { q: "Mob despawn radius?", a: "Useful for farm builders. The radius is reduced for TPS optimization." },
      { q: "VDS Specs?", a: "Intel Core i9-13900K, 128GB DDR5 RAM, NVMe SSD Raid 1. Location: Germany." }
    ],

    access_title: "Access to Subreel",
    access_desc: "Our server is pure Minecraft without unnecessary plugins and privileges. Everyone can join.",
    access_cost: "ACCESS COST",
    access_free: "FREE",

    rules_btn: "Rules",

    footer_disclaimer: "Not an official Minecraft service. Not approved by Mojang or Microsoft.",
    footer_since: "Since 2020",
  }
};

export default function ServerPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const serverIP = "play.subreel.ru";

  useEffect(() => setMounted(true), []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serverIP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
              <div className="text-[12px] font-bold rounded-lg px-3 py-1.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] uppercase tracking-wider">
                {t.badge_version}
              </div>
              <div className="text-[12px] font-bold rounded-lg px-3 py-1.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] uppercase tracking-wider">
                {t.badge_started}
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-[1000] tracking-[-0.04em] mb-6 uppercase italic leading-[0.9] text-balance">
              <div className="text-[var(--color-text)]">{t.hero_title_1}</div>
              <div className="text-[var(--color-text)]">{t.hero_title_2}</div>
              <div className="text-[var(--color-accent-blue)]">{t.hero_title_3}</div>
            </h1>
            
            <p className="text-lg text-[var(--color-text-gray)] mb-10 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.hero_subtitle}
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <button className="flex items-center gap-3 bg-[var(--color-accent-blue)] text-white px-8 py-4 rounded-xl font-black uppercase italic tracking-wider transition-all hover:bg-blue-600 active:scale-95 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)]">
                {t.join_btn} <ExternalLink size={20} strokeWidth={3} />
              </button>
              
              <button 
                onClick={copyToClipboard} 
                className="flex items-center gap-3 bg-[var(--color-panel-bg)] text-[var(--color-text)] border border-[var(--color-border-sharp)] px-8 py-4 rounded-xl font-black uppercase italic tracking-wider hover:bg-[var(--color-panel-hover)] transition-all active:scale-95"
              >
                {copied ? <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={3} /> : <Copy size={20} strokeWidth={3} />}
                {copied ? t.copied : t.copy_ip}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <StatCard icon={<Users size={32}/>} value="42 / 100" label={t.status_players} color="blue" />
            <StatCard icon={<Zap size={32}/>} value="20.0" label="TPS" color="emerald" />
            <StatCard icon={<ShieldCheck size={32}/>} value="L7" label="DDoS Protection" color="purple" />
            <StatCard icon={<Network size={32}/>} value="1.20.1" label={t.status_version} color="orange" />
          </div>
        </div>
      </section>

      {/* WIKI SECTION */}
      <section className="px-6 py-20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] rounded-[2.5rem] p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-[var(--color-text)]">{t.wiki_title}</h2>
              <p className="text-[var(--color-text-gray)] font-bold uppercase tracking-widest mt-2">{t.wiki_subtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {t.wiki_cards.map((card, idx) => (
                <Link key={idx} href="/wiki" className="bg-[var(--color-bg)] border border-[var(--color-border-sharp)] hover:border-[var(--color-accent-blue)] transition-all rounded-[1.5rem] p-6 flex flex-col justify-between gap-6 group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-black italic text-xl uppercase tracking-tight">{card.title}</h3>
                      <span className="bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-bold uppercase px-3 py-1.5 rounded-md">
                        {card.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-gray)] font-medium leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-accent-blue)] text-xs font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    {t.wiki_read_more} <ArrowRight size={14} strokeWidth={3} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC MAP BANNER */}
      <section className="px-6 py-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[var(--color-panel-bg)] to-[var(--color-accent-blue)]/10 border border-[var(--color-border-sharp)] flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-8">
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <div className="bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] inline-block px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest mb-6">
                Squaremap
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
                {t.map_title}
              </h2>
              <p className="text-[var(--color-text-gray)] font-medium text-lg mb-8 leading-relaxed">
                {t.map_desc}
              </p>
              <Link href="/map" className="inline-flex items-center gap-3 bg-[var(--color-accent-blue)] text-white px-8 py-4 rounded-xl font-black uppercase italic tracking-wider transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-lg">
                <MapIcon size={20} strokeWidth={3} /> {t.map_btn}
              </Link>
            </div>
            <div className="relative w-full md:w-1/2 h-64 md:h-auto flex items-center justify-center opacity-50 pointer-events-none">
               <MapIcon size={200} className="text-[var(--color-accent-blue)]" strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / MODS */}
      <section className="px-6 py-10 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] p-10 md:p-12 rounded-[2.5rem] flex flex-col justify-between">
            <div>
               <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                 <MessageSquare size={28} strokeWidth={2.5} />
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{t.mods_title_1}</h3>
               <p className="text-[var(--color-text-gray)] font-medium text-lg leading-relaxed">{t.mods_desc_1}</p>
            </div>
          </div>

          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] p-10 md:p-12 rounded-[2.5rem] flex flex-col justify-between">
            <div>
               <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                 <Smile size={28} strokeWidth={2.5} />
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{t.mods_title_2}</h3>
               <p className="text-[var(--color-text-gray)] font-medium text-lg leading-relaxed">{t.mods_desc_2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-6 py-20 bg-white/[0.02] border-y border-[var(--color-border-sharp)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-12 text-center">
            {t.faq_title}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.faq_cards.map((faq, idx) => (
              <div key={idx} className="bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] p-8 rounded-[2rem] hover:border-[var(--color-text-gray)] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-bg)] flex items-center justify-center mb-6 text-[var(--color-text-gray)]">
                  <HelpCircle size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight mb-4">{faq.q}</h3>
                <p className="text-[var(--color-text-gray)] font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FREE ACCESS BANNER */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">
            {t.access_title}
          </h2>
          <p className="text-lg md:text-xl text-[var(--color-text-gray)] font-medium mb-12">
            {t.access_desc}
          </p>
          
          <div className="bg-gradient-to-br from-[var(--color-accent-blue)] to-blue-800 p-1 rounded-[3rem]">
            <div className="bg-[var(--color-bg)] rounded-[2.8rem] py-16 px-8 relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-[var(--color-text-gray)] font-bold uppercase tracking-widest text-sm mb-4">
                  {t.access_cost}
                </div>
                <div className="text-6xl md:text-8xl font-[1000] italic uppercase tracking-tighter text-[var(--color-accent-blue)]">
                  {t.access_free}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 mt-auto bg-[var(--color-bg)] border-t border-[var(--color-border-sharp)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-8 text-center sm:text-left">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-8 h-8 bg-[var(--color-accent-blue)] rounded-lg flex items-center justify-center text-white font-bold italic">S</div>
              <span className="font-bold text-xl tracking-tight uppercase italic text-[var(--color-accent-blue)]">Subreel Studio</span>
            </div>
            <p className="text-xs text-[var(--color-text-gray)] max-w-sm mt-2 font-medium">
              {t.footer_disclaimer}
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--color-text-gray)]">
            {t.footer_since}
          </div>
        </div>
      </footer>
    </div>
  );
}

// Карточка статистики
function StatCard({ icon, value, label, color }: { icon: any, value: string, label: string, color: string }) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20"
  };
  return (
    <div className={`bg-[var(--color-card-bg)] border ${colors[color]} p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all hover:scale-[1.02] group`}>
      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-transform group-hover:rotate-3 ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-[1000] tracking-tighter mb-1 uppercase italic leading-none">{value}</div>
      <div className="text-[9px] md:text-[10px] uppercase font-bold text-[var(--color-text-gray)] tracking-widest">{label}</div>
    </div>
  );
}
