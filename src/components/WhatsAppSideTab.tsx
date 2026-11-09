'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function WhatsAppSideTab() {
  const pathname = usePathname();

  // Não exibir no webmail
  if (pathname?.startsWith('/webmail')) return null;

  const whatsappUrl = 'https://wa.me/258848335618?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20WEHOSTHERE';

  return (
    <aside aria-label="Contacto WhatsApp">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar connosco pelo WhatsApp (+258 84 833 5618)"
        title="Falar connosco pelo WhatsApp (+258 84 833 5618)"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 group flex flex-col items-center bg-white/95 hover:bg-white text-slate-800 py-3 sm:py-3.5 px-2 sm:px-2.5 rounded-r-2xl border-y border-r border-slate-200 shadow-[0_6px_25px_-5px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_30px_-5px_rgba(2,132,199,0.3)] hover:border-primary-300 transition-all duration-300 hover:translate-x-0.5 active:scale-95 cursor-pointer backdrop-blur-md"
      >
        {/* Indicador de Status Online Pulsante em Azul do Sistema */}
        <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] mb-2 shadow-[0_0_8px_rgba(2,132,199,0.8)] animate-pulse" />

        {/* Texto Vertical "WhatsApp" */}
        <span 
          className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-800 group-hover:text-primary-600 transition-colors select-none mb-2 font-sans"
          style={{ 
            writingMode: 'vertical-rl', 
            letterSpacing: '0.14em' 
          }}
        >
          WhatsApp
        </span>

        {/* Ícone Redondo Oficial do WhatsApp com Fundo em Azul do Sistema */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] group-hover:from-[#0284c7] group-hover:to-[#0369a1] text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs">
          <svg 
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/>
          </svg>
        </div>
      </a>
    </aside>
  );
}

