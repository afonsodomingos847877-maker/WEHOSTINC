'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

/**
 * Fundo vivo 100% em código (SVG + CSS Mesh Gradient), inspirado nas ondas
 * diagonais azul-elétrico e branco puro da WeHosThere.
 * Anima continuamente e reage com ondas luminosas sempre que o utilizador clica.
 */
export default function AnimatedMeshGradient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const rippleIdRef = useRef(0);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Só dispara se o clique ocorrer dentro da área visível deste fundo
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      const relX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const relY = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      const id = ++rippleIdRef.current;

      setRipples((prev) => [...prev.slice(-3), { id, x: relX, y: relY }]);
      setIsPulsing(true);

      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setIsPulsing(false), 700);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 1100);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      const ny = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
      setOffset({ x: nx * 18, y: ny * 12 });
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none bg-white select-none"
    >
      {/* 1. Aura atmosférica superior-direita (Azul Royal Elétrico) */}
      <div
        className="absolute -top-[22%] -right-[12%] w-[78%] h-[92%] rounded-full blur-[70px] sm:blur-[95px] will-change-transform transition-transform duration-700 ease-out"
        style={{
          background:
            'radial-gradient(ellipse at 68% 28%, #0066ff 0%, #1d8cff 36%, #7cc4ff 68%, transparent 100%)',
          opacity: isPulsing ? 0.98 : 0.88,
          transform: `translate3d(${offset.x * 0.6}px, ${offset.y * 0.6}px, 0) scale(${isPulsing ? 1.04 : 1})`,
          animation: 'meshWaveTeal 11s ease-in-out infinite',
        }}
      />

      {/* 2. Aura inferior-esquerda (Azul Celeste Vibrante) */}
      <div
        className="absolute -bottom-[28%] -left-[14%] w-[64%] h-[76%] rounded-full blur-[65px] sm:blur-[88px] will-change-transform transition-transform duration-700 ease-out"
        style={{
          background:
            'radial-gradient(ellipse at 35% 65%, #0077ff 0%, #38a8ff 42%, #bae6fd 72%, transparent 100%)',
          opacity: isPulsing ? 0.92 : 0.82,
          transform: `translate3d(${-offset.x * 0.5}px, ${-offset.y * 0.5}px, 0) scale(${isPulsing ? 1.05 : 1})`,
          animation: 'meshWaveViolet 9.5s ease-in-out infinite',
        }}
      />

      {/* 3. Faixas de seda diagonais em SVG (idênticas às curvas da referência, com movimento suave) */}
      <svg
        viewBox="0 0 1440 720"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out will-change-transform"
        style={{
          transform: `translate3d(${offset.x * 0.35}px, ${offset.y * 0.35}px, 0) scale(${isPulsing ? 1.025 : 1.01})`,
        }}
      >
        <defs>
          <linearGradient id="whRibbonTop" x1="15%" y1="65%" x2="100%" y2="5%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="35%" stopColor="#7cc4ff" stopOpacity="0.45" />
            <stop offset="72%" stopColor="#0f85ff" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#0062f5" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="whRibbonMid" x1="25%" y1="80%" x2="100%" y2="25%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0" />
            <stop offset="40%" stopColor="#60b8ff" stopOpacity="0.48" />
            <stop offset="78%" stopColor="#007aff" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#0066ff" stopOpacity="0.92" />
          </linearGradient>

          <linearGradient id="whBottomRightWhite" x1="50%" y1="55%" x2="95%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#f0f8ff" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {/* Faixa diagonal superior (curva suave da esquerda-centro até ao topo-direito) */}
        <path
          d="M 280,450 C 660,360 980,140 1440,0 L 1440,390 C 1020,410 680,580 340,720 L 0,720 L 0,560 Z"
          fill="url(#whRibbonTop)"
          style={{ animation: 'meshBridge 12s ease-in-out infinite' }}
        />

        {/* Segunda faixa diagonal mais brilhante (efeito onda dupla sobreposta) */}
        <path
          d="M 520,720 C 860,520 1120,380 1440,365 L 1440,720 Z"
          fill="url(#whBottomRightWhite)"
        />

        {/* Linha de luz sutil acompanhando o arco principal */}
        <path
          d="M 320,442 C 700,348 1010,136 1440,2"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="2.2"
        />
        <path
          d="M 540,715 C 880,515 1135,380 1440,366"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
        />
      </svg>

      {/* 4. Halo branco puro no topo-esquerdo e canto inferior-direito para legibilidade perfeita */}
      <div
        className="absolute -top-[18%] -left-[14%] w-[58%] h-[68%] rounded-full blur-[65px]"
        style={{
          background:
            'radial-gradient(ellipse at 26% 24%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.82) 48%, transparent 82%)',
        }}
      />
      <div
        className="absolute -bottom-[22%] -right-[10%] w-[52%] h-[58%] rounded-full blur-[65px]"
        style={{
          background:
            'radial-gradient(ellipse at 74% 78%, rgba(255,255,255,0.98) 0%, rgba(248,252,255,0.8) 52%, transparent 82%)',
        }}
      />

      {/* 5. Ondas vivas interativas disparadas no ponto exato de cada clique */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: '420px',
            height: '420px',
            transform: 'translate(-50%, -50%) scale(0.15)',
            background:
              'radial-gradient(circle, rgba(0, 122, 255, 0.34) 0%, rgba(56, 189, 248, 0.22) 42%, rgba(255, 255, 255, 0) 72%)',
            animation: 'whBgRipple 1.05s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        />
      ))}

      <style jsx>{`
        @keyframes whBgRipple {
          0% {
            transform: translate(-50%, -50%) scale(0.12);
            opacity: 0.95;
          }
          55% {
            opacity: 0.55;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
