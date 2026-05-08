import React from 'react';
import { Heart, Zap, Coffee, ExternalLink, Target } from 'lucide-react';

export default function DonatePage() {
  const daUrl = "https://www.donationalerts.com/r/subreel";
  const boostyUrl = "https://boosty.to/subreel";

  // Ссылки на твои виджеты
  const widgets = [
    "https://www.donationalerts.com/widget/goal/9612922?token=JrPbvFuYbkUaVB419RSG",
    "https://www.donationalerts.com/widget/goal/9612925?token=JrPbvFuYbkUaVB419RSG"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col items-center py-16 px-4">
      <div className="max-w-3xl w-full">
        
        {/* Хедер */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
              <Heart className="w-8 h-8 text-red-500 fill-red-500/10" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
            Поддержка SubReel
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
            Твой вклад помогает нам оплачивать хостинг и делать лаунчер лучше каждый день.
          </p>
        </div>

        {/* Секция живых целей */}
        <div className="bg-[#111111] p-6 md:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-8 px-2">
            <Target className="w-5 h-5 text-red-500" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Актуальные сборы</h3>
          </div>
          
          <div className="space-y-6">
            {widgets.map((src, idx) => (
              <div key={idx} className="relative w-full bg-black/40 rounded-2xl overflow-hidden border border-white/5 group">
                {/* Iframe с фиксом прозрачности и отступов */}
                <iframe 
                  src={src} 
                  className="w-full h-[76px] block" 
                  frameBorder="0" 
                  scrolling="no"
                  style={{ colorScheme: 'dark' }}
                />
                {/* Декоративный блик сверху */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.02] to-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Сетка кнопок */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* DonationAlerts */}
          <a 
            href={daUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative flex items-center gap-4 bg-[#111111] p-5 rounded-[1.5rem] border border-white/5 hover:border-red-500/50 hover:bg-red-500/[0.02] transition-all"
          >
            <div className="p-3 bg-red-500 rounded-xl shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-none">Донат</h3>
              <p className="text-gray-500 text-xs mt-1">DonationAlerts</p>
            </div>
            <ExternalLink className="absolute top-4 right-4 w-3 h-3 text-gray-700 group-hover:text-white transition-colors" />
          </a>

          {/* Boosty */}
          <a 
            href={boostyUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative flex items-center gap-4 bg-[#111111] p-5 rounded-[1.5rem] border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/[0.02] transition-all"
          >
            <div className="p-3 bg-[#e2733c] rounded-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-none">Boosty</h3>
              <p className="text-gray-500 text-xs mt-1">Подписка на контент</p>
            </div>
            <ExternalLink className="absolute top-4 right-4 w-3 h-3 text-gray-700 group-hover:text-white transition-colors" />
          </a>
        </div>

        {/* Копирайт */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-medium leading-loose max-w-xs mx-auto">
            SubReel Studio © 2026<br/>
            Спасибо за вашу поддержку!
          </p>
        </div>

      </div>
    </div>
  );
}