"use client";

interface BootOverlayProps {
  isOpen: boolean;
  isFading: boolean;
  progress: number;
  status: string;
}

export default function BootOverlay({ isOpen, isFading, progress, status }: BootOverlayProps) {
  return (
    <div className={`boot-overlay ${isOpen ? "open" : ""} ${isFading ? "fade-out" : ""}`}>
      <div className="boot-card">
        <span className="logo-icon boot-logo">S</span>
        <div className="boot-title">SubReel</div>
        <div className="boot-bar-track">
          <div className="boot-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="boot-status">
          <span>{status}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}