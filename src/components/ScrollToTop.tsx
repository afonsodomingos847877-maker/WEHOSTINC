'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (
        document.body.style.overflow === 'hidden' ||
        document.documentElement.style.overflow === 'hidden'
      ) {
        setIsVisible(false);
        return;
      }

      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;

      if (currentScroll > 100 && totalScroll > 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (totalScroll > 0) {
        const progress = Math.min(Math.max((currentScroll / totalScroll) * 100, 0), 100);
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const observer = new MutationObserver(handleScroll);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  if (!isVisible || pathname?.startsWith('/webmail')) return null;

  const roundedPercentage = Math.round(scrollProgress);

  return (
    <div className="fixed bottom-6 right-5 z-40 animate-in fade-in zoom-in-90 duration-300">
      {/* Cápsula Vertical Flutuante de Scroll */}
      <div className="relative group bg-white/95 backdrop-blur-xl border border-gray-200/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset] rounded-full p-1.5 flex flex-col items-center gap-1 w-11 sm:w-12 transition-all duration-300 hover:shadow-primary-500/15 hover:border-primary-300">
        
        {/* Botão Superior — Subir ao Topo */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Rolar para o topo"
          title="Rolar para o topo"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 hover:bg-sky-100 text-[#0284c7] hover:text-[#0369a1] flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-2xs group/up"
        >
          <ChevronUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] group-hover/up:-translate-y-0.5 transition-transform" />
        </button>

        {/* Indicador de Percentagem Central */}
        <div className="py-0.5 text-center select-none">
          <span className="text-[10px] sm:text-[11px] font-black text-slate-700 tracking-tighter block font-mono">
            {roundedPercentage}%
          </span>
        </div>

        {/* Botão Inferior — Descer ao Fundo com anel de progresso em Azul WEHOSTHERE */}
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Rolar para o fundo"
          title="Rolar para o fundo"
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer group/down overflow-hidden"
        >
          {/* Fundo SVG com anel de progresso circular dinâmico */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 36 36">
            {/* Trilha do anel */}
            <path
              className="text-sky-100"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Progresso azul WEHOSTHERE */}
            <path
              className="text-[#0284c7] transition-all duration-150"
              strokeDasharray={`${scrollProgress}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>

          <ChevronDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0284c7] stroke-[2.5] relative z-10 group-hover/down:translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
