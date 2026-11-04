'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface ScrollRevealHeadingProps {
  text: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  highlightWords?: string[];
  align?: 'center' | 'left';
  showAccentLine?: boolean;
}

export default function ScrollRevealHeading({
  text,
  badge,
  badgeIcon,
  subtitle,
  className = '',
  titleClassName = '',
  highlightWords = ['WEHOSTHERE?', 'WEHOSTHERE', 'prática.', 'prática'],
  align = 'center',
  showAccentLine = true
}: ScrollRevealHeadingProps) {
  const [isInView, setIsInView] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Monitorar direção do scroll da página
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 2) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY.current - 2) {
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
          // Reseta quando sai da viewport para animar novamente de forma suave ao voltar
          setIsInView(false);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');
  const isLeft = align === 'left';

  return (
    <div
      ref={containerRef}
      className={`${isLeft ? 'text-left items-start' : 'text-center items-center'} flex flex-col select-none ${className}`}
    >
      {/* Badge decorativo animado — transição mais lenta e suave */}
      {badge && (
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-primary-700 bg-primary-50/90 border border-primary-200/80 mb-3 shadow-xs ${
            isInView
              ? 'opacity-100 scale-100 translate-y-0'
              : scrollDirection === 'down'
              ? 'opacity-0 scale-90 translate-y-5'
              : 'opacity-0 scale-90 -translate-y-5'
          }`}
          style={{
            transitionProperty: 'all',
            transitionDuration: '1000ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: isInView ? '0ms' : '0ms'
          }}
        >
          {badgeIcon || <Sparkles className="w-3.5 h-3.5 text-primary-500 animate-pulse" />}
          <span>{badge}</span>
        </div>
      )}

      {/* Título com animação dividida por palavras e velocidade reduzida para alta visibilidade */}
      <h2
        className={`font-black text-gray-900 tracking-tight leading-[1.15] flex flex-wrap ${
          isLeft ? 'justify-start' : 'justify-center'
        } gap-x-2 gap-y-1 ${
          titleClassName || 'text-xl sm:text-3xl lg:text-4xl'
        }`}
      >
        {words.map((word, index) => {
          const cleanWord = word.trim();
          const isHighlight = highlightWords.some(
            (hw) => cleanWord.toLowerCase() === hw.toLowerCase() || cleanWord.toLowerCase().includes(hw.toLowerCase())
          );

          // Efeito de entrada nítido e elegante: maior percurso vertical, leve rotação e blur sutil
          const initialTransform =
            scrollDirection === 'down'
              ? 'translate-y-12 opacity-0 rotate-3 blur-[3px]'
              : '-translate-y-12 opacity-0 -rotate-3 blur-[3px]';

          return (
            <span key={index} className="inline-block overflow-hidden py-1">
              <span
                className={`inline-block ${
                  isHighlight
                    ? 'bg-gradient-to-r from-primary-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent font-black drop-shadow-xs'
                    : 'text-gray-900'
                } ${isInView ? 'translate-y-0 opacity-100 rotate-0 blur-none' : initialTransform}`}
                style={{
                  transitionProperty: 'all',
                  transitionDuration: '1200ms', // Velocidade reduzida (1.2 segundos para ser bem perceptível ao fazer scroll)
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: isInView ? `${index * 130}ms` : '0ms' // Intervalo entre palavras aumentado para criar cadência nítida
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </h2>

      {/* Linha de acento animada com expansão lenta */}
      {showAccentLine && (
        <div className={`flex ${isLeft ? 'justify-start' : 'justify-center'} mt-3 mb-2 w-full`}>
          <div
            className={`h-1 bg-gradient-to-r from-primary-600 via-blue-500 to-primary-600 rounded-full shadow-xs ${
              isInView ? 'w-16 opacity-100' : 'w-0 opacity-0'
            }`}
            style={{
              transitionProperty: 'all',
              transitionDuration: '1200ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: isInView ? '350ms' : '0ms'
            }}
          />
        </div>
      )}

      {/* Subtítulo opcional com fade suave e velocidade reduzida */}
      {subtitle && (
        <p
          className={`text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3 ${
            isLeft ? 'max-w-xl' : 'max-w-lg mx-auto'
          } ${
            isInView
              ? 'opacity-100 translate-y-0'
              : scrollDirection === 'down'
              ? 'opacity-0 translate-y-5'
              : 'opacity-0 -translate-y-5'
          }`}
          style={{
            transitionProperty: 'all',
            transitionDuration: '1100ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: isInView ? '450ms' : '0ms'
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
