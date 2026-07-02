"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  FolderOpen,
  Layers,
  PackagePlus,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";

interface ModpackOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELEASE_VERSIONS = [
  "1.21.4",
  "1.21.1",
  "1.20.4",
  "1.20.1",
  "1.19.4",
  "1.19.2",
  "1.18.2",
  "1.16.5",
  "1.12.2",
];

const SNAPSHOT_VERSIONS = ["25w14a", "24w45a", "1.21-pre1", "1.20.5-rc1"];

const MOD_LOADERS = [
  {
    id: "fabric",
    name: "Fabric",
    desc: "Быстрый запуск, хороший выбор для оптимизации и клиентских модов.",
    color: "#2ed573",
  },
  {
    id: "forge",
    name: "Forge",
    desc: "Классическая база для крупных модпаков и старых версий Minecraft.",
    color: "#ff7f50",
  },
  {
    id: "neoforge",
    name: "NeoForge",
    desc: "Современная ветка Forge для новых сборок и свежих модов.",
    color: "#4C85FF",
  },
  {
    id: "vanilla",
    name: "Vanilla",
    desc: "Чистый клиент без загрузчика модов. Подходит для базового профиля.",
    color: "#a1a1aa",
  },
];

const PRESETS = [
  {
    id: "custom",
    title: "Своя сборка",
    badge: "Рекомендуется",
    icon: "SB",
    desc: "Создай чистый профиль: версия Minecraft, загрузчик модов и название сборки.",
    enabled: true,
  },
  {
    id: "modrinth",
    title: "Импорт Modrinth",
    badge: "Скоро",
    icon: "M",
    desc: "Импорт готовых паков из Modrinth появится позже.",
    enabled: false,
  },
  {
    id: "curseforge",
    title: "Импорт CurseForge",
    badge: "Скоро",
    icon: "C",
    desc: "Загрузка сборок из CurseForge пока в разработке.",
    enabled: false,
  },
];

