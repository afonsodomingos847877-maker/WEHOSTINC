'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, PartyPopper, X } from 'lucide-react';

interface ApprovalCelebrationProps {
  show: boolean;
  type: 'email' | 'domain';
  name: string;
  onDone: () => void;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const COLORS = [
  '#10b981', '#059669', '#3b82f6', '#f59e0b',
  '#ec4899', '#8b5cf6', '#34d399', '#60a5fa',
];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; rotation: number; rotSpeed: number;
      shape: 'rect' | 'circle';
    }[] = [];

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: randomBetween(canvas.width * 0.35, canvas.width * 0.65),
        y: randomBetween(canvas.height * 0.3, canvas.height * 0.5),
        vx: randomBetween(-7, 7),
        vy: randomBetween(-14, -3),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: randomBetween(6, 12),
        rotation: randomBetween(0, Math.PI * 2),
        rotSpeed: randomBetween(-0.15, 0.15),
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    let animId: number;
    let tick = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += 0.4;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        const alpha = Math.max(0, 1 - tick / 80);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      tick++;
      if (tick < 90) {
        animId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[10001]"
    />
  );
}

export default function ApprovalCelebration({ show, type, name, onDone }: ApprovalCelebrationProps) {
  useEffect(() => {
    if (show) {
      // Sumir rapidamente após 2.5 segundos
      const t = setTimeout(onDone, 2500);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!show) return null;

  return (
    <>
      <Confetti />

      {/* Backdrop transparente no centro */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[10000] transition-opacity duration-200" 
        onClick={onDone}
      />

      {/* Card Tema Branco - Centralizado na Tela com Animação Rápida */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10002] w-full max-w-sm px-4">
        <div
          className="relative bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 text-slate-900 overflow-hidden"
          style={{
            animation: 'centerPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          {/* Linha Decorativa no topo */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          {/* Botão de Fechar Rápido */}
          <button
            onClick={onDone}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-200">
              <PartyPopper className="w-6 h-6" />
            </div>

            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 font-extrabold text-base text-gray-900">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{type === 'email' ? 'E-mail Aprovado!' : 'Domínio Aprovado!'}</span>
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
              </div>

              <p className="text-gray-600 text-xs mt-1.5 leading-relaxed">
                <span className="font-bold text-gray-900">{name}</span> foi ativado pelo administrador e já está pronto a usar! 🎉
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes centerPop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
