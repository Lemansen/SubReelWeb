"use client";

import { useState } from "react";
import {
  Flame,
  X,
  Settings,
  Compass,
  Home as HomeIcon,
  Layers,
  FolderOpen,
  Minus,
  Square,
} from "lucide-react";
import NewsPanel from "./components/NewsPanel";
import SettingsOverlay from "./components/SettingsOverlay";
import AccountOverlay from "./components/AccountOverlay";

export default function Launcher() {
  // === Состояния экранов и вкладок ===
  const [activeOverlay, setActiveOverlay] = useState<"none" | "news" | "settings" | "account">("none");
  const [activeTab, setActiveTab] = useState<"main" | "community">("main");

  // Состояния игрового процесса
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Проверка файлов...");
  const [isReady, setIsReady] = useState(false);

  // Состояния конфигурации
  const [allocatedRam, setAllocatedRam] = useState(4);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAutoUpdate, setIsAutoUpdate] = useState(true);
  const [closeOnLaunch, setCloseOnLaunch] = useState(true);

  // === Логика управления оконным режимом ===
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const closeLauncher = () => {
    window.location.href = "/";
  };

  // Общий компонент управления окном
  const WindowControls = () => (
    <div className="window-controls">
      <button className="window-btn" title="Свернуть (Компактный режим)">
        <Minus size={14} />
      </button>
      <button className="window-btn" onClick={toggleFullscreen} title="Развернуть на весь экран">
        <Square size={11} />
      </button>
      <button className="window-btn close" onClick={closeLauncher} title="Закрыть">
        <X size={14} />
      </button>
    </div>
  );

  const handlePlayClick = () => {
    if (isPlaying || isReady) return;

    setIsPlaying(true);
    setProgress(0);
    setLoadingText("Проверка файлов...");

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 2;
        if (next >= 100) {
          clearInterval(interval);
          setLoadingText("Готово!");
          setIsReady(true);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  return (
    <main className="launcher-container">
      <div className="app-shell">
        
        {/* === ОСНОВНОЙ ВЕРХНИЙ НАВБАР === */}
        <header className={`navbar ${activeOverlay !== "none" ? "displaced-top" : ""}`}>
          <div className="logo-zone">
            <span className="logo-icon">S</span>
            <div>
              <h3>SubReel</h3>
              <p>v0.1.0</p>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={activeTab === "main" && activeOverlay === "none" ? "active" : ""}
              onClick={() => { setActiveTab("main"); setActiveOverlay("none"); }}
            >
              <HomeIcon size={16} /> Главная
            </button>
            <button
              className={activeTab === "community" && activeOverlay === "none" ? "active" : ""}
              onClick={() => { setActiveTab("community"); setActiveOverlay("none"); }}
            >
              <Compass size={16} /> Сообщество
            </button>
            <button
              className={activeOverlay === "settings" ? "active" : ""}
              onClick={() => setActiveOverlay("settings")}
            >
              <Settings size={16} /> Настройки
            </button>
          </nav>

          <div className="header-right-zone">
            {/* КНОПКА АККАУНТА ПО МАКЕТУ */}
            <button 
              type="button"
              className={`user-profile-pill ${activeOverlay === "account" ? "active" : ""}`}
              onClick={() => setActiveOverlay("account")}
              title="Личный кабинет"
            >
              <div className="avatar-box">LM</div>
              <span className="username-text">Lemansen</span>
            </button>
            <WindowControls />
          </div>
        </header>

        {/* === ЦЕНТРАЛЬНЫЙ ОСНОВНОЙ КОНТЕНТ === */}
        <main className={`content ${activeOverlay !== "none" ? "fade-out-content" : ""}`}>
          {activeTab === "main" ? (
            <div className="tab-wrapper">
              <button className="news-chip" onClick={() => setActiveOverlay("news")}>
                <Flame size={16} className="fire-icon" />
                <span>Свежие новости проекта</span>
              </button>

              <div className="center-hero">
                <h1>Survival Reborn</h1>
                <p>Добро пожаловать на обновленный технологичный клиент SubReel.</p>
              </div>
            </div>
          ) : (
            <div className="center-hero">
              <h1>Сообщество</h1>
              <p>Раздел в разработке.</p>
            </div>
          )}
        </main>

        {/* === ОСНОВНОЙ НИЖНИЙ ПОДВАЛ === */}
        <footer className={`bottom-bar ${activeOverlay !== "none" ? "displaced-bottom" : ""}`}>
          <div className="bottom-left">
            <button className="secondary-btn custom-btn-1">
              <Layers size={16} />
              <span>Создать сборку</span>
            </button>
            <button className="secondary-btn custom-btn-2">
              <FolderOpen size={16} />
              <span>Выбрать версию</span>
            </button>
          </div>

          <div className={`bottom-right ${isPlaying ? "active" : ""}`}>
            <div className="progress-wrapper">
              <div className="progress-info">
                <span>{loadingText}</span>
                <span>{progress}%</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <button
              className={`play-btn ${isPlaying && !isReady ? "loading-state" : ""} ${isReady ? "ready-state" : ""}`}
              onClick={handlePlayClick}
            >
              {isReady ? "ЗАПУСК" : isPlaying ? "ЗАГРУЗКА..." : "ИГРАТЬ"}
            </button>
          </div>
        </footer>

{/* === ДОЧЕРНИЙ КОМПОНЕНТ НАСТРОЕК === */}
<SettingsOverlay
  isOpen={activeOverlay === "settings"}
  onCloseSettings={() => setActiveOverlay("none")}
  onTabChange={(tab) => setActiveTab(tab)}
  onOpenAccount={() => setActiveOverlay("account")} // <-- ДОБАВИТЬ ЭТУ СТРОЧКУ
  allocatedRam={allocatedRam}
  setAllocatedRam={setAllocatedRam}
  isFullScreen={isFullScreen}
  setIsFullScreen={setIsFullScreen}
  isAutoUpdate={isAutoUpdate}
  setIsAutoUpdate={setIsAutoUpdate}
  closeOnLaunch={closeOnLaunch}
  setCloseOnLaunch={setCloseOnLaunch}
  WindowControls={WindowControls}
/>

        {/* === ДОЧЕРНИЙ КОМПОНЕНТ НОВОСТЕЙ === */}
        <NewsPanel
          isOpen={activeOverlay === "news"}
          onClose={() => setActiveOverlay("none")}
        />

        {/* === ДОЧЕРНИЙ КОМПОНЕНТ АККАУНТА === */}
        <AccountOverlay 
          isOpen={activeOverlay === "account"}
          onCloseAccount={() => setActiveOverlay("none")}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenSettings={() => setActiveOverlay("settings")}
          WindowControls={WindowControls}
        />

      </div>
    </main>
  );
}