"use client";

import {
  X,
  Settings,
  Minus,
  Square,
  Box,
  Trash2,
  FileText,
  Wrench,
  ChevronRight
} from "lucide-react";

interface WindowControlsProps {
  toggleFullscreen: () => void;
  closeLauncher: () => void;
}

const WindowControls = ({ toggleFullscreen, closeLauncher }: WindowControlsProps) => (
  <div className="window-controls">
    <button className="window-btn" title="Свернуть">
      <Minus size={14} />
    </button>
    <button className="window-btn" onClick={toggleFullscreen} title="Развернуть">
      <Square size={11} />
    </button>
    <button className="window-btn close" onClick={closeLauncher} title="Закрыть">
      <X size={14} />
    </button>
  </div>
);

export default function SubReelStudio() {
  // Функции управления окном
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const closeApp = () => {
    window.location.href = "/";
  };

  // Список утилит (карточек)
  const tools = [
    { id: "mods", title: "Менеджер модов", desc: "Управление файлами в папке mods и быстрая настройка конфигураций", icon: <Box size={24} /> },
    { id: "cleaner", title: "Очистка мусора", desc: "Удаление старых логов, кэша и скопившихся отчетов о крашах", icon: <Trash2 size={24} /> },
    { id: "logs", title: "Анализатор логов", desc: "Удобное чтение latest.log с автоматической подсветкой ошибок", icon: <FileText size={24} /> },
    { id: "options", title: "Редактор настроек", desc: "Тонкая настройка options.txt и скрытых параметров клиента", icon: <Wrench size={24} /> }
  ];

  return (
    <main className="launcher-container">
      <div className="app-shell" style={{ gridTemplateRows: "76px minmax(0, 1fr)" }}>
        
        {/* Верхний навбар */}
        <header className="navbar">
          <div className="logo-zone">
            <span className="logo-icon" style={{ background: "#78C8FF", color: "#000" }}>S</span>
            <div>
              <h3>SubReel Studio</h3>
              <p>v1.0.0 Toolkit</p>
            </div>
          </div>
          
          <div className="header-right-zone">
            <button className="window-btn" title="Настройки студии">
              <Settings size={16} />
            </button>
            <WindowControls toggleFullscreen={toggleFullscreen} closeLauncher={closeApp} />
          </div>
        </header>

        {/* Главная область */}
        <main className="content" style={{ display: "flex", alignItems: "stretch", justifyContent: "center", minHeight: 0 }}>
          <div className="tab-wrapper" style={{ 
            padding: "22px 28px", 
            display: "flex", 
            flexDirection: "column", 
            gap: "22px", 
            width: "100%",
            height: "100%",
            alignItems: "stretch",
            justifyContent: "flex-start",
            overflowY: "auto",
            maxWidth: "1000px",
            margin: "0 auto",
            boxSizing: "border-box" 
          }}>
            
            <div className="center-hero" style={{ textAlign: "center", marginBottom: "0" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "700", margin: "0 0 16px 0", letterSpacing: "-0.5px" }}>
                Инструментарий
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 auto", fontSize: "16px", maxWidth: "500px", lineHeight: "1.6" }}>
                Выберите необходимый модуль для настройки, оптимизации или анализа вашего клиента.
              </p>
            </div>

            {/* Сетка красивых карточек */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))", 
              gap: "14px" 
            }}>
              {tools.map(tool => (
                <div 
                  key={tool.id} 
                  style={{ 
                    background: "linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)", 
                    padding: "20px", 
                    borderRadius: "20px", 
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    minHeight: "155px",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(145deg, rgba(120, 200, 255, 0.08) 0%, rgba(120, 200, 255, 0.02) 100%)";
                    e.currentTarget.style.border = "1px solid rgba(120, 200, 255, 0.3)";
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(120, 200, 255, 0.1)";
                    
                    const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
                    if (iconBox) {
                        iconBox.style.background = "#78C8FF";
                        iconBox.style.color = "#000";
                    }
                    
                    const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                    if (arrow) {
                        arrow.style.transform = "translateX(4px)";
                        arrow.style.color = "#78C8FF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)";
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";

                    const iconBox = e.currentTarget.querySelector('.icon-box') as HTMLElement;
                    if (iconBox) {
                        iconBox.style.background = "rgba(120, 200, 255, 0.1)";
                        iconBox.style.color = "#78C8FF";
                    }

                    const arrow = e.currentTarget.querySelector('.arrow-icon') as HTMLElement;
                    if (arrow) {
                        arrow.style.transform = "translateX(0)";
                        arrow.style.color = "rgba(255, 255, 255, 0.2)";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div 
                      className="icon-box"
                      style={{ 
                        width: "56px",
                        height: "56px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(120, 200, 255, 0.1)", 
                        color: "#78C8FF",
                        borderRadius: "14px",
                        transition: "all 0.3s ease"
                      }}>
                      {tool.icon}
                    </div>
                    <div className="arrow-icon" style={{ transition: "all 0.3s ease", color: "rgba(255, 255, 255, 0.2)" }}>
                      <ChevronRight size={24} />
                    </div>
                  </div>
                  
                  <div>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "19px", fontWeight: "600", color: "#fff", letterSpacing: "0.2px" }}>
                      {tool.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.5)", lineHeight: "1.6" }}>
                      {tool.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </main>
  );
}
