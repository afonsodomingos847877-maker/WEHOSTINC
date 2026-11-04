'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSmartPromptOpen: boolean;
  smartPromptType: 'night' | 'day' | null;
  acceptSmartPrompt: () => void;
  dismissSmartPrompt: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isSmartPromptOpen, setIsSmartPromptOpen] = useState(false);
  const [smartPromptType, setSmartPromptType] = useState<'night' | 'day' | null>(null);

  // Aplica a classe `dark` no elemento <html>
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyTheme(newTheme);
      try {
        localStorage.setItem('wehost_theme', newTheme);
      } catch (_) {}
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // Inicialização e deteção de preferência salva ou horário
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let savedTheme: Theme | null = null;
    try {
      savedTheme = localStorage.getItem('wehost_theme') as Theme | null;
    } catch (_) {}

    const now = new Date();
    const currentHour = now.getHours();
    const isNightTime = currentHour >= 18 || currentHour < 6;

    // Se o utilizador já tiver uma escolha gravada no localStorage, respeitar
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Se não tiver preferência, aplicar tema de acordo com a hora
      const initialTheme = isNightTime ? 'dark' : 'light';
      setThemeState(initialTheme);
      applyTheme(initialTheme);
    }

    // Verificar se devemos sugerir a troca inteligente baseada no horário
    const promptDismissed = sessionStorage.getItem('wehost_theme_prompt_dismissed');
    if (!promptDismissed) {
      if (isNightTime && savedTheme === 'light') {
        // Já passou das 18h e o utilizador está em modo claro
        const timer = setTimeout(() => {
          setSmartPromptType('night');
          setIsSmartPromptOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      } else if (!isNightTime && savedTheme === 'dark') {
        // Já é dia (06h+) e o utilizador está em modo escuro
        const timer = setTimeout(() => {
          setSmartPromptType('day');
          setIsSmartPromptOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [applyTheme]);

  const acceptSmartPrompt = () => {
    if (smartPromptType === 'night') {
      setTheme('dark');
    } else if (smartPromptType === 'day') {
      setTheme('light');
    }
    setIsSmartPromptOpen(false);
    try {
      sessionStorage.setItem('wehost_theme_prompt_dismissed', 'true');
    } catch (_) {}
  };

  const dismissSmartPrompt = () => {
    setIsSmartPromptOpen(false);
    try {
      sessionStorage.setItem('wehost_theme_prompt_dismissed', 'true');
    } catch (_) {}
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isSmartPromptOpen,
        smartPromptType,
        acceptSmartPrompt,
        dismissSmartPrompt
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
