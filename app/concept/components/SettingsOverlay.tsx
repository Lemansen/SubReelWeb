"use client";

import { useState } from "react";
import {
  ChevronRight,
  Info,
  Cpu,
  Gauge,
  Monitor,
  RefreshCw,
  Rocket,
  Settings,
  Palette,
  Terminal,
  Radio,
  AppWindow,
} from "lucide-react";

interface SettingsOverlayProps {
  isOpen: boolean;
  onCloseSettings: () => void;
  onTabChange: (tab: "main" | "community") => void;
  onOpenAccount: () => void;
  username: string;
  avatarInitials: string;
  allocatedRam: number;
  setAllocatedRam: (ram: number) => void;
  isFullScreen: boolean;
  setIsFullScreen: (val: boolean) => void;
  isAutoUpdate: boolean;
  setIsAutoUpdate: (val: boolean) => void;
  closeOnLaunch: boolean;
  setCloseOnLaunch: (val: boolean) => void;
  WindowControls: React.ComponentType;
}

type TabId = "main_settings" | "appearance" | "launch_params" | "connection" | "terminal" | "about";

export default function SettingsOverlay({
  isOpen,
  onCloseSettings,
  onTabChange,
  onOpenAccount,
  username,
  avatarInitials,
  allocatedRam,
  setAllocatedRam,
  isFullScreen,
  setIsFullScreen,
  isAutoUpdate,
  setIsAutoUpdate,
  closeOnLaunch,
  setCloseOnLaunch,
  WindowControls,
}: SettingsOverlayProps) {

  const [activeTab, setActiveTab] = useState<TabId>("main_settings");
  const ramPct = ((allocatedRam - 2) / (16 - 2)) * 100;

  return (
    <div className={`settings-overlay-panel ${isOpen ? "open" : ""}`}>

      <header className="settings-internal-navbar">
        <div className="logo-zone">
          <span className="logo-icon settings-mode">S</span>
          <div>
            <h3>SubReel</h3>
            <p className="orange-text">Параметры</p>
          </div>
        </div>

        <nav className="nav-links">
          <button onClick={() => { onCloseSettings(); onTabChange("main"); }}>
            Главная
          </button>
          <button onClick={() => { onCloseSettings(); onTabChange("community"); }}>
            Сообщество
          </button>
          <button className="active">
            Настройки
          </button>
        </nav>

        <div className="header-right-zone">
          <button
            type="button"
            className="user-profile-pill"
            onClick={() => { onCloseSettings(); onOpenAccount(); }}
            title="Личный кабинет"
          >
            <div className="avatar-box">{avatarInitials}</div>
            <span className="username-text">{username}</span>
          </button>
          <WindowControls />
        </div>
      </header>

      {/* Оставшийся разметки GRID-макета настроек остается нетронутым */}
      <div className="settings-layout-wrapper">
        <div className="settings-layout">
          <aside className="settings-sidebar">
            <nav className="settings-nav-list">
              <button type="button" className={`settings-nav-item ${activeTab === "main_settings" ? "active" : ""}`} onClick={() => setActiveTab("main_settings")}>
                <Settings size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Основные настройки</span>
                  <span className="settings-nav-hint">Общие параметры</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
              <button type="button" className={`settings-nav-item ${activeTab === "appearance" ? "active" : ""}`} onClick={() => setActiveTab("appearance")}>
                <Palette size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Оформление</span>
                  <span className="settings-nav-hint">Интерфейс и темы</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
              <button type="button" className={`settings-nav-item ${activeTab === "launch_params" ? "active" : ""}`} onClick={() => setActiveTab("launch_params")}>
                <Cpu size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Параметры запуска</span>
                  <span className="settings-nav-hint">Java и выделение ОЗУ</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
              <button type="button" className={`settings-nav-item ${activeTab === "connection" ? "active" : ""}`} onClick={() => setActiveTab("connection")}>
                <Radio size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Соединение</span>
                  <span className="settings-nav-hint">Сеть и прокси-серверы</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
              <button type="button" className={`settings-nav-item ${activeTab === "terminal" ? "active" : ""}`} onClick={() => setActiveTab("terminal")}>
                <Terminal size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Терминал</span>
                  <span className="settings-nav-hint">Логи консоли и отладка</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
              <button type="button" className={`settings-nav-item ${activeTab === "about" ? "active" : ""}`} onClick={() => setActiveTab("about")}>
                <AppWindow size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">О лаунчере</span>
                  <span className="settings-nav-hint">Версия и правовая инфо</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>
            </nav>
            <div className="news-details settings-savebar">
              <div className="detail-item">
                <Info size={16} />
                <span>Изменения применяются на лету.</span>
              </div>
            </div>
          </aside>

          <div className="settings-content">
            {activeTab === "main_settings" && (
              <>
                <div className="patch-header"><h2>Основные настройки</h2><p>Общее поведение приложения лаунчера.</p></div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <div className="settings-card">
                      <div className="settings-card-icon"><RefreshCw size={18} /></div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Автоматическое обновление файлов</h4>
                          <button type="button" role="switch" aria-checked={isAutoUpdate} className={`toggle-switch ${isAutoUpdate ? "on" : ""}`} onClick={() => setIsAutoUpdate(!isAutoUpdate)}><span className="toggle-knob" /></button>
                        </div>
                        <p>Лаунчер будет автоматически проверять и обновлять игровые ассеты перед запуском.</p>
                      </div>
                    </div>
                    <div className="settings-card">
                      <div className="settings-card-icon"><Rocket size={18} /></div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Закрывать лаунчер после запуска</h4>
                          <button type="button" role="switch" aria-checked={closeOnLaunch} className={`toggle-switch ${closeOnLaunch ? "on" : ""}`} onClick={() => setCloseOnLaunch(!closeOnLaunch)}><span className="toggle-knob" /></button>
                        </div>
                        <p>Окно лаунчера будет автоматически закрываться/сворачиваться сразу после успешного старта игры.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "appearance" && (
              <div className="patch-header"><h2>Оформление</h2><p>Компоненты выбора тем будут здесь...</p></div>
            )}
            {activeTab === "launch_params" && (
              <>
                <div className="patch-header">
                  <h2>Параметры запуска</h2>
                  <p>Конфигурация выделения ресурсов и аргументов среды Java.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <div className="settings-card">
                      <div className="settings-card-icon"><Monitor size={18} /></div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Запускать в полноэкранном режиме</h4>
                          <button type="button" role="switch" aria-checked={isFullScreen} className={`toggle-switch ${isFullScreen ? "on" : ""}`} onClick={() => setIsFullScreen(!isFullScreen)}><span className="toggle-knob" /></button>
                        </div>
                        <p>Игра автоматически развернется на весь экран сразу после инициализации движка.</p>
                      </div>
                    </div>
                    <div className="settings-card">
                      <div className="settings-card-icon"><Gauge size={18} /></div>
                      <div className="settings-card-main">
                        <div className="settings-card-head"><h4>Выделение оперативной памяти</h4><span className="settings-value-pill">{allocatedRam} ГБ</span></div>
                        <div className="ram-slider-block">
                          <input type="range" min={2} max={16} step={1} value={allocatedRam} onChange={(e) => setAllocatedRam(Number(e.target.value))} className="ram-slider" style={{ background: `linear-gradient(to right, #4C85FF 0%, #78C8FF ${ramPct}%, rgba(255,255,255,0.08) ${ramPct}%, rgba(255,255,255,0.08) 100%)` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "connection" && <div className="patch-header"><h2>Соединение</h2></div>}
            {activeTab === "terminal" && <div className="patch-header"><h2>Терминал отладки</h2></div>}
            {activeTab === "about" && <div className="patch-header"><h2>О лаунчере</h2><p>SubReel Launcher v1.0.0-beta. Все права защищены.</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}