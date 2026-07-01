"use client";

import { useState } from "react";
import { X, Calendar, User } from "lucide-react";

interface NewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsPanel({ isOpen, onClose }: NewsPanelProps) {
  // Данные новостей
  const newsData = [
    {
      id: 1,
      category: "Лаунчер",
      title: "SubReelLauncher 1.0",
      version: "v3.0.0-release",
      date: "Сегодня в 14:20",
      author: "Lemansen",
      patchnotes: [
        { title: "Полноценная оптимизация FPS", desc: "Переработан движок рендеринга чанков. Стабильный прирост кадров на видеокартах серий GTX/RTX составляет до 25% за счет оптимизации памяти Java." },
        { title: "Новая сюжетная линия квестов", desc: "Добавлена цепочка из 40 стартовых заданий в главном хабе. Награды автоматически синхронизируются с вашим личным кабинетом." },
        { title: "Критические баги и исправления", desc: "Полностью решена проблема дублирования предметов при закрытии беспроводного терминала хранения. Обновлен сетевой протокол защиты." },
      ],
    },
    {
      id: 2,
      category: "Сервер",
      title: "Технические работы на TechnoMagic",
      version: "v1.4.2-server",
      date: "Вчера в 04:00",
      author: "TechTeam",
      patchnotes: [
        { title: "Обновление серверного ядра", desc: "Исправлены утечки памяти при высокой нагрузке онлайн-игроков. Лимит чанков на команду увеличен." },
        { title: "Глобальный баланс мобов", desc: "Ночные монстры стали сильнее на 15%, но шанс выпадения редких эссенций увеличен вдвое. Добавлен новый мини-босс на спавне." },
      ],
    },
    {
      id: 3,
      category: "Сервер",
      title: "Патч безопасности прокси",
      version: "v1.0.3-hotfix",
      date: "28.06.2026",
      author: "Lemansen",
      patchnotes: [
        { title: "Фикс DDoS-уязвимости", desc: "Заблокирован эксплойт с поддельной авторизацией пакетов сессии. Защита BungeeCord обновлена." },
      ],
    },
    {
      id: 4,
      category: "Сайт",
      title: "Обновление личного кабинета",
      version: "v2.1.0-web",
      date: "25.06.2026",
      author: "WebDev",
      patchnotes: [
        { title: "Интеграция платежной системы", desc: "Добавлены новые методы пополнения баланса без комиссии." },
        { title: "Реализация скинов высокого разрешения", desc: "Теперь вы можете загружать HD-скины и плащи размером до 1024x512 пикселей." },
      ],
    },
  ];

  const categories = ["Все", "Сервер", "Лаунчер", "Сайт"];
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const filteredNews = newsData.filter(
    (item) => selectedCategory === "Все" || item.category === selectedCategory
  );
  const currentNews = filteredNews[currentNewsIndex] || null;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentNewsIndex(0);
  };

  const handlePrevNews = () => {
    if (filteredNews.length <= 1) return;
    setCurrentNewsIndex((prev) => (prev === 0 ? filteredNews.length - 1 : prev - 1));
  };

  const handleNextNews = () => {
    if (filteredNews.length <= 1) return;
    setCurrentNewsIndex((prev) => (prev === filteredNews.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={`news-panel ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>
        <X size={24} />
      </button>

      <div className="news-layout">
        <div className="news-meta-side">
          {currentNews ? (
            <>
              <div className="news-badge">{currentNews.category}</div>
              <div className="news-title-block">
                <h1>{currentNews.title}</h1>
                <div className="news-version">Версия: <span>{currentNews.version}</span></div>
              </div>
              <div className="news-details">
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>{currentNews.date}</span>
                </div>
                <div className="detail-item">
                  <User size={16} />
                  <span>Разработчик: <strong>{currentNews.author}</strong></span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-news-state">В этой категории пока нет новостей.</div>
          )}

          <div className="news-tabs-container">
            <h4>Категории новостей</h4>
            <div className="news-categories-grid">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredNews.length > 0 && (
              <div className="news-slider-controls">
                <button className="slider-arrow-btn" onClick={handlePrevNews} disabled={filteredNews.length <= 1}>←</button>
                <span className="slider-counter">{currentNewsIndex + 1} из {filteredNews.length}</span>
                <button className="slider-arrow-btn" onClick={handleNextNews} disabled={filteredNews.length <= 1}>→</button>
              </div>
            )}
          </div>
        </div>

        <div className="news-body-side">
          <div className="patch-header">
            <h2>Патчноут изменений</h2>
            <p>Список исправлений, нововведений и оптимизаций сборки.</p>
          </div>

          <div className="patch-scroll-area">
            {currentNews && currentNews.patchnotes.length > 0 ? (
              <ul className="changelog-list">
                {currentNews.patchnotes.map((note, index) => (
                  <li key={index}>
                    <h4>{note.title}</h4>
                    <p>{note.desc}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-changes-text">Для данного события список изменений пуст или не требуется.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}