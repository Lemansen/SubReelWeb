"use client";

import { useEffect, useState, RefObject } from "react";

interface LaunchAnimationProps {
  isActive: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onComplete: () => void;
}

export default function LaunchAnimation({ isActive, triggerRef, onComplete }: LaunchAnimationProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isActive && triggerRef.current) {
      // Находим кнопку на экране лаунчера
      const rect = triggerRef.current.getBoundingClientRect();
      // Находим контейнер приложения .app-shell (относительно которого позиционируем абсолютно)
      const shell = triggerRef.current.closest(".app-shell");
      if (shell) {
        const shellRect = shell.getBoundingClientRect();
        
        // Стартовая точка: центр кнопки Играть относительно фрейма лаунчера
        const startX = rect.left - shellRect.left + rect.width / 2 - 20;
        const startY = rect.top - shellRect.top + rect.height / 2 - 20;

        setCoords({ x: startX, y: startY });

        // Даём один кадр на отрисовку в стартовой позиции, затем запускаем полёт[cite: 8]
        const raf = requestAnimationFrame(() => {
          setAnimate(true);
        });

        // Время полёта логотипа — 750мс[cite: 8]
        const timeout = setTimeout(() => {
          setAnimate(false);
          setCoords(null);
          onComplete();
        }, 750);

        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(timeout);
        };
      }
    }
  }, [isActive, triggerRef, onComplete]);

  if (!isActive || !coords) return null;

  return (
    <div className="launch-animation-track">
      <div
        className={`flying-logo ${animate ? "in-center" : ""}`}
        style={
          !animate
            ? { left: `${coords.x}px`, top: `${coords.y}px`, transform: "scale(0.8)" }
            : {}
        }
      >
        {/* Можно использовать <img src="/logo_intro.webp" alt="S" /> */}
        <span className="logo-core-text">S</span>
      </div>
    </div>
  );
}