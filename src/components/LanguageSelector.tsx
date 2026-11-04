'use client';

import { useLanguage } from '@/context/LanguageContext';
import { soundEffects } from '@/lib/soundEffects';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleSelectLanguage = (lang: 'pt' | 'en') => {
    soundEffects.playClickSound();
    setLanguage(lang);
  };

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-white/10 p-0.5 rounded-lg border border-gray-200/80 dark:border-white/10 text-[10px] sm:text-xs font-bold transition-colors">
      <button
        type="button"
        onClick={() => handleSelectLanguage('pt')}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
          language === 'pt'
            ? 'bg-white dark:bg-white/20 text-primary-700 dark:text-white shadow-xs border border-gray-200 dark:border-white/20'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        title="Português (Moçambique)"
      >
        <span>🇲🇿</span>
        <span>PT</span>
      </button>
      <button
        type="button"
        onClick={() => handleSelectLanguage('en')}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
          language === 'en'
            ? 'bg-white dark:bg-white/20 text-primary-700 dark:text-white shadow-xs border border-gray-200 dark:border-white/20'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        title="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
