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
import LaunchAnimation from "./components/LaunchAnimation";
import VideoOverlay from "./components/VideoOverlay";
import ModpackOverlay from "./components/ModpackOverlay";
import VersionPickerOverlay from "./components/VersionPickerOverlay";

interface WindowControlsProps {
  toggleFullscreen: () => void;
  closeLauncher: () => void;
}

const WindowControls = ({ toggleFullscreen, closeLauncher }: WindowControlsProps) => (
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

export default function Launcher() {
  const [username, setUsername] = useState<string>("Gamer");
  const [inputName, setInputName] = useState<string>("");

  const [appPhase, setAppPhase] = useState<"boot" | "welcome" | "launcher">("boot");
  const [bootFading, setBootFading] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState("Инициализация лаунчера...");
  const bootFinishedRef = useRef(false);

  const [launchStage, setLaunchStage] = useState<"idle" | "flying" | "video">("idle");
  const playBtnRef = useRef<HTMLButtonElement>(null);

  const [selectedVersion, setSelectedVersion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("subreel_version") || "1.21.1";
    }
    return "1.21.1";
  });

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    localStorage.setItem("subreel_version", version);
    console.log("✅ Выбрана версия:", version);
  };

  useEffect(() => {
    const savedName = typeof window !== "undefined" ? localStorage.getItem("subreel_username") : null;
    if (savedName) setUsername(savedName);

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
        const stage = [...stages].reverse().find((s) => next >= s.at);
        if (stage) setBootStatus(stage.text);

        if (next >= 100) {
          bootFinishedRef.current = true;
          clearInterval(interval);
          setTimeout(() => {
            setBootFading(true);
            setTimeout(() => {
              if (savedName) {
                setAppPhase("launcher");
              } else {
                setAppPhase("welcome");
              }
            }, 450);
          }, 500);
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const handleSaveNickname = (name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      setUsername(trimmed);
      localStorage.setItem("subreel_username", trimmed);
      setAppPhase("launcher");
    }
  };

  const handleAccountLogin = () => console.log("Авторизация аккаунта вызвана");
  const handleAccountRegister = () => console.log("Регистрация аккаунта вызвана");

  const [activeOverlay, setActiveOverlay] = useState<
    "none" | "news" | "settings" | "account" | "modpack" | "version"
  >("none");

  const [activeTab, setActiveTab] = useState<"main" | "community">("main");

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Проверка файлов...");
  const [isReady, setIsReady] = useState(false);

  const [allocatedRam, setAllocatedRam] = useState(4);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAutoUpdate, setIsAutoUpdate] = useState(true);
  const [closeOnLaunch, setCloseOnLaunch] = useState(true);

  const avatarInitials = username.slice(0, 2).toUpperCase();

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const closeLauncher = () => {
    window.location.href = "/";
  };

  const handlePlayClick = () => {
    if (isReady) {
      alert(`Запуск Minecraft ${selectedVersion}... Удачной игры на SubReel!`);
      return;
    }
    if (isPlaying) return;

    setIsPlaying(true);
    setProgress(0);
    setLoadingText("Проверка файлов...");

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 12) + 3, 100);
        if (next >= 50 && prev < 50) setLoadingText("Загрузка...");

        if (next >= 100) {
          clearInterval(interval);
          setLoadingText("Готово!");
          setTimeout(() => {
            setLaunchStage("flying");
          }, 400);
          return 100;
        }
        return next;
      });
    }, 150);
  };

  return (
    <main className="launcher-container">
      <div className="app-shell">
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
            <WindowControls toggleFullscreen={toggleFullscreen} closeLauncher={closeLauncher} />
          </div>
        </header>

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

        <footer className={`bottom-bar ${activeOverlay !== "none" ? "displaced-bottom" : ""}`}>
          <div className="bottom-left">
            <button className="secondary-btn custom-btn-1" onClick={() => setActiveOverlay("modpack")}>
              <Layers size={16} />
              <span>Создать сборку</span>
            </button>
            <button className="secondary-btn custom-btn-2" onClick={() => setActiveOverlay("version")}>
              <FolderOpen size={16} />
              <span>Версия: {selectedVersion}</span>
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
              ref={playBtnRef}
              className={`play-btn ${isPlaying && !isReady ? "loading-state" : ""} ${isReady ? "ready-state" : ""}`}
              onClick={handlePlayClick}
            >
              {isReady ? "ЗАПУСК" : isPlaying ? "ЗАГРУЗКА..." : "ИГРАТЬ"}
            </button>
          </div>
        </footer>

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
          WindowControls={() => <WindowControls toggleFullscreen={toggleFullscreen} closeLauncher={closeLauncher} />}
        />

        <NewsPanel isOpen={activeOverlay === "news"} onClose={() => setActiveOverlay("none")} />

        <AccountOverlay
          isOpen={activeOverlay === "account"}
          onCloseAccount={() => setActiveOverlay("none")}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenSettings={() => setActiveOverlay("settings")}
          username={username}
          avatarInitials={avatarInitials}
          onChangeNickname={setUsername}
          WindowControls={() => <WindowControls toggleFullscreen={toggleFullscreen} closeLauncher={closeLauncher} />}
        />

        <BootOverlay isOpen={appPhase === "boot"} isFading={bootFading} progress={bootProgress} status={bootStatus} />

        <WelcomeOverlay
          isOpen={appPhase === "welcome"}
          inputName={inputName}
          onInputChange={setInputName}
          onSubmitNickname={handleSaveNickname}
          onLogin={handleAccountLogin}
          onRegister={handleAccountRegister}
        />

        <VersionPickerOverlay
          isOpen={activeOverlay === "version"}
          onClose={() => setActiveOverlay("none")}
          currentVersion={selectedVersion}
          onSelectVersion={handleVersionSelect}
        />

        <ModpackOverlay isOpen={activeOverlay === "modpack"} onClose={() => setActiveOverlay("none")} />

        <LaunchAnimation
          isActive={launchStage === "flying"}
          triggerRef={playBtnRef}
          onComplete={() => setLaunchStage("video")}
        />

        <VideoOverlay
          isOpen={launchStage === "video"}
          onClose={(isFinished) => {
            setLaunchStage("idle");
            if (isFinished) {
              setIsReady(true);
            } else {
              setIsPlaying(false);
              setProgress(0);
              setLoadingText("Проверка файлов...");
              setIsReady(false);
            }
          }}
          videoSrc="/videos/promo.mp4"
        />
      </div>
    </main>
  );
}