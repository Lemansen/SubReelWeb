"use client";

import { User as UserIcon, Globe, UserPlus } from "lucide-react";

interface WelcomeOverlayProps {
  isOpen: boolean;
  inputName: string;
  onInputChange: (value: string) => void;
  onSubmitNickname: (name: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}

export default function WelcomeOverlay({
  isOpen,
  inputName,
  onInputChange,
  onSubmitNickname,
  onLogin,
  onRegister,
}: WelcomeOverlayProps) {
  return (
    <div className={`welcome-overlay ${isOpen ? "open" : ""}`}>
      <div className="welcome-card">
        <div className="welcome-header">
          <span className="logo-icon">S</span>
          <h2>Добро пожаловать в SubReel</h2>
          <p>Выберите способ авторизации для начала игры</p>
        </div>

        <div className="welcome-options">
          {/* Вариант 1: Вход через существующий аккаунт */}
          <button type="button" className="welcome-auth-btn" onClick={onLogin}>
            <Globe size={20} />
            <div className="btn-meta">
              <span>Войти через игровой аккаунт</span>
              <small>Синхронизация скина и лицензии</small>
            </div>
          </button>

          {/* Вариант 2: Регистрация нового аккаунта */}
          <button type="button" className="welcome-auth-btn" onClick={onRegister}>
            <UserPlus size={20} />
            <div className="btn-meta">
              <span>Зарегистрировать новый аккаунт</span>
              <small>Создать игровой профиль SubReel</small>
            </div>
          </button>

          <div className="welcome-divider">
            <span>или</span>
          </div>

          {/* Вариант 3: Локальный никнейм */}
          <div className="welcome-local-box">
            <label htmlFor="welcome-nick-input">Использовать локальный никнейм</label>
            <div className="input-group">
              <div className="input-icon-box">
                <UserIcon size={16} />
              </div>
              <input
                id="welcome-nick-input"
                type="text"
                placeholder="Введите ваш никнейм..."
                value={inputName}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmitNickname(inputName)}
                maxLength={16}
              />
              <button
                type="button"
                className="input-submit-btn"
                disabled={!inputName.trim()}
                onClick={() => onSubmitNickname(inputName)}
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}