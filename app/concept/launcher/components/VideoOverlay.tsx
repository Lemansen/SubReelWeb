"use client";

import { useEffect, useState, useRef } from "react";
import { X, Volume2, VolumeX } from "lucide-react";

interface VideoOverlayProps {
  isOpen: boolean;
  onClose: (isFinished: boolean) => void;
  videoSrc: string;
}

export default function VideoOverlay({
  isOpen,
  onClose,
  videoSrc,
}: VideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setShowControls(false);
    setProgress(0);

    const timeout = setTimeout(() => {
      setShowControls(true);
    }, 300);

    const startVideo = async () => {
      if (!videoRef.current) return;

      const video = videoRef.current;

      video.pause();
      video.currentTime = 0;

      video.volume = 1;
      video.muted = false;
      setIsMuted(false);

      try {
        await video.play();
      } catch (err) {
        console.warn("Не удалось запустить со звуком. Запускаем без звука.", err);

        video.muted = true;
        setIsMuted(true);

        try {
          await video.play();
        } catch (e) {
          console.error("Даже muted autoplay заблокирован.", e);
        }
      }
    };

    startVideo();

    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    video.muted = !video.muted;

    setIsMuted(video.muted);
  };

  if (!isOpen) return null;

  return (
    <div className="video-cinema-overlay">
      <div className="video-player-shell">
        <header className="video-header">
          <div className="video-header-left">
            <div className="video-logo">S</div>

            <div>
              <h3>SubReel Launcher</h3>
              <span>Запуск клиента...</span>
            </div>
          </div>

          <button
            className={`video-close-btn ${
              showControls ? "visible" : ""
            }`}
            onClick={() => onClose(false)}
          >
            <X size={18} />
          </button>
        </header>

        <div className="video-screen">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            controls={false}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => onClose(true)}
            className="cinema-video-element"
          />
        </div>

        <footer className="video-footer">
          <button className="mute-button" onClick={toggleMute}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div className="video-progress">
            <div className="video-progress-track">
              <div
                className="video-progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="video-progress-meta">
              <span>Подготавливаем клиент...</span>
              <span>{Math.floor(progress)}%</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}