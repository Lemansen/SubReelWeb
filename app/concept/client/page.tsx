"use client";

import { useState, useEffect } from "react";
import { Globe, Monitor, Shield, Settings, LogOut, HelpCircle } from "lucide-react";

// Локализация в стиле оригинальной игры
const translations = {
  RU: {
    title: "SUBREEL",
    singleplayer: "Одиночная игра (Лаунчер)",
    multiplayer: "Сетевая игра (Сервер)",
    realms: "Subreel Realms (В планах)",
    options: "Настройки...",
    quit: "Выйти из игры",
    copyright: "Copyright Subreel Studio. Не является официальным продуктом Mojang.",
    alert_dev: "Этот раздел находится в разработке!",
  },
  EN: {
    title: "SUBREEL",
    singleplayer: "Singleplayer (Launcher)",
    multiplayer: "Multiplayer (Server)",
    realms: "Subreel Realms (Planned)",
    options: "Options...",
    quit: "Quit Game",
    copyright: "Copyright Subreel Studio. Not an official Mojang product.",
    alert_dev: "This section is under development!",
  }
};

const SPLASH_TEXTS = [
  "В стиле Java Edition!",
  "Пиксели рулят!",
  "Subreel UI 2.0!",
  "100% аутентично!",
  "Попробуй навести на кнопку!",
  "Тянет на максималках!",
  "Включай шейдеры!",
];

