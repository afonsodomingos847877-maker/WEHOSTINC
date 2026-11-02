'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';
import { dataManager, SocialProof } from '@/lib/data';

export default function SocialProofToast() {
  const pathname = usePathname();
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [newsletterVisible, setNewsletterVisible] = useState<boolean>(false);

  useEffect(() => {
    const activeProofs = dataManager.getSocialProofs().filter((p) => p.active);
    if (activeProofs.length > 0) {
      setProofs(activeProofs);
    }
  }, []);

  // Verificar se newsletter popup está visível
  useEffect(() => {
    const checkNewsletterVisibility = () => {
      const dismissed = localStorage.getItem('newsletter_popup_dismissed');
      setNewsletterVisible(!dismissed);
    };

    checkNewsletterVisibility();
    
    // Verificar periodicamente caso o estado mude
    const interval = setInterval(checkNewsletterVisibility, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Não mostrar nas páginas de login/registro/dashboard/webmail/admin/revista
    const isAppPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/webmail') || pathname?.startsWith('/admin') || pathname?.startsWith('/revista');
    if (isAppPage) return;
    
    // Não mostrar se newsletter popup está visível
    if (newsletterVisible) return;

    if (proofs.length === 0 || dismissed) return;

    // Exibir primeiro toast após 4s
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Ciclo discreto: exibe 4.5s, esconde por 8s, depois avança
    const cycleInterval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % proofs.length);
        setVisible(true);
      }, 8000);
    }, 13000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [proofs, dismissed, pathname, newsletterVisible]);

  // Não renderizar se estiver em páginas de login/registro/dashboard/webmail/admin/revista ou newsletter estiver visível
  const isAppPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/dashboard') || pathname?.startsWith('/webmail') || pathname?.startsWith('/admin') || pathname?.startsWith('/revista');
  if (isAppPage || newsletterVisible || proofs.length === 0 || dismissed) return null;

  const current = proofs[currentIndex] || proofs[0];
  const isAcademy = pathname?.startsWith('/academy');
  const isRevista = pathname?.startsWith('/revista');
  const topPos = (isAcademy || isRevista) ? 'top-[118px] sm:top-[124px]' : 'top-20 sm:top-24 md:top-[90px]';

  return (
    <div
      className={`fixed ${topPos} left-3 sm:left-6 z-[100] transition-all duration-500 ease-out transform ${
        visible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : '-translate-y-3 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-slate-950/50 backdrop-blur-md rounded-xl p-1.5 sm:p-2 shadow-lg border border-white/15 text-white w-[185px] sm:w-[205px] relative group flex items-start gap-1.5 transition-all duration-300">
        {/* Ícone com Ponto Pulsante */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-2.5 h-2.5 text-emerald-400" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
        </div>

        {/* Conteúdo com Boa Leitura */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center justify-between gap-1 leading-tight mb-0.5">
            <span className="text-[10px] font-bold text-white truncate">
              {current.userName} <span className="text-[8px] font-normal text-slate-300">({current.location})</span>
            </span>
            <span className="text-[8px] text-slate-400 font-mono shrink-0">{current.timeAgo}</span>
          </div>

          <p className="text-[9px] text-slate-200 font-medium leading-tight line-clamp-1">
            {current.action}
          </p>

          <div className="flex items-center gap-1 mt-0.5 text-[8px] font-semibold text-emerald-400 leading-none">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>Compra Verificada</span>
          </div>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
          title="Fechar"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
