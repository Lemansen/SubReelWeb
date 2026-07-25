"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, FolderOpen, Gamepad2, LoaderCircle, Settings2, Sparkles, Wrench, X } from "lucide-react";

const checks = ["Launcher", "Java 21", "Minecraft", "Assets", "Авторизация"];
type Theme = "night" | "ocean" | "violet";

export default function LauncherStartPage() {
  const [step, setStep] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [installPath, setInstallPath] = useState("C:\\SubReel");
  const [keepOpen, setKeepOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>("night");
  const [selectedModule, setSelectedModule] = useState<"launcher" | "tools" | null>(null);
  const [launchStep, setLaunchStep] = useState(0);
  const router = useRouter();
  const ready = step >= checks.length;

  useEffect(() => {
    const timer = window.setInterval(() => setStep((value) => Math.min(value + 1, checks.length)), 680);
    return () => window.clearInterval(timer);
  }, []);

  function openModule(module: "launcher" | "tools") {
    if (!ready || selectedModule) return;
    setSelectedModule(module);
    setLaunchStep(1);
    window.setTimeout(() => setLaunchStep(2), 520);
    window.setTimeout(() => setLaunchStep(3), 1020);
    window.setTimeout(() => router.push(module === "launcher" ? "/concept/launcher/launcher" : "/concept/launcher/tools"), 1550);
  }

  return (
    <main className={`launcher-container subreel-2026 theme-${theme}`}>
      <section className="app-window">
        <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="ambient ambient-three" />
        <header className="topbar">
          <div className="brand"><span className="brand-mark">S</span><div><strong>SubReel</strong><small>EXPERIMENTAL BUILD</small></div></div>
          <span className="build-version">v0.1.0</span>
          <button className="settings-button" type="button" onClick={() => setSettingsOpen(true)}><Settings2 size={16} /> Настройки</button>
        </header>

        <div className={`hero ${ready ? "ready" : ""}`}>
          <div className="hero-symbol">{ready ? <Check size={30} /> : <LoaderCircle size={29} />}</div>
          <p className="eyebrow">SUBREEL STARTUP</p>
          <h1>{ready ? "Всё готово" : "Добро пожаловать\nв SubReel"}</h1>
          <p className="hero-copy">{ready ? "Выберите, что хотите открыть" : "Проверяем игровое окружение…"}</p>
          <div className="check-timeline">
            {checks.map((item, index) => {
              const done = index < step;
              const active = index === step && !ready;
              return <div className={`check-item ${done ? "done" : ""} ${active ? "active" : ""}`} key={item}><span>{done ? <Check size={12} /> : active ? <i /> : null}</span>{item}</div>;
            })}
          </div>
        </div>

        <div className={`workspace ${ready ? "visible" : ""} ${selectedModule ? "choosing" : ""} ${selectedModule ? `selected-${selectedModule}` : ""}`}>
          <p className="workspace-title">ЧТО ХОТИТЕ ОТКРЫТЬ?</p>
          <div className="product-cards">
            <button className={`product-card launcher-product ${selectedModule === "launcher" ? "selected" : ""}`} type="button" onClick={() => openModule("launcher")}>
              <div className="card-glow" /><div className="product-icon"><Gamepad2 size={31} /></div>
              <div className="product-content"><span>GAME SPACE</span><h2>Launcher</h2><p>{selectedModule === "launcher" ? ["Подготавливаем клиент…", "Проверяем компоненты…", "Запускаем Minecraft…"][Math.max(0, launchStep - 1)] : "Запуск Minecraft, готовые сборки и быстрое подключение к серверу SubReel."}</p><ul><li>Играть</li><li>Сборки</li><li>Сервер SubReel</li></ul></div>
              {selectedModule === "launcher" ? <ModuleOverlay icon={<Gamepad2 size={36} />} title="Запускаем лаунчер" step={launchStep} /> : <div className="open-link">Открыть <ArrowUpRight size={17} /></div>}
            </button>
            <button className={`product-card tools-product ${selectedModule === "tools" ? "selected" : ""}`} type="button" onClick={() => openModule("tools")}>
              <div className="card-glow" /><div className="product-icon"><Wrench size={31} /></div>
              <div className="product-content"><span>CREATOR SPACE</span><h2>Tools</h2><p>{selectedModule === "tools" ? ["Подготавливаем инструменты…", "Проверяем рабочую папку…", "Открываем мастерскую…"][Math.max(0, launchStep - 1)] : "Полезное для Minecraft: моды, схемы, ресурспаки, локальный сервер и т.д."}</p><ul><li>Моды</li><li>Схемы</li><li>Ресурспаки</li><li>Локальный сервер</li></ul></div>
              {selectedModule === "tools" ? <ModuleOverlay icon={<Wrench size={36} />} title="Открываем Tools" step={launchStep} /> : <div className="open-link">Открыть <ArrowUpRight size={17} /></div>}
            </button>
          </div>
        </div>

        <footer className="window-footer"><Sparkles size={14} /> <span>{ready ? "SubReel готов к работе" : "Подготавливаем ваше игровое пространство"}</span></footer>

        {settingsOpen && <div className="settings-layer"><section className="settings-panel"><header><div><Settings2 size={18} /><h2>Настройки</h2></div><button type="button" onClick={() => setSettingsOpen(false)}><X size={18} /></button></header><label>Папка установки<small>Игра, моды и данные инструментов будут храниться здесь.</small><div className="folder-field"><FolderOpen size={16} /><input value={installPath} onChange={(event) => setInstallPath(event.target.value)} /></div></label><div className="theme-group"><span>Оформление</span><div>{(["night", "ocean", "violet"] as Theme[]).map((item) => <button key={item} type="button" className={theme === item ? "selected" : ""} onClick={() => setTheme(item)}>{item === "night" ? "Night" : item === "ocean" ? "Ocean" : "Purple"}</button>)}</div></div><label className="toggle"><input type="checkbox" checked={keepOpen} onChange={(event) => setKeepOpen(event.target.checked)} /><span><b>Оставлять окно открытым</b><small>{keepOpen ? "После запуска игры лаунчер останется на экране." : "После запуска игры окно закроется."}</small></span></label><button className="done-button" type="button" onClick={() => setSettingsOpen(false)}>Готово</button></section></div>}
      </section>
      <style>{`
        .subreel-2026{--accent:#78c8ff;--accent-rgb:120,200,255;--accent-two:#7666ff;background:#06070a!important}.theme-ocean{--accent:#76ddff;--accent-rgb:118,221,255;--accent-two:#2887ff}.theme-violet{--accent:#c3a6ff;--accent-rgb:195,166,255;--accent-two:#8554f7}.app-window{position:relative;box-sizing:border-box;width:1100px;height:700px;padding:26px 32px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:32px;color:#f8f8fa;background:radial-gradient(circle at center,rgba(255,255,255,.025),transparent 58%),#0b0c10;box-shadow:0 40px 120px rgba(0,0,0,.78)}.ambient{position:absolute;width:390px;height:390px;border-radius:50%;filter:blur(70px);opacity:.22;pointer-events:none;animation:ambient 12s ease-in-out infinite}.ambient-one{top:-170px;left:-120px;background:rgb(var(--accent-rgb))}.ambient-two{right:-130px;bottom:-180px;background:var(--accent-two);animation-delay:-5s}.ambient-three{width:260px;height:260px;right:27%;top:34%;opacity:.08;background:#fff;animation-delay:-8s}.topbar{position:relative;z-index:1;display:flex;align-items:center}.brand{display:flex;align-items:center;gap:10px}.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;color:#07101a;background:linear-gradient(135deg,var(--accent),#e3f7ff);font-size:1.05rem;font-weight:950;box-shadow:0 0 28px rgba(var(--accent-rgb),.27)}.brand div{display:grid;gap:2px}.brand strong{font-size:.98rem;letter-spacing:.01em}.brand small,.build-version{color:#898c96;font-size:.62rem;font-weight:850;letter-spacing:.1em}.build-version{margin-left:14px;padding-left:14px;border-left:1px solid rgba(255,255,255,.12)}.settings-button{margin-left:auto;display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#b6b8c1;background:rgba(255,255,255,.035);font-size:.78rem;font-weight:800;transition:.2s}.settings-button:hover{color:#fff;border-color:rgba(var(--accent-rgb),.45);background:rgba(var(--accent-rgb),.09)}.hero{position:relative;z-index:1;width:390px;margin:auto;text-align:center;transition:all .6s cubic-bezier(.2,.8,.2,1)}.hero.ready{margin:39px auto 16px}.hero-symbol{display:grid;place-items:center;width:66px;height:66px;margin:auto;border:1px solid rgba(var(--accent-rgb),.28);border-radius:22px;color:var(--accent);background:linear-gradient(145deg,rgba(var(--accent-rgb),.22),rgba(255,255,255,.03));box-shadow:0 16px 35px rgba(var(--accent-rgb),.13)}.hero:not(.ready) .hero-symbol svg{animation:spin 1.4s linear infinite}.eyebrow{margin-top:17px;color:var(--accent);font-size:.63rem;font-weight:900;letter-spacing:.18em}.hero h1{margin-top:10px;white-space:pre-line;font-size:2rem;line-height:1.04;font-weight:950;letter-spacing:-.04em}.hero-copy{margin-top:10px;color:#a3a5ad;font-size:.86rem}.check-timeline{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:24px}.check-item{display:grid;justify-items:center;gap:6px;color:#696b74;font-size:.63rem;font-weight:750}.check-item span{display:grid;place-items:center;width:18px;height:18px;border:1px solid #353740;border-radius:50%;background:#17181d}.check-item.done{color:#c3c5cd}.check-item.done span{border-color:rgba(var(--accent-rgb),.5);color:var(--accent);background:rgba(var(--accent-rgb),.12)}.check-item.active{color:#fff}.check-item.active span{border-color:var(--accent);background:var(--accent);box-shadow:0 0 16px rgba(var(--accent-rgb),.5)}.check-item.active i{width:5px;height:5px;border-radius:50%;background:#06111a}.workspace{position:relative;z-index:1;width:820px;margin:0 auto;opacity:0;transform:translateY(22px) scale(.97);pointer-events:none;transition:opacity .55s ease,transform .55s cubic-bezier(.2,.8,.2,1)}.workspace.visible{opacity:1;transform:none;pointer-events:auto}.workspace-title{margin-bottom:11px;color:#878993;font-size:.65rem;font-weight:900;letter-spacing:.15em}.product-cards{display:grid;grid-template-columns:1fr 1fr;gap:15px}.product-card{position:relative;min-height:205px;padding:21px;overflow:hidden;display:grid;grid-template-columns:58px 1fr;gap:15px;border:1px solid rgba(255,255,255,.1);border-radius:21px;color:#fff;text-decoration:none;background:rgba(255,255,255,.045);backdrop-filter:blur(24px);transition:transform .28s cubic-bezier(.2,.8,.2,1),border-color .28s,box-shadow .28s}.product-card:nth-child(2){transition-delay:120ms}.product-card:hover{transform:translateY(-5px) rotateX(1.4deg) scale(1.018);border-color:rgba(var(--accent-rgb),.52);box-shadow:0 18px 44px rgba(0,0,0,.3),0 0 35px rgba(var(--accent-rgb),.1)}.card-glow{position:absolute;inset:-80px -30px auto auto;width:180px;height:120px;background:radial-gradient(circle,rgba(var(--accent-rgb),.22),transparent 68%);opacity:0;transition:opacity .3s}.product-card:hover .card-glow{opacity:1}.tools-product{--accent:#c3a6ff;--accent-rgb:195,166,255}.product-icon{position:relative;display:grid;place-items:center;width:58px;height:58px;border-radius:18px;color:var(--accent);background:linear-gradient(145deg,rgba(var(--accent-rgb),.25),rgba(255,255,255,.04));box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 0 30px rgba(var(--accent-rgb),.12)}.product-content{position:relative}.product-content>span{color:var(--accent);font-size:.61rem;font-weight:900;letter-spacing:.12em}.product-content h2{margin-top:7px;font-size:1.2rem;font-weight:950}.product-content p{margin-top:6px;color:#adb0b9;font-size:.77rem;line-height:1.45}.product-content ul{display:flex;gap:6px;flex-wrap:wrap;margin-top:13px;padding:0;list-style:none}.product-content li{padding:4px 7px;border:1px solid rgba(255,255,255,.1);border-radius:999px;color:#c7c9d0;background:rgba(0,0,0,.15);font-size:.62rem;font-weight:750}.open-link{position:absolute;right:19px;bottom:17px;display:flex;align-items:center;gap:5px;color:var(--accent);font-size:.73rem;font-weight:900}.window-footer{position:relative;z-index:1;display:flex;justify-content:center;align-items:center;gap:7px;margin-top:auto;color:#777a84;font-size:.7rem}.window-footer svg{color:var(--accent)}.settings-layer{position:absolute;z-index:5;inset:0;display:grid;place-items:center;background:rgba(3,4,7,.64);backdrop-filter:blur(15px)}.settings-panel{width:440px;box-sizing:border-box;padding:23px;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(22,23,29,.88);box-shadow:0 28px 90px rgba(0,0,0,.55);backdrop-filter:blur(28px)}.settings-panel header{display:flex;align-items:center;justify-content:space-between}.settings-panel header>div,.settings-panel h2{display:flex;align-items:center;gap:8px}.settings-panel h2{font-size:1rem}.settings-panel header button{border:0;background:transparent;color:#a1a3ad}.settings-panel label{display:grid;gap:8px;margin-top:19px;color:#f8f8fa;font-size:.82rem;font-weight:800}.settings-panel label>small{color:#999ba5;font-size:.71rem;font-weight:400}.folder-field{display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid rgba(255,255,255,.11);border-radius:10px;color:var(--accent);background:rgba(0,0,0,.22)}.folder-field input{width:100%;height:42px;border:0;outline:0;color:#fff;background:transparent}.theme-group{display:grid;gap:9px;margin-top:19px;color:#f8f8fa;font-size:.82rem;font-weight:800}.theme-group>div{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.theme-group button{height:36px;border:1px solid rgba(255,255,255,.11);border-radius:10px;color:#a8aab3;background:rgba(255,255,255,.035);font-size:.72rem;font-weight:800}.theme-group button.selected{border-color:rgba(var(--accent-rgb),.65);color:#fff;background:rgba(var(--accent-rgb),.14)}.toggle{display:flex!important;grid-template-columns:none!important;align-items:flex-start;gap:10px}.toggle input{margin-top:3px;accent-color:var(--accent)}.toggle b,.toggle small{display:block}.toggle small{margin-top:4px;color:#999ba5;font-size:.71rem;font-weight:400}.done-button{width:100%;height:43px;margin-top:22px;border:0;border-radius:11px;color:#07111a;background:linear-gradient(90deg,var(--accent),#d9f2ff);font-weight:950}@keyframes ambient{0%,100%{transform:translate(0,0)}50%{transform:translate(-24px,-17px)}}@keyframes spin{to{transform:rotate(360deg)}}
        .product-card{appearance:none;font:inherit;text-align:left;cursor:pointer}.workspace.choosing .product-card:not(.selected){opacity:.55;filter:saturate(.3);pointer-events:none}.workspace.choosing .product-card.selected{border-color:rgba(var(--accent-rgb),.72);box-shadow:0 20px 52px rgba(0,0,0,.34),0 0 46px rgba(var(--accent-rgb),.15)}.workspace.selected-tools{--accent:#c3a6ff;--accent-rgb:195,166,255}.workspace.choosing .product-card.selected .card-glow{opacity:1}.launch-overlay{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;border-radius:inherit;color:#fff;background:rgba(10,12,18,.72);backdrop-filter:blur(12px);animation:overlayIn .22s ease}.launch-overlay strong{margin-top:4px;font-size:1rem}.launch-overlay>span{color:#b5b8c1;font-size:.75rem}.launch-orbit{display:grid;place-items:center;width:66px;height:66px;border:2px solid rgba(var(--accent-rgb),.32);border-top-color:var(--accent);border-radius:50%;color:var(--accent);background:rgba(var(--accent-rgb),.11);box-shadow:0 0 30px rgba(var(--accent-rgb),.23);animation:orbit 1s linear infinite}.launch-progress{width:176px;height:6px;margin-top:8px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.13)}.launch-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),#fff);transition:width .42s ease}@keyframes overlayIn{from{opacity:0}to{opacity:1}}@keyframes orbit{to{transform:rotate(360deg)}}
      `}</style>
    </main>
  );
}

function ModuleOverlay({ icon, title, step }: { icon: ReactNode; title: string; step: number }) {
  const messages = ["Инициализация", "Проверка файлов", "Запуск модуля"];
  return <div className="launch-overlay"><div className="launch-orbit">{icon}</div><strong>{title}</strong><span>{messages[Math.max(0, step - 1)]}…</span><div className="launch-progress"><i style={{ width: `${step * 33}%` }} /></div></div>;
}