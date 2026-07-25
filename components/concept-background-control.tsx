"use client";

import { Palette, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "subreel_concept_background";
const DEFAULT_BACKGROUND = "#15ff00";

export function ConceptBackgroundControl() {
  const [color, setColor] = useState(DEFAULT_BACKGROUND);

  const applyColor = (nextColor: string) => {
    setColor(nextColor);
    localStorage.setItem(STORAGE_KEY, nextColor);
    document.documentElement.style.setProperty("--concept-background", nextColor);
    document.body.style.setProperty("background", nextColor, "important");
    document.querySelectorAll<HTMLElement>(".launcher-container").forEach((element) => {
      element.style.setProperty("background", nextColor, "important");
    });
  };

  useEffect(() => {
    applyColor(localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BACKGROUND);
  }, []);

  return <div className="concept-background-control"><Palette size={16} /><span>Фон</span><input type="color" value={color} onChange={(event) => applyColor(event.target.value)} aria-label="Выбрать цвет фона" /><button type="button" onClick={() => applyColor(DEFAULT_BACKGROUND)} title="Вернуть зелёный фон"><RotateCcw size={14} /></button><style jsx global>{`.launcher-container{background:var(--concept-background,#15ff00)!important}.concept-background-control{position:fixed;top:18px;left:18px;z-index:10000;display:flex;align-items:center;gap:8px;padding:8px 9px 8px 11px;border:1px solid rgba(255,255,255,.14);border-radius:12px;color:#e9edf4;background:rgba(14,16,21,.86);box-shadow:0 12px 28px rgba(0,0,0,.28);backdrop-filter:blur(12px);font:750 12px/1 Inter,system-ui,sans-serif}.concept-background-control svg{color:#78c8ff}.concept-background-control input{width:27px;height:27px;padding:0;border:0;border-radius:8px;background:none;cursor:pointer}.concept-background-control button{display:grid;width:27px;height:27px;place-items:center;border:0;border-radius:7px;color:#aab0bc;background:rgba(255,255,255,.07);cursor:pointer}.concept-background-control button:hover{color:#fff;background:rgba(255,255,255,.14)}`}</style></div>;
}
 
