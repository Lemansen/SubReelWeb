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
  Settings,    // Основные настройки
  Palette,     // Оформление
  Terminal,    // Терминал
  Radio,       // Соединение (или Link/Wifi)
  AppWindow    // О лаунчере
} from "lucide-react";

interface SettingsOverlayProps {
  isOpen: boolean;
  onCloseSettings: () => void;
  onTabChange: (tab: "main" | "community") => void;
  onOpenAccount: () => void;
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
      
      {/* ========================================================== */}
      {/* ВЕРХНЯЯ ПАНЕЛЬ НАВИГАЦИИ (НАВБАР)                          */}
      {/* ========================================================== */}
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
            <div className="avatar-box">LM</div>
            <span className="username-text">Lemansen</span>
          </button>
          <WindowControls />
        </div>
      </header>

      {/* ========================================================== */}
      {/* ОСНОВНОЙ ПРОВОДНИК НАСТРОЕК (GRID-МАКЕТ)                   */}
      {/* ========================================================== */}
      <div className="settings-layout-wrapper">
        <div className="settings-layout">
          
          {/* ЛЕВАЯ КОЛОНКА: Навигация по всем разделам параметров */}
          <aside className="settings-sidebar">

            <nav className="settings-nav-list">
              
              {/* 1. Основные настройки */}
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "main_settings" ? "active" : ""}`}
                onClick={() => setActiveTab("main_settings")}
              >
                <Settings size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Основные настройки</span>
                  <span className="settings-nav-hint">Общие параметры</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>

              {/* 2. Оформление */}
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "appearance" ? "active" : ""}`}
                onClick={() => setActiveTab("appearance")}
              >
                <Palette size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Оформление</span>
                  <span className="settings-nav-hint">Интерфейс и темы</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>

              {/* 3. Параметры запуска */}
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "launch_params" ? "active" : ""}`}
                onClick={() => setActiveTab("launch_params")}
              >
                <Cpu size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Параметры запуска</span>
                  <span className="settings-nav-hint">Java и выделение ОЗУ</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>

              {/* 4. Соединение */}
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "connection" ? "active" : ""}`}
                onClick={() => setActiveTab("connection")}
              >
                <Radio size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Соединение</span>
                  <span className="settings-nav-hint">Сеть и прокси-серверы</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>

              {/* 5. Терминал */}
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "terminal" ? "active" : ""}`}
                onClick={() => setActiveTab("terminal")}
              >
                <Terminal size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Терминал</span>
                  <span className="settings-nav-hint">Логи консоли и отладка</span>
                </span>
                <ChevronRight size={16} className="settings-nav-chevron" />
              </button>

              {/* 6. О лаунчере */}
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "about" ? "active" : ""}`}
                onClick={() => setActiveTab("about")}
              >
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

          {/* ПРАВАЯ КОЛОНКА: Контент выбранной вкладки */}
          <div className="settings-content">
            
            {/* -------------------------------------------------------- */}
            {/* 1. КОНТЕНТ: ОСНОВНЫЕ НАСТРОЙКИ                           */}
            {/* -------------------------------------------------------- */}
            {activeTab === "main_settings" && (
              <>
                <div className="patch-header">
                  <h2>Основные настройки</h2>
                  <p>Общее поведение приложения лаунчера.</p>
                </div>

                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    
                    <div className="settings-card">
                      <div className="settings-card-icon">
                        <RefreshCw size={18} />
                      </div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Автоматическое обновление файлов</h4>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAutoUpdate}
                            className={`toggle-switch ${isAutoUpdate ? "on" : ""}`}
                            onClick={() => setIsAutoUpdate(!isAutoUpdate)}
                          >
                            <span className="toggle-knob" />
                          </button>
                        </div>
                        <p>Лаунчер будет автоматически проверять и обновлять игровые ассеты перед запуском.</p>
                      </div>
                    </div>

                    <div className="settings-card">
                      <div className="settings-card-icon">
                        <Rocket size={18} />
                      </div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Закрывать лаунчер после запуска</h4>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={closeOnLaunch}
                            className={`toggle-switch ${closeOnLaunch ? "on" : ""}`}
                            onClick={() => setCloseOnLaunch(!closeOnLaunch)}
                          >
                            <span className="toggle-knob" />
                          </button>
                        </div>
                        <p>Окно лаунчера будет автоматически закрываться/сворачиваться сразу после успешного старта игры.</p>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------- */}
            {/* 2. КОНТЕНТ: ОФОРМЛЕНИЕ                                   */}
            {/* -------------------------------------------------------- */}
            {activeTab === "appearance" && (
              <>
                <div className="patch-header">
                  <h2>Оформление</h2>
                  <p>Настройки внешнего вида, тем оформления и кастомизации интерфейса.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <p className="placeholder-text" style={{ opacity: 0.5, fontSize: "14px" }}>
                      Компоненты выбора тем, цветовых палитр и эффектов прозрачности будут здесь...
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------- */}
            {/* 3. КОНТЕНТ: ПАРАМЕТРЫ ЗАПУСКА                            */}
            {/* -------------------------------------------------------- */}
            {activeTab === "launch_params" && (
              <>
                <div className="patch-header">
                  <h2>Параметры запуска</h2>
                  <p>Конфигурация выделения ресурсов и аргументов среды Java.</p>
                </div>

                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    
                    <div className="settings-card">
                      <div className="settings-card-icon">
                        <Monitor size={18} />
                      </div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Запускать в полноэкранном режиме</h4>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isFullScreen}
                            className={`toggle-switch ${isFullScreen ? "on" : ""}`}
                            onClick={() => setIsFullScreen(!isFullScreen)}
                          >
                            <span className="toggle-knob" />
                          </button>
                        </div>
                        <p>Игра автоматически развернется на весь экран сразу после инициализации движка.</p>
                      </div>
                    </div>

                    <div className="settings-card">
                      <div className="settings-card-icon">
                        <Gauge size={18} />
                      </div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Выделение оперативной памяти</h4>
                          <span className="settings-value-pill">{allocatedRam} ГБ</span>
                        </div>
                        <p>Рекомендуется выделять не менее половины доступного объема вашей оперативной памяти.</p>

                        <div className="ram-slider-block">
                          <input
                            type="range"
                            min={2}
                            max={16}
                            step={1}
                            value={allocatedRam}
                            onChange={(e) => setAllocatedRam(Number(e.target.value))}
                            className="ram-slider"
                            style={{
                              background: `linear-gradient(to right, #4C85FF 0%, #78C8FF ${ramPct}%, rgba(255,255,255,0.08) ${ramPct}%, rgba(255,255,255,0.08) 100%)`,
                            }}
                          />
                          <div className="ram-slider-ticks">
                            <span>2 ГБ</span>
                            <span className="ram-slider-rec">рекомендовано 8 ГБ</span>
                            <span>16 ГБ</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------- */}
            {/* 4. КОНТЕНТ: СОЕДИНЕНИЕ                                   */}
            {/* -------------------------------------------------------- */}
            {activeTab === "connection" && (
              <>
                <div className="patch-header">
                  <h2>Соединение</h2>
                  <p>Настройки сетевого подключения, прокси и авторизации на серверах загрузки.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <p className="placeholder-text" style={{ opacity: 0.5, fontSize: "14px" }}>
                      Конфигурация прокси, таймаутов сессии и сетевых адресов будет здесь...
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------- */}
            {/* 5. КОНТЕНТ: ТЕРМИНАЛ                                     */}
            {/* -------------------------------------------------------- */}
            {activeTab === "terminal" && (
              <>
                <div className="patch-header">
                  <h2>Терминал отладки</h2>
                  <p>Вывод логов клиента, системных дебаг-сообщений и управление выводом консоли.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <p className="placeholder-text" style={{ opacity: 0.5, fontSize: "14px" }}>
                      Логи вывода процесса Java и переключатели дебаг-режима будут здесь...
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------- */}
            {/* 6. КОНТЕНТ: О ЛАУНЧЕРЕ                                   */}
            {/* -------------------------------------------------------- */}
            {activeTab === "about" && (
              <>
                <div className="patch-header">
                  <h2>О лаунчере</h2>
                  <p>Информация о текущей сборке, лицензиях и разработчиках.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <p className="placeholder-text" style={{ opacity: 0.5, fontSize: "14px" }}>
                      SubReel Launcher v1.0.0-beta. Все права защищены.
                    </p>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      </div>
      
    </div>
  );
}