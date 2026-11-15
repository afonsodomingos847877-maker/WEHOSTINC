'use client';

import React from 'react';
import { Moon, Sun, X } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80 pl-2.5 pr-1.5 py-1 shadow-md backdrop-blur-md">
        <span className="flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
          {isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
        </span>
        <span className="text-[11px] font-medium whitespace-nowrap">
          {isNight ? 'Modo noturno?' : 'Modo claro?'}
        </span>
        <button
          type="button"
          onClick={handleAccept}
          className="px-2.5 py-0.5 bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-100 active:scale-95 text-white dark:text-neutral-900 rounded-full text-[11px] font-semibold transition cursor-pointer"
        >
          Ativar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
          title="Agora não"
          aria-label="Fechar sugestão de tema"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
