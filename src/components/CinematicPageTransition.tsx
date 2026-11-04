'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function CinematicPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showShutter, setShowShutter] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Escuta cliques em links internos para disparo instantâneo da transição cinematográfica
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Ignora cliques com teclas de atalho de nova aba (Ctrl, Meta, Shift, Alt)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !href.includes('#') &&
        target.target !== '_blank' &&
        !target.hasAttribute('download')
      ) {
        try {
          const targetUrl = new URL(href, window.location.origin);
          if (targetUrl.pathname !== window.location.pathname) {
            setIsNavigating(true);
            setShowShutter(true);
            setProgress(35);
          }
        } catch (_) {}
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => document.removeEventListener('click', handleLinkClick, { capture: true });
  }, []);

  // Quando o pathname muda (a nova página é montada)
  useEffect(() => {
    setProgress(100);
    setShowShutter(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
      setShowShutter(false);
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  return (
    <>
      {/* Estilos Globais da Transição Cinematográfica */}
      <style>{`
        @keyframes cinematicPageReveal {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes cinematicBeamPulse {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes cinematicFlash {
          0% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
          }
        }

        .cinematic-page-container-active {
          animation: cinematicPageReveal 450ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* 1. Feixe de Luz Superior estilo Laser Cinema (Top Progress Bar) */}
      <div
        className={`fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none transition-opacity duration-300 ${
          isNavigating || progress > 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 shadow-[0_0_14px_rgba(56,189,248,0.9)] transition-all duration-400 ease-out"
          style={{
            width: `${progress || (isNavigating ? 75 : 0)}%`,
            backgroundSize: '200% 200%',
            animation: 'cinematicBeamPulse 2s ease infinite',
          }}
        />
        {/* Ponto focal de brilho neon no bico da barra */}
        <div
          className="absolute top-0 h-[3px] w-12 bg-white blur-[2px] shadow-[0_0_12px_#ffffff] transition-all duration-400 ease-out pointer-events-none"
          style={{
            left: `calc(${progress || (isNavigating ? 75 : 0)}% - 24px)`,
          }}
        />
      </div>

      {/* 2. Efeito Shutter / Clarão Atmosférico de Lente Cinematográfica */}
      {showShutter && (
        <div
          className="fixed inset-0 pointer-events-none z-[99990] bg-gradient-to-b from-sky-400/10 via-primary-500/5 to-transparent transition-opacity duration-500"
          style={{
            animation: 'cinematicFlash 500ms ease-out forwards',
          }}
        />
      )}

      {/* 3. Conteúdo da Página (sem transform/filter persistente para não afetar elementos fixed) */}
      <div key={pathname} className={showShutter ? 'cinematic-page-container-active w-full' : 'w-full'}>
        {children}
      </div>
    </>
  );
}