export default function MinecraftMainMenu() {
  const [lang, setLang] = useState<"RU" | "EN">("RU");
  const [splash, setSplash] = useState("");

  const t = translations[lang];

  useEffect(() => {
    const randomText = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
    setSplash(randomText);
  }, [lang]);

  const handleAction = (actionName: string, isAvailable = true) => {
    if (!isAvailable) {
      alert(t.alert_dev);
      return;
    }
    alert(`Действие: ${actionName}`);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#141414] flex flex-col items-center justify-between p-4 font-mono select-none overflow-hidden">
      
      {/* Стили для кастомных анимаций (Панорама и Сплэш) */}
      <style jsx global>{`
        @keyframes mc-panorama {
          0% { transform: scale(1.3) rotate(0deg); }
          100% { transform: scale(1.3) rotate(360deg); }
        }
        @keyframes mc-splash {
          0%, 100% { transform: scale(1) rotate(-15deg); }
          50% { transform: scale(1.12) rotate(-15deg); }
        }
        .animate-mc-panorama {
          animation: mc-panorama 180s linear infinite;
        }
        .animate-mc-splash {
          animation: mc-splash 0.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── ФОН: Вращающаяся размытая панорама из Майнкрафта ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-125 animate-mc-panorama"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=2000')` 
          }}
        />
        {/* Фирменное темное виньетирование поверх панорамы */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 mix-blend-multiply" />
      </div>

      {/* ── ВЕРХНЯЯ ЧАСТЬ: ДВУХСЛОЙНЫЙ 3D ЛОГОТИП И ЖЕЛТЫЙ ТЕКСТ ── */}
      <div className="relative mt-16 md:mt-24 flex flex-col items-center z-10">
        {/* Главный заголовок с жесткими пиксельными тенями в стиле блоков */}
        <h1 
          className="text-6xl md:text-9xl font-[1000] tracking-widest text-[#eeeeee] uppercase italic text-center drop-shadow-[5px_5px_0px_#1e3a8a]"
          style={{
            textShadow: "4px 4px 0px #000000, 8px 8px 0px #1d4ed8"
          }}
        >
          {t.title}
        </h1>
        
        {/* Пульсирующий желтый сплэш-текст */}
        {splash && (
          <div className="absolute -bottom-5 right-[-10px] md:right-[-40px] transform origin-center z-20 animate-mc-splash">
            <span 
              className="text-[#ffff55] text-xs md:text-base font-black tracking-wider uppercase drop-shadow-[2px_2px_0px_#3f3f00]"
              style={{ textShadow: "2px 2px 0px #3f3f00" }}
            >
              {splash}
            </span>
          </div>
        )}
      </div>

      {/* ── ЦЕНТР: СТРУКТУРА КНОПОК 1-В-1 КАК В ИГРЕ ── */}
      <div className="w-full max-w-sm md:max-w-lg flex flex-col gap-3 z-10 px-4 my-auto">
        
        {/* Кнопка 1: Одиночная игра */}
        <button
          onClick={() => handleAction("Singleplayer")}
          className="relative w-full h-11 bg-[#6c6c6c] border-2 border-black text-[#e0e0e0] font-bold uppercase text-sm tracking-wide shadow-[inset_2px_2px_0px_#afafaf,inset_-2px_-2px_0px_#3f3f3f] transition-all hover:bg-[#4a5fbf] hover:text-[#ffffa0] hover:shadow-[inset_2px_2px_0px_#7ca0ff,inset_-2px_-2px_0px_#233175] active:pt-1 active:shadow-[inset_-2px_-2px_0px_#afafaf,inset_2px_2px_0px_#3f3f3f]"
        >
          <div className="flex items-center justify-center gap-2 drop-shadow-[2px_2px_0px_#000]">
            <Monitor size={16} className="opacity-60" />
            {t.singleplayer}
          </div>
        </button>

        {/* Кнопка 2: Сетевая игра */}
        <button
          onClick={() => handleAction("Multiplayer")}
          className="relative w-full h-11 bg-[#6c6c6c] border-2 border-black text-[#e0e0e0] font-bold uppercase text-sm tracking-wide shadow-[inset_2px_2px_0px_#afafaf,inset_-2px_-2px_0px_#3f3f3f] transition-all hover:bg-[#4a5fbf] hover:text-[#ffffa0] hover:shadow-[inset_2px_2px_0px_#7ca0ff,inset_-2px_-2px_0px_#233175] active:pt-1 active:shadow-[inset_-2px_-2px_0px_#afafaf,inset_2px_2px_0px_#3f3f3f]"
        >
          <div className="flex items-center justify-center gap-2 drop-shadow-[2px_2px_0px_#000]">
            <Shield size={16} className="opacity-60" />
            {t.multiplayer}
          </div>
        </button>

        {/* Кнопка 3: Realms (Недоступна) */}
        <button
          onClick={() => handleAction("Realms", false)}
          className="relative w-full h-11 bg-[#3a3a3a] border-2 border-[#262626] text-[#7a7a7a] font-bold uppercase text-sm tracking-wide shadow-[inset_2px_2px_0px_#4a4a4a,inset_-2px_-2px_0px_#1a1a1a] opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2 drop-shadow-[2px_2px_0px_#000]">
            {t.realms}
          </div>
        </button>

        {/* Сет Нижних Кнопок: [Язык] [Настройки...] [Выход] */}
        <div className="flex gap-3 w-full mt-2">
          
          {/* Маленькая квадратная кнопка выбора языка (Глобус) */}
          <button
            onClick={() => setLang(lang === "RU" ? "EN" : "RU")}
            title="Сменить язык / Switch Language"
            className="relative w-11 h-11 bg-[#6c6c6c] border-2 border-black text-[#e0e0e0] flex items-center justify-center shrink-0 shadow-[inset_2px_2px_0px_#afafaf,inset_-2px_-2px_0px_#3f3f3f] transition-all hover:bg-[#4a5fbf] hover:text-[#ffffa0] hover:shadow-[inset_2px_2px_0px_#7ca0ff,inset_-2px_-2px_0px_#233175] active:pt-1"
          >
            <Globe size={18} className="drop-shadow-[2px_2px_0px_#000]" />
          </button>

          {/* Настройки */}
          <button
            onClick={() => handleAction("Options")}
            className="relative grow h-11 bg-[#6c6c6c] border-2 border-black text-[#e0e0e0] font-bold uppercase text-xs sm:text-sm tracking-wide shadow-[inset_2px_2px_0px_#afafaf,inset_-2px_-2px_0px_#3f3f3f] transition-all hover:bg-[#4a5fbf] hover:text-[#ffffa0] hover:shadow-[inset_2px_2px_0px_#7ca0ff,inset_-2px_-2px_0px_#233175] active:pt-1"
          >
            <div className="flex items-center justify-center gap-2 drop-shadow-[2px_2px_0px_#000]">
              <Settings size={14} className="opacity-60" />
              {t.options}
            </div>
          </button>

          {/* Выход из игры */}
          <button
            onClick={() => handleAction("Quit")}
            className="relative grow h-11 bg-[#6c6c6c] border-2 border-black text-[#e0e0e0] font-bold uppercase text-xs sm:text-sm tracking-wide shadow-[inset_2px_2px_0px_#afafaf,inset_-2px_-2px_0px_#3f3f3f] transition-all hover:bg-[#b91c1c] hover:text-[#ffffa0] hover:shadow-[inset_2px_2px_0px_#ef4444,inset_-2px_-2px_0px_#7f1d1d] active:pt-1"
          >
            <div className="flex items-center justify-center gap-2 drop-shadow-[2px_2px_0px_#000]">
              <LogOut size={14} className="opacity-60" />
              {t.quit}
            </div>
          </button>
        </div>

      </div>

      {/* ── НИЖНЯЯ ПАНЕЛЬ И СЛУЖЕБНЫЕ НАДПИСИ ── */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-zinc-400 font-bold tracking-wider z-10">
        <div className="drop-shadow-[1.5px_1.5px_0px_#000]">
          Subreel Minecraft-Edition <span className="text-[#55ff55]">v1.20.26-Beta</span>
        </div>
        <div className="text-center sm:text-right max-w-md opacity-70 drop-shadow-[1.5px_1.5px_0px_#000]">
          {t.copyright}
        </div>
      </div>

    </div>
  );
}