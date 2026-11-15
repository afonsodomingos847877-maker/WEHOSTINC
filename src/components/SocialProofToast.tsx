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

    // Regras de Intervalo:
    // 1. Só deve aparecer a 1ª vez após 5 minutos (300.000 ms) no site
    // 2. Só volta a aparecer após passar mais 15 minutos (900.000 ms)
    // 3. Permanece visível durante 6 segundos e recolhe
    const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutos
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000; // 15 minutos
    const DISPLAY_DURATION_MS = 6000; // 6 segundos
    const SESSION_START_KEY = 'wehost_session_start_time';
    const LAST_SHOWN_KEY = 'wehost_social_proof_last_shown';

    const now = Date.now();
    let startTime = now;
    let lastShown = 0;

    try {
      const storedStart = sessionStorage.getItem(SESSION_START_KEY);
      if (storedStart) {
        const parsed = Number(storedStart);
        if (!isNaN(parsed) && parsed > 0) startTime = parsed;
      } else {
        sessionStorage.setItem(SESSION_START_KEY, String(now));
      }

      const storedLastShown = sessionStorage.getItem(LAST_SHOWN_KEY);
      if (storedLastShown) {
        const parsed = Number(storedLastShown);
        if (!isNaN(parsed) && parsed > 0) lastShown = parsed;
      }
    } catch {
      startTime = now;
    }

    let delay = 0;
    if (lastShown > 0) {
      // Já apareceu anteriormente: só volta a aparecer quando passarem mais 15 minutos
      const timeSinceLastShown = now - lastShown;
      if (timeSinceLastShown < FIFTEEN_MINUTES_MS) {
        delay = FIFTEEN_MINUTES_MS - timeSinceLastShown;
      } else {
        delay = 4000; // Já passaram os 15 minutos: exibe após 4s discretos nesta página
      }
    } else {
      // Primeira vez na sessão: só exibe após completar 5 minutos de navegação no site
      const sessionElapsed = now - startTime;
      if (sessionElapsed < FIVE_MINUTES_MS) {
        delay = FIVE_MINUTES_MS - sessionElapsed;
      } else {
        delay = 4000; // Já tem mais de 5 minutos no site: exibe após 4s
      }
    }

    let hideTimer: NodeJS.Timeout | null = null;
    let nextCycleTimer: NodeJS.Timeout | null = null;

    const triggerToast = () => {
      setVisible(true);
      try {
        sessionStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      } catch {}

      // Exibe durante 6 segundos e depois recolhe
      hideTimer = setTimeout(() => {
        setVisible(false);
        setCurrentIndex((prev) => (prev + 1) % proofs.length);

        // Só volta a aparecer após passarem mais 15 minutos!
        nextCycleTimer = setTimeout(() => {
          triggerToast();
        }, FIFTEEN_MINUTES_MS);
      }, DISPLAY_DURATION_MS);
    };

    const initialTimer = setTimeout(triggerToast, delay);

    return () => {
      clearTimeout(initialTimer);
      if (hideTimer) clearTimeout(hideTimer);
      if (nextCycleTimer) clearTimeout(nextCycleTimer);
      setVisible(false);
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
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-slate-200/80 text-slate-900 w-[195px] sm:w-[220px] relative group flex items-start gap-2 transition-all duration-300">
        {/* Ícone com Ponto Pulsante */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
            <ShoppingBag className="w-3 h-3 text-emerald-600" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-1 ring-white" />
          </span>
        </div>

        {/* Conteúdo com Boa Leitura */}
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center justify-between gap-1 leading-tight mb-0.5">
            <span className="text-[10.5px] font-bold text-slate-900 truncate">
              {current.userName} <span className="text-[9px] font-normal text-slate-500">({current.location})</span>
            </span>
            <span className="text-[8.5px] text-slate-400 font-mono shrink-0">{current.timeAgo}</span>
          </div>

          <p className="text-[9.5px] text-slate-600 font-medium leading-tight line-clamp-1">
            {current.action}
          </p>

          <div className="flex items-center gap-1 mt-1 text-[8.5px] font-semibold text-emerald-600 leading-none">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>Compra Verificada</span>
          </div>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={() => {
            setVisible(false);
            setDismissed(true);
            try {
              sessionStorage.setItem('wehost_social_proof_last_shown', String(Date.now()));
            } catch {}
          }}
          className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-0.5 rounded-full transition cursor-pointer"
          title="Fechar"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
