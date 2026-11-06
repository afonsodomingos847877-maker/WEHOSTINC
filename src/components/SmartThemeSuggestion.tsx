'use client';

import React from 'react';
import { Moon, Sun, X, Sparkles } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { soundEffects } from '@/lib/soundEffects';

export default function SmartThemeSuggestion() {
  const { isSmartPromptOpen, smartPromptType, acceptSmartPrompt, dismissSmartPrompt } = useTheme();

  if (!isSmartPromptOpen || !smartPromptType) return null;

  const isNight = smartPromptType === 'night';

  const handleAccept = () => {
    try {
      soundEffects.playClickSound();
    } catch (_) {}
    acceptSmartPrompt();
  };

  const handleDismiss = () => {
    try {
      soundEffects.playClickSound();
    } catch (_) {}
    dismissSmartPrompt();
  };

  return (
    <div className="fixed bottom-5 sm:bottom-6 right-4 sm:right-6 z-50 max-w-[310px] w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
      <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-neutral-900/90 text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-neutral-700/90 p-3.5 shadow-xl backdrop-blur-md">
        <div className="relative flex items-start gap-2.5">
          {/* Ícone */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isNight
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            {isNight ? <Moon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                Modo Noturno
              </span>
            </div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
              {isNight ? 'Ativar Modo Noturno?' : 'Ativar Modo Claro?'}
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug mt-0.5">
              {isNight
                ? 'Detectámos o anoitecer. Reduz o cansaço visual.'
                : 'A luz do dia voltou. Alternar para modo claro?'}
            </p>

            {/* Ações */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <button
                type="button"
                onClick={handleAccept}
                className="px-3 py-1 bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-100 active:scale-95 text-white dark:text-neutral-900 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isNight ? 'Ativar' : 'Ativar Claro'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2 py-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </div>

          {/* Botão Fechar no canto */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
            title="Fechar sugestão"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
