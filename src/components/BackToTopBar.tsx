'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTopBar() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <aside 
      aria-label="Voltar ao Topo"
      className="w-full bg-white border-t border-slate-200 py-3.5 sm:py-4 px-4 shadow-xs relative z-20"
    >
      <div className="container mx-auto flex items-center justify-center">
        <button
          onClick={scrollToTop}
          type="button"
          className="inline-flex items-center space-x-2 text-slate-900 hover:text-blue-600 font-bold text-xs sm:text-sm tracking-wide transition-colors group cursor-pointer focus:outline-none"
          title="Voltar ao Topo"
        >
          <ArrowUp className="w-4 h-4 text-slate-800 group-hover:text-blue-600 group-hover:-translate-y-0.5 transition-transform duration-300" />
          <span>Voltar ao Topo</span>
        </button>
      </div>
    </aside>
  );
}
