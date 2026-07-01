"use client";

import { useState, useEffect, useRef } from "react";
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
import BootOverlay from "./components/BootOverlay";
import WelcomeOverlay from "./components/WelcomeOverlay";

export default function Launcher() {
  // === Состояния авторизации и профиля ===
  const [username, setUsername] = useState<string>("Gamer");
  const [inputName, setInputName] = useState<string>("");

  // === Фазы приложения: загрузка (boot) -> приветствие (welcome) -> лаунчер (launcher) ===
  const [appPhase, setAppPhase] = useState<"boot" | "welcome" | "launcher">("boot");
  const [bootFading, setBootFading] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState("Инициализация лаунчера...");
  const bootFinishedRef = useRef(false);

  // Симуляция загрузки/проверки при первом заходе на страницу
  useEffect(() => {
    const stages = [
      { at: 0, text: "Инициализация лаунчера..." },
      { at: 18, text: "Проверка файлов конфигурации..." },
      { at: 40, text: "Проверка обновлений..." },
      { at: 62, text: "Синхронизация с сервером..." },
      { at: 85, text: "Проверка учётной записи..." },
      { at: 100, text: "Готово!" },
    ];

    const interval = setInterval(() => {
      setBootProgress((prev) => {
        if (bootFinishedRef.current) return prev;

        const next = Math.min(prev + Math.floor(Math.random() * 9) + 4, 100);

        // Обновляем текст статуса по достигнутому порогу
        const stage = [...stages].reverse().find((s) => next >= s.at);
        if (stage) setBootStatus(stage.text);

        if (next >= 100) {
          bootFinishedRef.current = true;
          clearInterval(interval);

          // Небольшая пауза, чтобы пользователь увидел "Готово!"
          setTimeout(() => {
            setBootFading(true);

            // Ждём завершения css-перехода (fade-out), затем решаем куда идти
            setTimeout(() => {
              const savedName =
                typeof window !== "undefined"
                  ? localStorage.getItem("subreel_username")
                  : null;

              if (savedName) {
                setUsername(savedName);
                setAppPhase("launcher");
              } else {
                setAppPhase("welcome");
              }
            }, 450);
          }, 500);
        }

        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  // Хендлер сохранения никнейма вручную
  const handleSaveNickname = (name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      setUsername(trimmed);
      localStorage.setItem("subreel_username", trimmed);
      setAppPhase("launcher");
    }
  };

  // Имитация авторизации через существующий аккаунт
  const handleAccountLogin = () => {
    // В будущем тут будет полноценный запрос к серверу авторизации
    handleSaveNickname("Lemansen");
  };

  // Имитация регистрации нового аккаунта
  const handleAccountRegister = () => {
    // В будущем тут будет полноценный запрос на создание аккаунта
    handleSaveNickname("NewPlayer");
  };

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

  // Инициалы для аватарки (первые 2 буквы)
  const avatarInitials = username.slice(0, 2).toUpperCase();

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
            <button
              type="button"
              className={`user-profile-pill ${activeOverlay === "account" ? "active" : ""}`}
              onClick={() => setActiveOverlay("account")}
              title="Личный кабинет"
            >
              <div className="avatar-box">{avatarInitials}</div>
              <span className="username-text">{username}</span>
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
                <p>Добро пожаловать, <span style={{ color: "#78C8FF" }}>{username}</span>! Рады видеть тебя на технологичном клиенте SubReel.</p>
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
          onOpenAccount={() => setActiveOverlay("account")}
          username={username}
          avatarInitials={avatarInitials}
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
          username={username}
          avatarInitials={avatarInitials}
          onChangeNickname={handleSaveNickname}
          WindowControls={WindowControls}
        />

        {/* === ЭКРАН ЗАГРУЗКИ / ПРОВЕРКИ (BOOT OVERLAY) === */}
        <BootOverlay
          isOpen={appPhase === "boot"}
          isFading={bootFading}
          progress={bootProgress}
          status={bootStatus}
        />

        {/* === СТАРТОВОЕ ОКНО: ВЫБОР РЕЖИМА ВХОДА (WELCOME OVERLAY) === */}
        <WelcomeOverlay
          isOpen={appPhase === "welcome"}
          inputName={inputName}
          onInputChange={setInputName}
          onSubmitNickname={handleSaveNickname}
          onLogin={handleAccountLogin}
          onRegister={handleAccountRegister}
        />

      </div>
    </main>
  );
}