"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FolderOpen, Sparkles, X } from "lucide-react";

interface VersionPickerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  onSelectVersion: (version: string) => void;
}

type VersionGroup = "releases" | "snapshots" | "legacy";

const MINECRAFT_VERSIONS: Array<{
  v: string;
  tag?: string;
  color?: string;
  group: VersionGroup;
}> = [
  { v: "1.21.4", tag: "Новое", color: "#78C8FF", group: "releases" },
  { v: "1.21.1", tag: "Стабильно", color: "#4C85FF", group: "releases" },
  { v: "1.20.4", group: "releases" },
  { v: "1.20.1", tag: "Популярно", color: "#ff9f68", group: "releases" },
  { v: "1.19.4", group: "releases" },
  { v: "1.19.2", tag: "Моды", color: "#ff9f68", group: "releases" },
  { v: "25w14a", tag: "Snapshot", color: "#2ed573", group: "snapshots" },
  { v: "24w45a", tag: "Snapshot", color: "#2ed573", group: "snapshots" },
  { v: "1.21-pre1", tag: "Pre-release", color: "#2ed573", group: "snapshots" },
  { v: "1.18.2", group: "legacy" },
  { v: "1.16.5", tag: "Classic", color: "#a1a1aa", group: "legacy" },
  { v: "1.12.2", tag: "Legacy", color: "#7a7a85", group: "legacy" },
  { v: "1.8.9", tag: "Legacy", color: "#7a7a85", group: "legacy" },
];

const GROUP_LABELS: Record<VersionGroup, string> = {
  releases: "Релизы",
  snapshots: "Снапшоты",
  legacy: "Старые",
};

export default function VersionPickerOverlay({
  isOpen,
  onClose,
  currentVersion,
  onSelectVersion,
}: VersionPickerOverlayProps) {
  const [selected, setSelected] = useState(currentVersion);
  const [group, setGroup] = useState<VersionGroup>("releases");

  useEffect(() => {
    if (!isOpen) return;
    setSelected(currentVersion);
    const current = MINECRAFT_VERSIONS.find((item) => item.v === currentVersion);
    setGroup(current?.group ?? "releases");
  }, [isOpen, currentVersion]);

  const versions = useMemo(
    () => MINECRAFT_VERSIONS.filter((item) => item.group === group),
    [group],
  );

  const selectedInfo = MINECRAFT_VERSIONS.find((item) => item.v === selected);
  const hasChanges = selected !== currentVersion;

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
            <span className="vp-tag studio">Launcher</span>
            <span className="vp-tag flow">Выбор версии</span>
          </div>
          <div className="version-picker-title-row">
            <FolderOpen size={22} className="vp-title-icon" />
            <h1>Версия Minecraft</h1>
          </div>
          <p className="version-picker-subtitle">
            Выбери версию для текущего профиля. Изменение применится к нижней панели лаунчера и будет сохранено в браузере.
          </p>
          <div className="vp-header-line" />
        </header>

        <div className="version-group-tabs">
          {(Object.keys(GROUP_LABELS) as VersionGroup[]).map((key) => (
            <button
              className={group === key ? "active" : ""}
              key={key}
              onClick={() => setGroup(key)}
              type="button"
            >
              {GROUP_LABELS[key]}
              <span>{MINECRAFT_VERSIONS.filter((item) => item.group === key).length}</span>
            </button>
          ))}
        </div>

        <div className="version-picker-grid">
          {versions.map((item) => {
            const isActive = selected === item.v;
            const color = item.color || "#78C8FF";

            return (
              <button
                key={item.v}
                className={`vp-card ${isActive ? "active" : ""}`}
                onClick={() => setSelected(item.v)}
                type="button"
              >
                <div className="vp-card-top">
                  <span
                    className="vp-cube"
                    style={isActive ? { background: color, boxShadow: `0 0 10px ${color}` } : {}}
                  />
                  <span className="vp-version-num">{item.v}</span>
                  {isActive && <Check size={16} className="vp-check" />}
                </div>
                {item.tag && (
                  <span
                    className="vp-badge"
                    style={{
                      background: `${color}15`,
                      color,
                      borderColor: `${color}40`,
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
              Сейчас: <strong>{currentVersion}</strong>
              {hasChanges && (
                <>
                  {" "}
                  → будет:{" "}
                  <strong style={{ color: selectedInfo?.color || "#78C8FF" }}>{selected}</strong>
                </>
              )}
            </span>
          </div>
          <div className="vp-actions">
            <button className="vp-cancel-btn" onClick={onClose} type="button">
              Отмена
            </button>
            <button className="vp-apply-btn" onClick={handleApply} disabled={!hasChanges} type="button">
              Применить
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
