'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  onClose: () => void;
  duration?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export default function Toast({
  type = 'success',
  title,
  message,
  onClose,
  duration = 3800,
  position = 'bottom-left'
}: ToastProps) {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Gatilho suave de fechamento com animação de saída deslizando para a esquerda
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 320);
  }, [onClose]);

  // Entrada animada
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setMounted(true);
    }, 20);
    return () => clearTimeout(showTimer);
  }, []);

  // Fechamento automático com contagem decrescente
  useEffect(() => {
    const autoCloseTimer = setTimeout(() => {
      handleDismiss();
    }, duration);
    return () => clearTimeout(autoCloseTimer);
  }, [handleDismiss, duration]);

  const config = {
    success: {
      bg: 'bg-slate-900/95 text-white border-emerald-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(16,185,129,0.15)]',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
      dot: 'bg-emerald-400'
    },
    error: {
      bg: 'bg-slate-900/95 text-white border-rose-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(244,63,94,0.15)]',
      badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      icon: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
      dot: 'bg-rose-400'
    },
    warning: {
      bg: 'bg-slate-900/95 text-white border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(245,158,11,0.15)]',
      badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      icon: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
      dot: 'bg-amber-400'
    },
    info: {
      bg: 'bg-slate-900/95 text-white border-sky-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.35),0_0_0_1px_rgba(14,165,233,0.15)]',
      badgeBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      icon: <Info className="h-4 w-4 text-sky-400 shrink-0" />,
      dot: 'bg-sky-400'
    }
  }[type];

  // Posição na tela (padrão canto inferior esquerdo)
  const positionClasses = {
    'bottom-left': 'bottom-5 sm:bottom-6 left-4 sm:left-6',
    'bottom-right': 'bottom-5 sm:bottom-6 right-4 sm:right-6',
    'top-left': 'top-20 left-4 sm:left-6',
    'top-right': 'top-20 right-4 sm:right-6'
  }[position];

  // Estado da animação: Desliza da esquerda para dentro, e ao sair desliza de volta para a esquerda
  const isSlideFromLeft = position.includes('left');
  const initialTranslate = isSlideFromLeft ? '-translate-x-[120%]' : 'translate-x-[120%]';
  const activeTranslate = 'translate-x-0';
  const exitTranslate = isSlideFromLeft ? '-translate-x-[130%]' : 'translate-x-[130%]';

  const transformClass = !mounted
    ? `${initialTranslate} opacity-0 scale-95`
    : isExiting
    ? `${exitTranslate} opacity-0 scale-95`
    : `${activeTranslate} opacity-100 scale-100`;

  return (
    <div
      className={`fixed ${positionClasses} z-50 pointer-events-auto transition-all duration-300 ease-out ${transformClass}`}
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        className={`flex items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-2xl border backdrop-blur-xl ${config.bg} max-w-[320px] sm:max-w-[360px]`}
      >
        {/* Badge do Ícone */}
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${config.badgeBg}`}>
          {config.icon}
        </div>

        {/* Conteúdo compacto */}
        <div className="flex-1 min-w-0 pr-1">
          {title && (
            <h4 className="font-bold text-[12px] sm:text-[13px] tracking-tight text-white leading-snug flex items-center gap-1.5">
              <span>{title}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse shrink-0`} />
            </h4>
          )}
          <p className="text-[11px] sm:text-[12px] text-slate-300 font-normal leading-tight mt-0.5 line-clamp-2">
            {message}
          </p>
        </div>

        {/* Botão de Fechar discreto */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Fechar notificação"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
