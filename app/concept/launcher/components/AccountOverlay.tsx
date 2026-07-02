"use client";

import { useState } from "react";
import {
  User,
  Shield,
  Crown,
  Sparkles,
  Upload,
  CheckCircle2,
  LogOut,
  Edit2,
} from "lucide-react";

interface AccountOverlayProps {
  isOpen: boolean;
  onCloseAccount: () => void;
  onTabChange: (tab: "main" | "community") => void;
  onOpenSettings: () => void;
  username: string;
  avatarInitials: string;
  onChangeNickname: (name: string) => void;
  WindowControls: React.ComponentType;
}

type AccountTabId = "profile" | "skin" | "security";

export default function AccountOverlay({
  isOpen,
  onCloseAccount,
  onTabChange,
  onOpenSettings,
  username,
  avatarInitials,
  onChangeNickname,
  WindowControls,
}: AccountOverlayProps) {
  const [activeTab, setActiveTab] = useState<AccountTabId>("profile");
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(username);

  const handleNameSubmit = () => {
    if (newName.trim()) {
      onChangeNickname(newName);
      setEditMode(false);
    }
  };

  return (
    <div className={`settings-overlay-panel ${isOpen ? "open" : ""}`}>

      <header className="settings-internal-navbar">
        <div className="logo-zone">
          <span className="logo-icon account-mode">S</span>
          <div>
            <h3>SubReel</h3>
            <p className="orange-text">Личный кабинет</p>
          </div>
        </div>

        <nav className="nav-links">
          <button onClick={() => { onCloseAccount(); onTabChange("main"); }}>
            Главная
          </button>
          <button onClick={() => { onCloseAccount(); onTabChange("community"); }}>
            Сообщество
          </button>
          <button onClick={() => { onCloseAccount(); onOpenSettings(); }}>
            Настройки
          </button>
        </nav>

        <div className="header-right-zone">
          <div className={`user-profile-pill ${isOpen ? "active" : ""}`}>
            <div className="avatar-box">{avatarInitials}</div>
            <span className="username-text">{username}</span>
          </div>
          <WindowControls />
        </div>
      </header>

      <div className="settings-layout-wrapper">
        <div className="settings-layout">

          <aside className="settings-sidebar">
            <div className="news-badge profile-badge">Профиль</div>
            <div className="news-title-block">
              <h1>{username}</h1>
              <div className="news-version">Управление игровым аккаунтом</div>
            </div>

            <nav className="settings-nav-list">
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Обзор аккаунта</span>
                  <span className="settings-nav-hint">Статус и подписка</span>
                </span>
              </button>

              <button
                type="button"
                className={`settings-nav-item ${activeTab === "skin" ? "active" : ""}`}
                onClick={() => setActiveTab("skin")}
              >
                <Sparkles size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Внешний вид</span>
                  <span className="settings-nav-hint">Скин и плащ</span>
                </span>
              </button>

              <button
                type="button"
                className={`settings-nav-item ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <Shield size={18} />
                <span className="settings-nav-text">
                  <span className="settings-nav-title">Безопасность</span>
                  <span className="settings-nav-hint">Пароль и сессии</span>
                </span>
              </button>
            </nav>

            <div className="news-details settings-savebar" style={{ marginTop: "auto" }}>
              <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.reload(); }}>
                <LogOut size={16} />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </aside>

          <div className="settings-content">

            {activeTab === "profile" && (
              <>
                <div className="patch-header">
                  <h2>Личная карточка</h2>
                  <p>Общая информация о вашем игровом профиле SubReel.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">

                    {/* КАРТОЧКА СМЕНЫ НИКНЕЙМА */}
                    <div className="settings-card">
                      <div className="settings-card-icon">
                        <User size={18} />
                      </div>
                      <div className="settings-card-main">
                        <h4>Игровой псевдоним</h4>
                        {!editMode ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>{username}</span>
                            <button className="secondary-btn" style={{ padding: "4px 10px", height: "30px", borderRadius: "8px" }} onClick={() => { setNewName(username); setEditMode(true); }}>
                              <Edit2 size={12} /> Изменить
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0 12px", color: "#fff", fontSize: "14px" }}
                              maxLength={16}
                            />
                            <button className="secondary-btn" style={{ height: "36px", background: "#4C85FF", color: "#000" }} onClick={handleNameSubmit}>Сохранить</button>
                            <button className="secondary-btn" style={{ height: "36px" }} onClick={() => setEditMode(false)}>Отмена</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="settings-card premium-card">
                      <div className="settings-card-icon">
                        <Crown size={18} />
                      </div>
                      <div className="settings-card-main">
                        <div className="settings-card-head">
                          <h4>Статус подписки: SubReel Plus</h4>
                          <span className="settings-value-pill premium-pill">Активен</span>
                        </div>
                        <p>Вам доступны уникальные плащи, HD-скины и приоритетный доступ к тестовым сборкам.</p>
                      </div>
                    </div>

                    <div className="settings-card">
                      <div className="settings-card-icon">
                        <CheckCircle2 size={18} style={{ color: "#4C85FF" }} />
                      </div>
                      <div className="settings-card-main">
                        <h4>Игровой статус</h4>
                        <p style={{ marginTop: "4px" }}>Защита авторизации пройдена успешно. Клиент готов к подключению к серверам.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Остальные вкладки остаются без изменений */}
            {activeTab === "skin" && (
              <>
                <div className="patch-header">
                  <h2>Кастомизация персонажа</h2>
                  <p>Загрузка и управление вашим игровым образом.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <div className="settings-card">
                      <div className="settings-card-icon"><Upload size={18} /></div>
                      <div className="settings-card-main">
                        <h4>Загрузить скин</h4>
                        <p>Поддерживаются форматы .png (64x64 или 64x32). HD-скины доступны Plus-игрокам.</p>
                        <button className="secondary-btn" style={{ marginTop: "12px" }}>Выбрать файл</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "security" && (
              <>
                <div className="patch-header">
                  <h2>Безопасность учетной записи</h2>
                  <p>Контроль доступа к вашему аккаунту.</p>
                </div>
                <div className="patch-scroll-area">
                  <div className="settings-card-list">
                    <div className="settings-card">
                      <div className="settings-card-icon"><Shield size={18} /></div>
                      <div className="settings-card-main">
                        <h4>Двухфакторная аутентификация (2FA)</h4>
                        <p>Защитите свой аккаунт с помощью одноразовых кодов в приложении.</p>
                        <button className="secondary-btn" style={{ marginTop: "12px" }}>Настроить 2FA</button>
                      </div>
                    </div>
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