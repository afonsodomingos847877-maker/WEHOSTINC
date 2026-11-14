'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

const SESSION_DISMISS_KEY = 'wehost_affiliate_promo_dismissed';
const DELAY_MS = 5000; // 5 segundos

export default function AffiliateFloatingPromo() {
  const router = useRouter();
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    // 1. Não exibir fora da homepage
    if (pathname !== '/') {
      return;
    }

    // 2. Não exibir se o utilizador já fechou a barra nesta sessão
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem(SESSION_DISMISS_KEY);
      if (dismissed === 'true') {
        return;
      }
    }

    let isMounted = true;

    // 3. Verificar estado do utilizador no backend
    fetch('/api/affiliates/check-status', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;

        setIsAuthenticated(!!data.authenticated);
        setIsAffiliate(!!data.isAffiliate);

        // Se o utilizador já for afiliado, não exibir a barra promocional
        if (data.isAffiliate) {
          return;
        }

        // 4. Temporizador de 5 segundos para exibir automaticamente
        const timer = setTimeout(() => {
          if (isMounted) {
            setIsVisible(true);
          }
        }, DELAY_MS);

        return () => clearTimeout(timer);
      })
      .catch((err) => {
        console.warn('[AffiliatePromo] Erro ao verificar estado:', err);
        // Mesmo em falha de rede da verificação, após 5s exibe para visitantes normais
        const timer = setTimeout(() => {
          if (isMounted) {
            setIsVisible(true);
          }
        }, DELAY_MS);
        return () => clearTimeout(timer);
      });

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleDismiss = () => {
    soundEffects.playClickSound();
    setIsVisible(false);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
    } catch {}
  };

  const handleClickAction = () => {
    soundEffects.playClickSound();

    if (isAuthenticated) {
      // Cenário B & C: Utilizador autenticado vai diretamente ao painel / adesão de afiliados
      router.push('/dashboard/affiliates');
    } else {
      // Cenário A: Visitante sem conta — guardar intenção e encaminhar para cadastro com redirect preservado
      try {
        sessionStorage.setItem('wehost_auth_intent', 'affiliate');
        sessionStorage.setItem('wehost_auth_redirect', '/dashboard/affiliates');
      } catch {}
      router.push('/register?intent=affiliate&redirect=/dashboard/affiliates');
    }
  };

  if (!isVisible || pathname !== '/') {
    return null;
  }

  return (
    <aside
      aria-label="Programa de Afiliados WeHostHere"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="bg-white/95 backdrop-blur-md text-neutral-900 rounded-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] border border-neutral-200/90 p-2.5 sm:p-3 flex items-center justify-between gap-3 sm:gap-4 transition-all hover:shadow-[0_16px_42px_-6px_rgba(2,132,199,0.22)]">
        {/* Lado Esquerdo: Mascote Oficial */}
        <div className="relative shrink-0 flex items-center justify-center pl-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 relative drop-shadow-sm">
            <Image
              src="/mascote-transparent.png"
              alt="Mascote Oficial WeHostHere"
              width={48}
              height={48}
              priority
              className="w-full h-full object-contain select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Centro: Área de Comunicação */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs sm:text-sm font-black text-neutral-900 tracking-tight leading-tight">
              Ganhe 30% de Comissão!
            </h3>
            <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Renda Extra
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-600 leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5">
            Indique os nossos serviços e transforme as suas recomendações numa oportunidade de renda extra.
          </p>
        </div>

        {/* Lado Direito: Botão de Ação + Botão Fechar */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleClickAction}
            className="inline-flex items-center space-x-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
            title="Aderir ao Programa de Afiliados"
          >
            <span>Ser Afiliado</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Botão de Fechar Discreto */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar banner promocional de afiliados"
            title="Fechar por agora"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
