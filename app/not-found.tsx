import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] selection:bg-[var(--color-accent-blue)] selection:text-white relative px-4 overflow-hidden">
      
      {/* ── Фоновая сетка ── */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.05] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        
        {/* Иконка */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mb-8 rounded-[2rem] bg-[var(--color-panel-bg)] border border-[var(--color-border-sharp)] flex items-center justify-center shadow-2xl shadow-blue-500/10">
          <Map size={40} className="text-[var(--color-accent-blue)]" strokeWidth={2} />
        </div>

        {/* Бейдж */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] text-[10px] font-[1000] uppercase tracking-[0.3em] mb-6 border border-[var(--color-accent-blue)]/20">
          Ошибка 404
        </div>

        {/* Заголовок */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-[1000] tracking-tighter mb-6 uppercase italic leading-none">
          Пустой <span className="text-[var(--color-accent-blue)]">Чанк</span>
        </h1>

        {/* Описание */}
        <p className="text-base sm:text-lg text-[var(--color-text-gray)] font-medium leading-relaxed mb-10 max-w-md mx-auto">
          Кажется, вы забрели на непрогруженную территорию. Такой страницы не существует, либо она была перемещена в другое измерение.
        </p>

        {/* Кнопка "Назад" */}
        <Link
          href="/"
          className="group flex items-center gap-4 px-6 py-4 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border-sharp)] hover:border-[var(--color-accent-blue)] transition-all hover:shadow-[0_20px_40px_-10px_rgba(59,130,246,0.2)]"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] flex items-center justify-center group-hover:-translate-x-1 transition-transform">
            <ArrowLeft size={16} strokeWidth={3} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-[var(--color-text)] mt-0.5">
            Вернуться на спавн
          </span>
        </Link>
        
      </div>
    </div>
  );
}