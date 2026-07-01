"use client";

import { useState } from "react";
import { X, ArrowLeft, Check, FolderOpen, Terminal, Layers } from "lucide-react";

interface ModpackOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Разделяем версии по типам для работы вкладок
const RELEASE_VERSIONS = ["1.21.1", "1.20.4", "1.20.1", "1.19.2", "1.18.2", "1.16.5"];
const SNAPSHOT_VERSIONS = ["24w14a", "23w45a", "1.21-pre1", "1.20.5-rc1"];

const MOD_LOADERS = [
  { id: "fabric", name: "Fabric", desc: "Легковесный и быстрый", color: "#2ed573" },
  { id: "forge", name: "Forge", desc: "Классическая база модов", color: "#ff7f50" },
  { id: "neo-forge", name: "NeoForge", desc: "Современный форк Forge", color: "#4C85FF" },
];

export default function ModpackOverlay({ isOpen, onClose }: ModpackOverlayProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<"releases" | "snapshots">("releases");
  const [instanceName, setInstanceName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("1.21.1");
  const [selectedLoader, setSelectedLoader] = useState("fabric");

  const handleClose = () => {
    setStep(1);
    setActiveTab("releases");
    onClose();
  };

  const handleCreate = () => {
    const finalName = instanceName.trim() || `Сборка ${selectedVersion} (${selectedLoader})`;
    console.log("✅ Создаем профиль:", { 
      name: finalName, 
      version: selectedVersion, 
      loader: selectedLoader 
    });
    alert(`Сборка "${finalName}" успешно создана!`);
    handleClose();
  };

  const currentVersionsList = activeTab === "releases" ? RELEASE_VERSIONS : SNAPSHOT_VERSIONS;

  return (
    <div className={`news-panel ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={handleClose} title="Закрыть">
        <X size={24} />
      </button>

      <div className="modpack-flow-container">
        {/* ========================================== */}
        {/* === ШАГ 1: ВЫБОР СПОСОБА СОЗДАНИЯ      === */}
        {/* ========================================== */}
        {step === 1 && (
          <>
            <header className="modpack-flow-header">
              <div className="modpack-breadcrumbs">
                <button className="modpack-back-arrow-btn" onClick={handleClose}>
                  <ArrowLeft size={16} />
                </button>
                <span className="modpack-tag studio">STUDIO</span>
                <span className="modpack-tag flow">STEP 1 / 2</span>
              </div>
              <h1 className="modpack-flow-title">ВЫБЕРИТЕ СПОСОБ СОЗДАНИЯ</h1>
              <p className="modpack-flow-subtitle">
                Сначала выбираем сценарий, а на следующем шаге настроим версию ядра и загрузчик.
              </p>
              <div className="modpack-header-line" />
            </header>

            <div className="modpack-grid-layout">
              <div className="modpack-main-column">
                <div className="modpack-option-card recommended" onClick={() => setStep(2)}>
                  <div className="modpack-card-icon-box">
                    <span className="modpack-icon-text">SB</span>
                  </div>
                  <div className="modpack-card-info">
                    <div className="modpack-card-header-row">
                      <span className="modpack-card-badge recommended-badge">РЕКОМЕНДОВАНО</span>
                    </div>
                    <h2>Своя сборка</h2>
                    <p>
                      Создайте чистый клиент. Выбирайте версию, нужный загрузчик и детально настраивайте моды под себя.
                    </p>
                  </div>
                </div>

                <div className="modpack-sub-row">
                  <div className="modpack-option-card disabled-card modrinth-border">
                    <div className="modpack-card-icon-box modrinth-icon">
                      <span className="modpack-icon-text text-green">M</span>
                    </div>
                    <div className="modpack-card-info">
                      <div className="modpack-card-header-row">
                        <span className="modpack-card-badge progress-badge">В РАЗРАБОТКЕ</span>
                      </div>
                      <h2>Modrinth</h2>
                      <p>Готовые паки</p>
                    </div>
                  </div>

                  <div className="modpack-option-card disabled-card curseforge-border">
                    <div className="modpack-card-icon-box curseforge-icon">
                      <span className="modpack-icon-text text-orange">C</span>
                    </div>
                    <div className="modpack-card-info">
                      <div className="modpack-card-header-row">
                        <span className="modpack-card-badge progress-badge orange-border">В РАЗРАБОТКЕ</span>
                      </div>
                      <h2>CurseForge</h2>
                      <p>База модов</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modpack-side-column">
                <div className="modpack-option-card future-card">
                  <div className="modpack-card-info center-content">
                    <span className="modpack-card-badge future-badge">СКОРО</span>
                    <div className="modpack-future-circle">
                      <span>?</span>
                    </div>
                    <h2>В планах</h2>
                    <p>Здесь скоро появится новая крутая фича!</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* === ШАГ 2: НАСТРОЙКА НОВОЙ СБОРКИ      === */}
        {/* ========================================== */}
        {step === 2 && (
          <>
            <header className="modpack-flow-header">
              <div className="modpack-breadcrumbs">
                <button className="modpack-back-arrow-btn" onClick={() => setStep(1)} title="Назад">
                  <ArrowLeft size={16} />
                </button>
                <span className="modpack-tag studio">STUDIO</span>
                <span className="modpack-tag flow">STEP 2 / 2</span>
              </div>
              <h1 className="modpack-flow-title">НАСТРОЙКА НОВОЙ СБОРКИ</h1>
              <p className="modpack-flow-subtitle">
                Задайте имя, выберите нужную версию игры и предпочтительную среду выполнения модификаций.
              </p>
              <div className="modpack-header-line" style={{ background: '#78C8FF' }} />
            </header>

            <div className="config-flow-layout">
              {/* Левая колонка: Название и Загрузчик */}
              <div className="config-form-side">
                <div className="config-input-block">
                  <label>Название профиля</label>
                  <div className="config-input-wrapper">
                    <div className="config-input-icon"><Terminal size={18} /></div>
                    <input
                      type="text"
                      placeholder="Например: Мой ТехноПак 1.21"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="config-input-block">
                  <label>Загрузчик модов (Mod Loader)</label>
                  <div className="loader-selector-grid">
                    {MOD_LOADERS.map((loader) => (
                      <div
                        key={loader.id}
                        className={`loader-select-card ${selectedLoader === loader.id ? "active" : ""}`}
                        onClick={() => setSelectedLoader(loader.id)}
                      >
                        <div className="loader-card-header">
                          <span className="loader-dot" style={{ backgroundColor: loader.color }} />
                          <h4>{loader.name}</h4>
                          {selectedLoader === loader.id && <Check size={16} className="check-active" />}
                        </div>
                        <p>{loader.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Правая колонка: Выбор версии с Табами и Кнопками */}
              <div className="config-version-side">
                <div className="version-side-title">
                  <FolderOpen size={18} />
                  <span>Версия игры</span>
                </div>

                {/* Навигация вкладок */}
                <div className="config-tabs-nav">
                  <button 
                    className={`config-tab-btn ${activeTab === "releases" ? "active" : ""}`}
                    onClick={() => setActiveTab("releases")}
                  >
                    <span>Релизы</span>
                    <span className="tab-badge">{RELEASE_VERSIONS.length}</span>
                  </button>
                  <button 
                    className={`config-tab-btn ${activeTab === "snapshots" ? "active" : ""}`}
                    onClick={() => setActiveTab("snapshots")}
                  >
                    <span>Снапшоты</span>
                    <span className="tab-badge">{SNAPSHOT_VERSIONS.length}</span>
                  </button>
                </div>

                {/* Контент вкладок (Скролл-список) */}
                <div className="tab-content active">
                  <div className="version-scroll-grid">
                    {currentVersionsList.map((v) => (
                      <div
                        key={v}
                        className={`version-cell-item ${selectedVersion === v ? "selected" : ""}`}
                        onClick={() => setSelectedVersion(v)}
                      >
                        <div className="version-cell-box">
                          <span className="v-cube" />
                          <span className="v-num">{v}</span>
                        </div>
                        {selectedVersion === v && <div className="v-selected-badge">ВЫБРАНО</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Фиксированный подвал с кнопками */}
                <div className="config-actions-bar">
                  <button className="config-cancel-btn" onClick={() => setStep(1)}>
                    Назад
                  </button>
                  <button className="config-submit-btn" onClick={handleCreate}>
                    <Layers size={18} />
                    <span>Сгенерировать сборку</span>
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