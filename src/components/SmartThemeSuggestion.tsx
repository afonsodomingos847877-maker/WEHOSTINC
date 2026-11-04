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
    <div className="fixed bottom-5 sm:bottom-6 right-4 sm:right-6 z-50 max-w-[340px] sm:max-w-[380px] w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="relative group overflow-hidden rounded-2xl bg-slate-950/95 text-white border border-white/20 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset] backdrop-blur-2xl">
        {/* Glow de fundo */}
        <div
          className={`absolute -inset-1 rounded-2xl blur-xl opacity-30 transition-opacity bg-gradient-to-r ${
            isNight ? 'from-indigo-500 via-blue-500 to-purple-600' : 'from-amber-400 via-orange-400 to-yellow-300'
          }`}
        />

        <div className="relative flex items-start gap-3">
          {/* Ícone */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
              isNight
                ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
            }`}
          >
            {isNight ? <Moon className="w-5 h-5 animate-pulse" /> : <Sun className="w-5 h-5 animate-spin-slow" />}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Sugestão Inteligente
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
              {isNight ? 'Já passa das 18h! Ativar Modo Noturno?' : 'Já amanheceu! Ativar Modo Claro?'}
            </h4>
            <p className="text-[11px] text-slate-300 leading-snug mt-1">
              {isNight
                ? 'Detectámos o anoitecer. O Modo Escuro reduz o cansaço visual e economiza bateria.'
                : 'A luz do dia voltou. Deseja alternar para o Modo Claro para melhor legibilidade?'}
            </p>

            {/* Ações */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleAccept}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                {isNight ? 'Ativar Modo Noturno' : 'Ativar Modo Claro'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Agora não
              </button>
            </div>
          </div>

          {/* Botão Fechar no canto */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white transition"
            title="Fechar sugestão"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
