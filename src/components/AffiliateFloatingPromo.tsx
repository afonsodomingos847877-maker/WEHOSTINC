'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

const SESSION_DISMISS_KEY = 'wehost_affiliate_promo_dismissed';
const DELAY_MS = 5000; // 5 segundos
const ROTATE_INTERVAL_MS = 10000; // 10 segundos por campanha

interface PromoCampaign {
  id: 'affiliate' | 'academy' | 'revista';
  title: string;
  badge: string;
  badgeClass: string;
  description: string;
  ctaLabel: string;
  href?: string;
}

const PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'affiliate',
    title: 'Ganhe 30% de Comissão!',
    badge: 'Renda Extra',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    description:
      'Indique os nossos serviços e transforme as suas recomendações numa oportunidade de renda extra.',
    ctaLabel: 'Ser Afiliado',
  },
  {
    id: 'academy',
    title: 'Academia Web WeHostHere',
    badge: 'Cursos & Certificados',
    badgeClass: 'bg-sky-100 text-sky-800',
    description:
      'Aprenda programação, cloud e design na prática com cursos e certificado oficial verificado.',
    ctaLabel: 'Explorar Academia',
    href: '/academy',
  },
  {
    id: 'revista',
    title: 'Revista Tech & Startups',
    badge: 'Leitura Grátis',
    badgeClass: 'bg-violet-100 text-violet-800',
    description:
      'Artigos, guias de código, IA, design e tendências digitais para impulsionar o seu negócio.',
    ctaLabel: 'Ler Revista',
    href: '/revista',
  },
];

export default function AffiliateFloatingPromo() {
  const router = useRouter();
  const pathname = usePathname();

  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const availableCampaigns = isAffiliate
    ? PROMO_CAMPAIGNS.filter((c) => c.id !== 'affiliate')
    : PROMO_CAMPAIGNS;

  const currentCampaign = availableCampaigns[activeIndex % availableCampaigns.length] || availableCampaigns[0];

  // Notificar outros componentes (ex: Assistente Virtual) para esconder o ícone lateral quando a barra estiver visível
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isVisible) {
        document.body.setAttribute('data-affiliate-promo-open', 'true');
      } else {
        document.body.removeAttribute('data-affiliate-promo-open');
      }
      window.dispatchEvent(
        new CustomEvent('wehost:affiliate-promo-state', { detail: { open: isVisible } })
      );
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.removeAttribute('data-affiliate-promo-open');
        window.dispatchEvent(
          new CustomEvent('wehost:affiliate-promo-state', { detail: { open: false } })
        );
      }
    };
  }, [isVisible]);

  useEffect(() => {
    // 1. Apenas na página inicial
    if (pathname !== '/') return;

    // 2. Verificar se já foi dispensado na sessão atual
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem(SESSION_DISMISS_KEY);
      if (dismissed === 'true') return;
    }

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // 3. Verificar estado do utilizador no backend
    fetch('/api/affiliates/check-status', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;

        if (data) {
          setIsAuthenticated(!!data.authenticated);
          setIsAffiliate(!!data.isAffiliate);
        }

        // Monta o componente escondido na base (para quem já é afiliado, promove Academia e Revista)
        setIsRendered(true);

        // 4. Temporizador de 5 segundos para fazer a barra subir suavemente de baixo para cima
        timer = setTimeout(() => {
          if (isMounted) {
            setIsVisible(true);
          }
        }, DELAY_MS);
      })
      .catch((err) => {
        console.warn('[AffiliatePromo] Erro ao verificar estado:', err);
        setIsRendered(true);
        timer = setTimeout(() => {
          if (isMounted) {
            setIsVisible(true);
          }
        }, DELAY_MS);
      });

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  // Rotação suave entre Afiliados, Academia Web e Revista
  useEffect(() => {
    if (!isVisible || isPaused || availableCampaigns.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % availableCampaigns.length);
        setIsTransitioning(false);
      }, 220);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isVisible, isPaused, availableCampaigns.length]);

  const handleDismiss = () => {
    soundEffects.playClickSound();
    // Anima de volta para baixo
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wehost:affiliate-promo-state', { detail: { open: false } })
      );
      try {
        sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
      } catch {}
    }
    setTimeout(() => {
      setIsRendered(false);
    }, 700);
  };

  const handleClickAction = () => {
    soundEffects.playClickSound();

    if (currentCampaign.href) {
      router.push(currentCampaign.href);
      return;
    }

    if (isAuthenticated) {
      // Cenários B e C: Vai direto ao painel / adesão de afiliados
      router.push('/dashboard/affiliates');
    } else {
      // Cenário A: Salva intenção e vai para registro com redirect preservado
      try {
        sessionStorage.setItem('wehost_auth_intent', 'affiliate');
        sessionStorage.setItem('wehost_auth_redirect', '/dashboard/affiliates');
      } catch {}
      router.push('/register?intent=affiliate&redirect=/dashboard/affiliates');
    }
  };

  if (!isRendered || pathname !== '/') {
    return null;
  }

  return (
    <>
      {isVisible && (
        <style>{`
          button[title="Assistente Virtual WEHOSTHERE"],
          [data-virtual-assistant-btn] {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `}</style>
      )}
      <aside
        aria-label="Barra Promocional do Programa de Afiliados"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`fixed bottom-0 left-0 right-0 z-[60] w-full bg-white border-t border-slate-200/95 shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.12)] transition-transform duration-700 ease-out transform ${
          isVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Esquerda: Mascote Oficial + Textos */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 relative shrink-0">
            <Image
              src="/mascote-transparent.png"
              alt="Mascote Oficial WeHostHere"
              width={44}
              height={44}
              priority
              className="w-full h-full object-contain select-none"
            />
          </div>
          <div className={`min-w-0 transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                {currentCampaign.title}
              </span>
              <span className={`hidden md:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${currentCampaign.badgeClass}`}>
                {currentCampaign.badge}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-1 sm:line-clamp-2 mt-0.5 leading-snug">
              {currentCampaign.description}
            </p>
          </div>
        </div>

        {/* Direita: Botão de Ação + Botão Fechar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <button
            type="button"
            onClick={handleClickAction}
            className={`inline-flex items-center space-x-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}
            title={currentCampaign.title}
          >
            <span>{currentCampaign.ctaLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar barra de afiliados"
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