export default function ModpackOverlay({ isOpen, onClose }: ModpackOverlayProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<"releases" | "snapshots">("releases");
  const [instanceName, setInstanceName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("1.21.1");
  const [selectedLoader, setSelectedLoader] = useState("fabric");

  const currentVersionsList = activeTab === "releases" ? RELEASE_VERSIONS : SNAPSHOT_VERSIONS;

  const selectedLoaderInfo = useMemo(
    () => MOD_LOADERS.find((loader) => loader.id === selectedLoader) ?? MOD_LOADERS[0],
    [selectedLoader],
  );

  const finalName = useMemo(() => {
    const trimmed = instanceName.trim();
    if (trimmed) return trimmed;
    return `SubReel ${selectedVersion} ${selectedLoaderInfo.name}`;
  }, [instanceName, selectedLoaderInfo.name, selectedVersion]);

  const handleClose = () => {
    setStep(1);
    setActiveTab("releases");
    setInstanceName("");
    setSelectedVersion("1.21.1");
    setSelectedLoader("fabric");
    onClose();
  };

  const handleCreate = () => {
    console.log("Создана сборка:", {
      name: finalName,
      version: selectedVersion,
      loader: selectedLoaderInfo.name,
    });
    alert(`Сборка "${finalName}" создана.\nMinecraft ${selectedVersion} · ${selectedLoaderInfo.name}`);
    handleClose();
  };

  return (
    <div className={`news-panel ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={handleClose} title="Закрыть">
        <X size={24} />
      </button>

      <div className="modpack-flow-container">
        {step === 1 && (
          <>
            <header className="modpack-flow-header">
              <div className="modpack-breadcrumbs">
                <button className="modpack-back-arrow-btn" onClick={handleClose} title="Назад">
                  <ArrowLeft size={16} />
                </button>
                <span className="modpack-tag studio">SubReel Studio</span>
                <span className="modpack-tag flow">Шаг 1 из 2</span>
              </div>
              <h1 className="modpack-flow-title">Создание сборки</h1>
              <p className="modpack-flow-subtitle">
                Выбери способ создания профиля. Сейчас доступна ручная сборка, импорт из каталогов можно оставить как будущие функции.
              </p>
              <div className="modpack-header-line" />
            </header>

            <div className="modpack-grid-layout">
              <div className="modpack-main-column">
                <button className="modpack-option-card recommended" onClick={() => setStep(2)} type="button">
                  <div className="modpack-card-icon-box">
                    <PackagePlus size={26} />
                  </div>
                  <div className="modpack-card-info">
                    <div className="modpack-card-header-row">
                      <span className="modpack-card-badge recommended-badge">Рекомендуется</span>
                    </div>
                    <h2>Новая сборка</h2>
                    <p>
                      Создай профиль с нуля: название, версия Minecraft и загрузчик модов. Это основной сценарий для лаунчера.
                    </p>
                  </div>
                </button>

                <div className="modpack-sub-row">
                  {PRESETS.slice(1).map((preset) => (
                    <button
                      className="modpack-option-card disabled-card"
                      disabled
                      key={preset.id}
                      type="button"
                    >
                      <div className="modpack-card-icon-box">
                        <span className="modpack-icon-text">{preset.icon}</span>
                      </div>
                      <div className="modpack-card-info">
                        <div className="modpack-card-header-row">
                          <span className="modpack-card-badge progress-badge">{preset.badge}</span>
                        </div>
                        <h2>{preset.title}</h2>
                        <p>{preset.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="modpack-side-column">
                <div className="modpack-option-card future-card">
                  <div className="modpack-card-info center-content">
                    <span className="modpack-card-badge future-badge">Подсказка</span>
                    <div className="modpack-future-circle">
                      <Sparkles size={24} />
                    </div>
                    <h2>Лучший старт</h2>
                    <p>Для первой версии оставь Fabric и Minecraft 1.21.1: быстро, стабильно и понятно для игрока.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <header className="modpack-flow-header">
              <div className="modpack-breadcrumbs">
                <button className="modpack-back-arrow-btn" onClick={() => setStep(1)} title="Назад">
                  <ArrowLeft size={16} />
                </button>
                <span className="modpack-tag studio">SubReel Studio</span>
                <span className="modpack-tag flow">Шаг 2 из 2</span>
              </div>
              <h1 className="modpack-flow-title">Настройка профиля</h1>
              <p className="modpack-flow-subtitle">
                Заполни название, выбери версию игры и среду запуска. Сборка пока создаётся как концепт-профиль.
              </p>
              <div className="modpack-header-line" />
            </header>

            <div className="config-flow-layout">
              <div className="config-form-side">
                <div className="config-input-block">
                  <label>Название сборки</label>
                  <div className="config-input-wrapper">
                    <div className="config-input-icon">
                      <Terminal size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Например: Мой Tech Pack"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="config-input-block">
                  <label>Загрузчик модов</label>
                  <div className="loader-selector-grid">
                    {MOD_LOADERS.map((loader) => (
                      <button
                        key={loader.id}
                        className={`loader-select-card ${selectedLoader === loader.id ? "active" : ""}`}
                        onClick={() => setSelectedLoader(loader.id)}
                        type="button"
                      >
                        <div className="loader-card-header">
                          <span className="loader-dot" style={{ backgroundColor: loader.color }} />
                          <h4>{loader.name}</h4>
                          {selectedLoader === loader.id && <Check size={16} className="check-active" />}
                        </div>
                        <p>{loader.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="config-version-side">
                <div className="version-side-title">
                  <FolderOpen size={18} />
                  <span>Версия Minecraft</span>
                </div>

                <div className="config-tabs-nav">
                  <button
                    className={`config-tab-btn ${activeTab === "releases" ? "active" : ""}`}
                    onClick={() => setActiveTab("releases")}
                    type="button"
                  >
                    <span>Релизы</span>
                    <span className="tab-badge">{RELEASE_VERSIONS.length}</span>
                  </button>
                  <button
                    className={`config-tab-btn ${activeTab === "snapshots" ? "active" : ""}`}
                    onClick={() => setActiveTab("snapshots")}
                    type="button"
                  >
                    <span>Снапшоты</span>
                    <span className="tab-badge">{SNAPSHOT_VERSIONS.length}</span>
                  </button>
                </div>

                <div className="tab-content active">
                  <div className="version-scroll-grid">
                    {currentVersionsList.map((version) => (
                      <button
                        key={version}
                        className={`version-cell-item ${selectedVersion === version ? "selected" : ""}`}
                        onClick={() => setSelectedVersion(version)}
                        type="button"
                      >
                        <div className="version-cell-box">
                          <span className="v-cube" />
                          <span className="v-num">{version}</span>
                        </div>
                        {selectedVersion === version && <div className="v-selected-badge">Выбрано</div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modpack-summary">
                  <span>Будет создано:</span>
                  <strong>{finalName}</strong>
                  <small>
                    Minecraft {selectedVersion} · {selectedLoaderInfo.name}
                  </small>
                </div>

                <div className="config-actions-bar">
                  <button className="config-cancel-btn" onClick={() => setStep(1)} type="button">
                    Назад
                  </button>
                  <button className="config-submit-btn" onClick={handleCreate} type="button">
                    <Layers size={18} />
                    <span>Создать сборку</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
