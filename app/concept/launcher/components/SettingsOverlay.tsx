"use client";

import { useMemo, useState } from "react";
import {
  AppWindow,
  Check,
  ChevronRight,
  Cpu,
  ExternalLink,
  FileText,
  Gauge,
  Info,
  Link as LinkIcon,
  Monitor,
  Palette,
  Radio,
  RefreshCw,
  Rocket,
  Settings,
  ShieldCheck,
  Terminal,
  User,
  Wifi,
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

type TabId = "main" | "appearance" | "launch" | "connection" | "terminal" | "about";
type ThemeId = "system" | "dark" | "light";

const navItems: Array<{
  id: TabId;
  title: string;
  hint: string;
  icon: React.ElementType;
}> = [
  { id: "main", title: "Основные", hint: "Поведение лаунчера", icon: Settings },
  { id: "appearance", title: "Оформление", hint: "Тема и окно", icon: Palette },
  { id: "launch", title: "Запуск", hint: "Java, RAM и клиент", icon: Cpu },
  { id: "connection", title: "Соединение", hint: "Сеть и серверы", icon: Radio },
  { id: "terminal", title: "Терминал", hint: "Логи и отладка", icon: Terminal },
  { id: "about", title: "О лаунчере", hint: "Версия и статус", icon: AppWindow },
];

const launcherComponents = [
  { name: "SubReel UI", version: "0.2.3", build: "b88d91d4", date: "26 июня 2026 г" },
  { name: "SubReel Auth", version: "0.0.3", build: "ec7fb237", date: "1 апреля 2026 г" },
  { name: "SubReel VCS", version: "0.0.11", build: "2b052409", date: "25 июня 2026 г" },
  { name: "SubReel Bootstrap", version: "2.4.1", build: "b5172dc4", date: "3 октября 2025 г" },
];

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
  const [activeTab, setActiveTab] = useState<TabId>("main");
  const [theme, setTheme] = useState<ThemeId>("system");
  const [animations, setAnimations] = useState(true);
  const [discordRpc, setDiscordRpc] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [verifyBeforeLaunch, setVerifyBeforeLaunch] = useState(true);
  const [downloadLimit, setDownloadLimit] = useState("Без лимита");

  const ramPct = ((allocatedRam - 2) / (16 - 2)) * 100;
  const activeTitle = useMemo(
    () => navItems.find((item) => item.id === activeTab)?.title ?? "Настройки",
    [activeTab],
  );

  return (
    <div className={`settings-overlay-panel ${isOpen ? "open" : ""}`}>
      <header className="settings-internal-navbar">
        <div className="logo-zone">
          <span className="logo-icon settings-mode">S</span>
          <div>
            <h3>SubReel</h3>
            <p className="orange-text">Настройки</p>
          </div>
        </div>

        <nav className="nav-links">
          <button onClick={() => { onCloseSettings(); onTabChange("main"); }} type="button">
            Главная
          </button>
          <button onClick={() => { onCloseSettings(); onTabChange("community"); }} type="button">
            Сообщество
          </button>
          <button className="active" type="button">
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

      <div className="settings-layout-wrapper">
        <div className="settings-layout">
          <aside className="settings-sidebar">
            <nav className="settings-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    className={`settings-nav-item ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                    key={item.id}
                  >
                    <Icon size={18} />
                    <span className="settings-nav-text">
                      <span className="settings-nav-title">{item.title}</span>
                      <span className="settings-nav-hint">{item.hint}</span>
                    </span>
                    <ChevronRight size={16} className="settings-nav-chevron" />
                  </button>
                );
              })}
            </nav>

            <div className="news-details settings-savebar">
              <div className="detail-item">
                <Info size={16} />
                <span>Изменения применяются сразу в этом концепте.</span>
              </div>
            </div>
          </aside>

          <div className="settings-content">
            <div className="patch-header">
              <h2>{activeTitle}</h2>
              <p>{getTabDescription(activeTab)}</p>
            </div>

            <div className="patch-scroll-area">
              {activeTab === "main" && (
                <div className="settings-card-list">
                  <SettingToggle
                    icon={RefreshCw}
                    title="Автоматически обновлять файлы"
                    description="Лаунчер проверит клиент, моды и ресурсы перед запуском игры."
                    checked={isAutoUpdate}
                    onChange={setIsAutoUpdate}
                  />
                  <SettingToggle
                    icon={ShieldCheck}
                    title="Проверять целостность перед запуском"
                    description="Помогает избежать крашей после ручного изменения файлов сборки."
                    checked={verifyBeforeLaunch}
                    onChange={setVerifyBeforeLaunch}
                  />
                  <SettingToggle
                    icon={Rocket}
                    title="Закрывать лаунчер после запуска"
                    description="После успешного старта игры окно лаунчера будет сворачиваться."
                    checked={closeOnLaunch}
                    onChange={setCloseOnLaunch}
                  />
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="settings-card-list">
                  <div className="settings-card settings-card-stacked">
                    <div className="settings-card-head">
                      <div className="settings-card-titleline">
                        <Palette size={18} />
                        <h4>Тема интерфейса</h4>
                      </div>
                      <span className="settings-value-pill">{themeLabel(theme)}</span>
                    </div>
                    <p>Выбери, как должен выглядеть лаунчер в концепте.</p>
                    <div className="settings-segmented">
                      {(["system", "dark", "light"] as ThemeId[]).map((item) => (
                        <button
                          className={theme === item ? "active" : ""}
                          key={item}
                          onClick={() => setTheme(item)}
                          type="button"
                        >
                          {themeLabel(item)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SettingToggle
                    icon={Monitor}
                    title="Полноэкранный режим игры"
                    description="Игра будет открываться на весь экран после старта клиента."
                    checked={isFullScreen}
                    onChange={setIsFullScreen}
                  />
                  <SettingToggle
                    icon={Gauge}
                    title="Плавные анимации интерфейса"
                    description="Оставляет мягкие переходы, выезды панелей и анимацию запуска."
                    checked={animations}
                    onChange={setAnimations}
                  />
                </div>
              )}

              {activeTab === "launch" && (
                <div className="settings-card-list">
                  <div className="settings-card settings-card-stacked">
                    <div className="settings-card-head">
                      <div className="settings-card-titleline">
                        <Gauge size={18} />
                        <h4>Выделение оперативной памяти</h4>
                      </div>
                      <span className="settings-value-pill">{allocatedRam} ГБ</span>
                    </div>
                    <p>Рекомендуемое значение для большинства сборок: 4-6 ГБ.</p>
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
                        <span className="ram-slider-rec">Рекомендовано 6 ГБ</span>
                        <span>16 ГБ</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card settings-card-stacked">
                    <div className="settings-card-head">
                      <div className="settings-card-titleline">
                        <Terminal size={18} />
                        <h4>Java Runtime</h4>
                      </div>
                      <span className="settings-value-pill">Авто</span>
                    </div>
                    <p>Лаунчер сам подберёт Java под выбранную версию Minecraft.</p>
                    <div className="settings-fake-input">C:\Program Files\Java\auto-detect</div>
                  </div>
                </div>
              )}

              {activeTab === "connection" && (
                <div className="settings-card-list">
                  <SettingToggle
                    icon={Wifi}
                    title="Discord Rich Presence"
                    description="Показывает текущую сборку и статус игры в Discord."
                    checked={discordRpc}
                    onChange={setDiscordRpc}
                  />
                  <div className="settings-card settings-card-stacked">
                    <div className="settings-card-head">
                      <div className="settings-card-titleline">
                        <Radio size={18} />
                        <h4>Ограничение загрузки</h4>
                      </div>
                      <span className="settings-value-pill">{downloadLimit}</span>
                    </div>
                    <p>Можно ограничить скорость скачивания модов и ресурсов.</p>
                    <div className="settings-segmented">
                      {["Без лимита", "10 МБ/с", "3 МБ/с"].map((item) => (
                        <button
                          className={downloadLimit === item ? "active" : ""}
                          key={item}
                          onClick={() => setDownloadLimit(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "terminal" && (
                <div className="settings-card-list">
                  <SettingToggle
                    icon={Terminal}
                    title="Показывать терминал при запуске"
                    description="Откроет окно логов во время подготовки и запуска клиента."
                    checked={showConsole}
                    onChange={setShowConsole}
                  />
                  <div className="settings-console-preview">
                    <span>[SubReel] profile loaded</span>
                    <span>[Assets] integrity check: ok</span>
                    <span>[Minecraft] waiting for launch command</span>
                  </div>
                </div>
              )}

              {activeTab === "about" && (
                <div className="about-launcher-page">
                  <section className="about-hero-card">
                    <div className="about-product">
                      <div className="about-product-icon">SR</div>
                      <div>
                        <h3>SubReel Launcher</h3>
                        <p>Концепт клиента для Minecraft-проекта SubReel</p>
                      </div>
                    </div>
                    <div className="about-version-status">
                      <span className="about-status-dot">
                        <Check size={16} />
                      </span>
                      <div>
                        <strong>Стабильная версия</strong>
                        <small>3.1.1</small>
                      </div>
                    </div>
                  </section>

                  <section className="about-link-grid" aria-label="Ссылки лаунчера">
                    <AboutLink icon={Info} label="Что нового?" />
                    <AboutLink icon={ExternalLink} label="Веб-сайт" />
                    <AboutLink icon={ExternalLink} label="Поддержка" />
                    <AboutLink icon={LinkIcon} label="Issues (GitHub)" />
                    <AboutLink icon={FileText} label="Пользовательское соглашение" />
                    <AboutLink icon={FileText} label="Политика конфиденциальности" />
                  </section>

                  <section className="about-section-card">
                    <div className="about-section-title">
                      <Settings size={18} />
                      <h3>Компоненты лаунчера</h3>
                    </div>
                    <div className="about-component-list">
                      {launcherComponents.map((component) => (
                        <article className="about-component-row" key={component.name}>
                          <div>
                            <strong>{component.name}</strong>
                            <p>
                              <span>{component.version}</span>
                              <small>{component.build}</small>
                              <small>{component.date}</small>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="about-section-card">
                    <div className="about-section-title">
                      <FileText size={18} />
                      <h3>Юридическая информация</h3>
                    </div>
                    <div className="about-legal-row">
                      <AboutLink icon={ExternalLink} label="Лицензионное соглашение" />
                      <AboutLink icon={ExternalLink} label="Правовые документы" />
                      <AboutLink icon={Info} label="Лицензии открытого ПО" />
                    </div>
                  </section>

                  <section className="about-section-card">
                    <div className="about-section-title">
                      <Terminal size={18} />
                      <h3>Журналы лаунчера</h3>
                    </div>
                    <p className="about-muted">Быстрый доступ к журналам компонентов SubReel Launcher.</p>
                    <div className="about-log-actions">
                      <button type="button">Журнал лаунчера</button>
                      <button type="button">Журнал Bootstrap</button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="settings-card">
      <div className="settings-card-icon">
        <Icon size={18} />
      </div>
      <div className="settings-card-main">
        <div className="settings-card-head">
          <h4>{title}</h4>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            className={`toggle-switch ${checked ? "on" : ""}`}
            onClick={() => onChange(!checked)}
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <p>{description}</p>
      </div>
    </div>
  );
}

function AboutLink({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button className="about-link" type="button">
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

function getTabDescription(tab: TabId) {
  switch (tab) {
    case "appearance":
      return "Вид окна, тема, анимации и полноэкранный режим.";
    case "launch":
      return "Параметры запуска Minecraft, Java и выделение памяти.";
    case "connection":
      return "Сетевые опции, Discord-статус и загрузка ресурсов.";
    case "terminal":
      return "Логи запуска, отладка и консоль клиента.";
    case "about":
      return "Информация о версии лаунчера и текущем профиле.";
    default:
      return "Основное поведение лаунчера и проверки перед запуском.";
  }
}

function themeLabel(theme: ThemeId) {
  switch (theme) {
    case "dark":
      return "Тёмная";
    case "light":
      return "Светлая";
    default:
      return "Системная";
  }
}
