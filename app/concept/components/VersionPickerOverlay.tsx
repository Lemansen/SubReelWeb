"use client";
import { useState, useEffect } from "react";
import { X, Check, FolderOpen, Sparkles } from "lucide-react";

interface VersionPickerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  onSelectVersion: (version: string) => void;
}

const MINECRAFT_VERSIONS = [
  { v: "1.21.4", tag: "LATEST",   color: "#78C8FF" },
  { v: "1.21.1", tag: "STABLE",   color: "#4C85FF" },
  { v: "1.20.4", tag: "",         color: "" },
  { v: "1.20.1", tag: "",         color: "" },
  { v: "1.19.4", tag: "",         color: "" },
  { v: "1.19.2", tag: "POPULAR",  color: "#ff9f68" },
  { v: "1.18.2", tag: "",         color: "" },
  { v: "1.16.5", tag: "CLASSIC",  color: "#a1a1aa" },
  { v: "1.12.2", tag: "LEGACY",   color: "#7a7a85" },
  { v: "1.8.9",  tag: "LEGACY",   color: "#7a7a85" },
];

export default function VersionPickerOverlay({
  isOpen,
  onClose,
  currentVersion,
  onSelectVersion,
}: VersionPickerOverlayProps) {
  const [selected, setSelected] = useState(currentVersion);

  useEffect(() => {
    if (isOpen) setSelected(currentVersion);
  }, [isOpen, currentVersion]);

  const handleApply = () => {
    onSelectVersion(selected);
    onClose();
  };

  return (
    <div className={`version-picker-overlay ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose} title="Закрыть">
        <X size={24} />
      </button>

      <div className="version-picker-shell">
        <header className="version-picker-header">
          <div className="version-picker-breadcrumbs">
            <span className="vp-tag studio">LAUNCHER</span>
            <span className="vp-tag flow">VERSION SELECT</span>
          </div>
          <div className="version-picker-title-row">
            <FolderOpen size={22} className="vp-title-icon" />
            <h1>Выбор версии игры</h1>
          </div>
          <p className="version-picker-subtitle">
            Выберите версию Minecraft для текущего профиля. Изменения применятся при следующем запуске.
          </p>
          <div className="vp-header-line" />
        </header>

        <div className="version-picker-grid">
          {MINECRAFT_VERSIONS.map((item) => {
            const isActive = selected === item.v;
            return (
              <button
                key={item.v}
                className={`vp-card ${isActive ? "active" : ""}`}
                onClick={() => setSelected(item.v)}
              >
                <div className="vp-card-top">
                  <span 
                    className="vp-cube" 
                    style={isActive ? { background: item.color || "#78C8FF", boxShadow: `0 0 10px ${item.color || "#4C85FF"}` } : {}} 
                  />
                  <span className="vp-version-num">{item.v}</span>
                  {isActive && <Check size={16} className="vp-check" />}
                </div>
                {item.tag && (
                  <span
                    className="vp-badge"
                    style={{
                      background: `${item.color}15`,
                      color: item.color,
                      borderColor: `${item.color}40`,
                    }}
                  >
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <footer className="version-picker-footer">
          <div className="vp-current-info">
            <Sparkles size={14} />
            <span>
              Текущая: <strong>{currentVersion}</strong>
              {selected !== currentVersion && (
                <> → Новая: <strong style={{ color: "#78C8FF" }}>{selected}</strong></>
              )}
            </span>
          </div>
          <div className="vp-actions">
            <button className="vp-cancel-btn" onClick={onClose}>
              Отмена
            </button>
            <button
              className="vp-apply-btn"
              onClick={handleApply}
              disabled={selected === currentVersion}
            >
              Применить
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}