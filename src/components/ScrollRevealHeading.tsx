'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface ScrollRevealHeadingProps {
  text: string;
  badge?: string;
  subtitle?: string;
  className?: string;
  highlightWords?: string[];
}

export default function ScrollRevealHeading({
  text,
  badge = 'Diferenciais Exclusivos',
  subtitle,
  className = '',
  highlightWords = ['WEHOSTHERE?', 'WEHOSTHERE']
}: ScrollRevealHeadingProps) {
  const [isInView, setIsInView] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Monitorar direção do scroll da página
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setScrollDirection('up');
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver que ativa e reseta tanto ao rolar para baixo quanto para cima
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          // Reseta quando sai da viewport para animar novamente ao voltar
          setIsInView(false);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={`text-center select-none ${className}`}>
      {/* Badge decorativo animado */}
      {badge && (
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-primary-700 bg-primary-50/90 border border-primary-200/80 mb-3 shadow-xs transition-all duration-700 ease-out ${
            isInView
              ? 'opacity-100 scale-100 translate-y-0'
              : scrollDirection === 'down'
              ? 'opacity-0 scale-90 translate-y-4'
              : 'opacity-0 scale-90 -translate-y-4'
          }`}
        >
          <Sparkles className="w-3 h-3 text-primary-500 animate-pulse" />
          <span>{badge}</span>
        </div>
      )}

      {/* Título com animação dividida por palavras e direção de rolagem */}
      <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight flex flex-wrap justify-center gap-x-2 gap-y-1">
        {words.map((word, index) => {
          const cleanWord = word.trim();
          const isHighlight = highlightWords.some(
            (hw) => cleanWord.toLowerCase() === hw.toLowerCase() || cleanWord.toLowerCase().includes(hw.toLowerCase())
          );

          // Efeito de entrada: Se rolar para baixo, entra de baixo para cima; se rolar para cima, entra de cima para baixo
          const initialTransform =
            scrollDirection === 'down'
              ? 'translate-y-8 opacity-0 rotate-3 blur-[2px]'
              : '-translate-y-8 opacity-0 -rotate-3 blur-[2px]';

          return (
            <span key={index} className="inline-block overflow-hidden py-0.5">
              <span
                className={`inline-block transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isHighlight
                    ? 'bg-gradient-to-r from-primary-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent font-black drop-shadow-xs'
                    : 'text-gray-900'
                } ${isInView ? 'translate-y-0 opacity-100 rotate-0 blur-none' : initialTransform}`}
                style={{
                  transitionDelay: isInView ? `${index * 65}ms` : '0ms'
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </h2>

      {/* Linha de acento animada expansível */}
      <div className="flex justify-center mt-3.5 mb-2">
        <div
          className={`h-1 bg-gradient-to-r from-primary-600 via-blue-500 to-primary-600 rounded-full transition-all duration-800 ease-out shadow-xs ${
            isInView ? 'w-16 opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </div>

      {/* Subtítulo opcional com fade suave */}
      {subtitle && (
        <p
          className={`text-xs sm:text-sm text-gray-500 max-w-lg mx-auto transition-all duration-700 delay-300 ease-out mt-2 ${
            isInView
              ? 'opacity-100 translate-y-0'
              : scrollDirection === 'down'
              ? 'opacity-0 translate-y-4'
              : 'opacity-0 -translate-y-4'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
