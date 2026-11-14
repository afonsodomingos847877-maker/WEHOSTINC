'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasBottomBar, setHasBottomBar] = useState(false);

  useEffect(() => {
    const syncBottomBar = () => {
      setHasBottomBar(
        document.body.hasAttribute('data-affiliate-promo-open') ||
        document.body.hasAttribute('data-scroll-card-open')
      );
    };

    const handlePromoOrCardState = () => {
      syncBottomBar();
    };

    syncBottomBar();
    window.addEventListener('wehost:affiliate-promo-state', handlePromoOrCardState);
    window.addEventListener('wehost:scroll-card-state', handlePromoOrCardState);

    const attrObserver = new MutationObserver(syncBottomBar);
    attrObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-affiliate-promo-open', 'data-scroll-card-open'],
    });

    return () => {
      window.removeEventListener('wehost:affiliate-promo-state', handlePromoOrCardState);
      window.removeEventListener('wehost:scroll-card-state', handlePromoOrCardState);
      attrObserver.disconnect();
    };
  }, []);

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
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const halfScroll = totalScroll * 0.5;

    // Se estivermos abaixo de 52% (ex: 100%, 75%), o primeiro clique leva para os 50%
    if (currentScroll > halfScroll + 40) {
      window.scrollTo({
        top: halfScroll,
        behavior: 'smooth',
      });
    } else {
      // Se já estiver na metade (50%) ou acima, o segundo clique leva direto ao topo (0%)
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const scrollToBottom = () => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const halfScroll = totalScroll * 0.5;

    // Se estivermos acima da metade (ex: 0% a 48%), o primeiro clique desce para os 50%
    if (currentScroll < halfScroll - 40) {
      window.scrollTo({
        top: halfScroll,
        behavior: 'smooth',
      });
    } else {
      // Se já estiver na metade ou além, o segundo clique desce até o final da página (100%)
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  if (!isVisible || pathname?.startsWith('/webmail')) return null;

  const roundedPercentage = Math.round(scrollProgress);
  const isPastHalf = roundedPercentage > 52;
  const isBeforeHalf = roundedPercentage < 48;

  return (
    <div
      className={`fixed right-5 z-[70] transition-all duration-300 animate-in fade-in zoom-in-90 ${
        hasBottomBar ? 'bottom-[88px] sm:bottom-[92px]' : 'bottom-6'
      }`}
    >
      {/* Cápsula Vertical Flutuante de Scroll */}
      <div className="relative group bg-white/95 backdrop-blur-xl border border-gray-200/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset] rounded-full p-1.5 flex flex-col items-center gap-1 w-11 sm:w-12 transition-all duration-300 hover:shadow-primary-500/15 hover:border-primary-300">
        
        {/* Botão Superior — Subir: 1º clique vai a 50%, 2º clique vai ao topo */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={isPastHalf ? "Rolar para o meio (50%)" : "Rolar para o topo (0%)"}
          title={isPastHalf ? "Rolar para a metade (50%)" : "Rolar para o topo (0%)"}
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

        {/* Botão Inferior — Descer: 1º clique vai a 50%, 2º clique vai ao fundo */}
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label={isBeforeHalf ? "Rolar para o meio (50%)" : "Rolar para o fundo (100%)"}
          title={isBeforeHalf ? "Rolar para a metade (50%)" : "Rolar para o fundo (100%)"}
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
