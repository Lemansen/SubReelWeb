"use client";

import { useState } from "react";

export default function MinecraftMainMenu() {
  const handleAction = (actionName: string) => {
    alert(`Действие: ${actionName}`);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 select-none overflow-hidden bg-[#121212] text-[#e0e0e0]">
      
      {/* Стили для имитации текстуры кнопок Java Edition */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .mc-font {
          font-family: 'Press Start 2P', monospace;
        }
        .mc-text-shadow {
          text-shadow: 2px 2px 0px #000000;
        }
        /* Увеличенные аутентичные кнопки */
        .mc-btn-large {
          position: relative;
          background-color: #4c321f; /* Характерный темно-древесный цвет интерфейса */
          border: 2px solid #000000;
          box-shadow: inset 3px 3px 0px #7d5738, inset -3px -3px 0px #21130a;
          color: #e0e0e0;
          font-family: 'Press Start 2P', monospace;
          font-size: 13px; /* Крупный пиксельный шрифт */
          text-align: center;
          transition: all 0.05s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0.5px;
        }
        .mc-btn-large:hover {
          background-color: #5c3e29;
          color: #ffffff;
          box-shadow: inset 3px 3px 0px #946946, inset -3px -3px 0px #331d10;
          border-color: #ffffff;
        }
        .mc-btn-large:active {
          box-shadow: inset -3px -3px 0px #7d5738, inset 3px 3px 0px #21130a;
          padding-top: 3px;
        }
      `}</style>

      {/* ── ФОН ИЗ СКРИНШОТА (Шейдеры, зимний биом) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-[0.4] contrast-[1.1] scale-100"
          style={{ 
            // Реалистичный зимний ночной пейзаж деревни
            backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000')` 
          }}
        />
        {/* Мягкое виньетирование */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* ── ВЕРХ: МЕСТО ПОД PNG ЛОГОТИП СЕLESTIA 3.0 ── */}
      <div className="relative mt-16 flex flex-col items-center z-10 w-full max-w-[550px]">
        {/* Замени src на путь к твоему готовому прозрачному PNG-файлу с логотипом.
          h-auto и w-full автоматически адаптируют изображение под ширину.
        */}
        <img 
          src="/path-to-your-celestia-logo.png" 
          alt="CELESTIA 3.0 LOGO" 
          className="w-full h-auto drop-shadow-[0_8px_12px_rgba(0,0,0,0.65)] select-none pointer-events-none"
          onError={(e) => {
            // Резервный плейсхолдер, если картинка не загрузится (чтобы не было пустого места)
            e.currentTarget.style.display = 'none';
            const backup = document.getElementById('backup-logo');
            if (backup) backup.style.display = 'flex';
          }}
        />
        
        {/* Резервный стилизованный текстовый блок (пока картинки нет) */}
        <div id="backup-logo" className="hidden flex-col items-center mc-font select-none">
          <div className="text-[#fbaa29] text-5xl md:text-7xl font-bold tracking-tight" style={{ textShadow: "4px 4px 0px #3a1a05, 6px 6px 0px #000000" }}>
            CELESTIA
          </div>
          <div className="text-[#fbaa29] text-4xl md:text-5xl font-bold tracking-tight mt-2" style={{ textShadow: "4px 4px 0px #3a1a05, 6px 6px 0px #000000" }}>
            3.0
          </div>
        </div>
      </div>

      {/* ── ЦЕНТР: МАССИВНАЯ СЕТКА КНОПОК ОДИН В ОДИН С ФОТО ── */}
      {/* Максимальная ширина увеличена до 480px, кнопки стали крупнее и солиднее */}
      <div className="w-full max-w-[480px] flex flex-col z-10 px-4 mb-20 gap-3">
        
        {/* Кнопка 1: Одиночная игра */}
        <button onClick={() => handleAction("Singleplayer")} className="mc-btn-large w-full h-12">
          <div className="flex items-center gap-3 mc-text-shadow">
            <span className="text-[12px]">🟫</span>
            <span>Одиночная игра</span>
            <span className="text-[12px]">🟫</span>
          </div>
        </button>

        {/* Кнопка 2: Сетевая игра */}
        <button onClick={() => handleAction("Multiplayer")} className="mc-btn-large w-full h-12">
          <div className="flex items-center gap-3 mc-text-shadow">
            <span className="text-[12px]">🏹</span>
            <span>Сетевая игра</span>
            <span className="text-[12px]">🏹</span>
          </div>
        </button>

        {/* Пробел-разделитель между основными кнопками и нижним блоком моддинга */}
        <div className="h-10" />

        {/* Блок: МОДЫ с боковыми квадратными кнопками */}
        <div className="flex gap-2 w-full">
          {/* Левый квадрат (Очки) */}
          <button onClick={() => handleAction("Goggles")} className="mc-btn-large w-12 h-12 shrink-0">
            <span className="mc-text-shadow text-base">👓</span>
          </button>
          
          {/* Центр: Кнопка Моды */}
          <button onClick={() => handleAction("Mods")} className="mc-btn-large grow h-12">
            <div className="flex items-center gap-4 mc-text-shadow">
              <span>Моды</span>
              <span className="text-[#55ffff] text-[11px]">💎</span>
            </div>
          </button>

          {/* Правый квадрат (Фигурка Стива) */}
          <button onClick={() => handleAction("Skin")} className="mc-btn-large w-12 h-12 shrink-0">
            <span className="mc-text-shadow text-base">🧍</span>
          </button>
        </div>

        {/* Самый нижний ряд: Настройки и Выход */}
        <div className="flex gap-3 w-full">
          {/* Настройки... */}
          <button onClick={() => handleAction("Options")} className="mc-btn-large flex-1 h-12">
            <div className="flex items-center gap-2 mc-text-shadow">
              <span className="text-[11px] opacity-75">⚙️</span>
              <span>Настройки...</span>
            </div>
          </button>

          {/* Выйти из игры */}
          <button onClick={() => handleAction("Quit")} className="mc-btn-large flex-1 h-12">
            <div className="flex items-center gap-2 mc-text-shadow">
              <span>Выйти из игры</span>
              <span className="text-[11px] opacity-75">🚪</span>
            </div>
          </button>
        </div>

      </div>

      {/* ── НИЗ: СТРОКА С КОПИРАЙТОМ MOJANG ── */}
      <div className="w-full flex justify-end items-center z-10 px-4 pb-2 mc-font text-[11px] text-[#b0b0b0]">
        <div className="mc-text-shadow tracking-wide select-none opacity-85">
          Copyright Mojang AB. Do not distribute!
        </div>
      </div>

    </div>
  );
}