'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterHeroTitleProps {
  prefix: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
}

export default function TypewriterHeroTitle({
  prefix,
  highlight,
  className = '',
  highlightClassName = 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400',
}: TypewriterHeroTitleProps) {
  const [isClient, setIsClient] = useState(false);
  const [displayedChars, setDisplayedChars] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const containerRef = useRef<HTMLHeadingElement>(null);
  const totalChars = prefix.length + highlight.length;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Observa a visibilidade na viewport para iniciar ou re-iniciar a digitação ao voltar no scroll
  useEffect(() => {
    if (!isClient) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          // Quando sai da viewport, reseta para re-animar a escrita ao voltar no scroll
          setIsInView(false);
          setDisplayedChars(0);
          setIsTypingComplete(false);
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isClient]);

  // Efeito de digitação realista e suave
  useEffect(() => {
    if (!isInView || !isClient) return;

    let currentIndex = 0;
    let timer: NodeJS.Timeout | null = null;

    const typeNextChar = () => {
      if (currentIndex < totalChars) {
        currentIndex++;
        setDisplayedChars(currentIndex);

        const currentChar =
          currentIndex <= prefix.length
            ? prefix[currentIndex - 1]
            : highlight[currentIndex - prefix.length - 1];

        // Cadência de digitação natural com micropausas
        let delay = 45 + Math.random() * 20; // ~45ms a 65ms por caractere
        if (currentChar === ',') {
          delay = 200; // Micropausa na vírgula
        } else if (currentIndex === prefix.length) {
          delay = 240; // Micropausa antes de escrever "Era Digital"
        }

        timer = setTimeout(typeNextChar, delay);
      } else {
        setIsTypingComplete(true);
      }
    };

    // Atraso inicial sutil de 200ms após entrar em vista
    timer = setTimeout(typeNextChar, 200);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isInView, isClient, totalChars, prefix, highlight]);

  // Durante a renderização SSR inicial, exibe o texto completo para SEO e sem disparar erros de hidratação
  if (!isClient) {
    return (
      <h1 className={className}>
        {prefix}
        <span className={highlightClassName}>{highlight}</span>
      </h1>
    );
  }

  const prefixCharsCount = Math.min(displayedChars, prefix.length);
  const highlightCharsCount = Math.max(0, displayedChars - prefix.length);

  const displayedPrefix = prefix.slice(0, prefixCharsCount);
  const displayedHighlight = highlight.slice(0, highlightCharsCount);

  return (
    <h1
      ref={containerRef}
      className={`relative ${className}`}
      aria-label={`${prefix}${highlight}`}
    >
      {/* Texto completo para acessibilidade e leitores de ecrã */}
      <span className="sr-only">{prefix}{highlight}</span>

      {/* Texto animado com efeito de escrita */}
      <span aria-hidden="true" className="inline">
        <span>{displayedPrefix}</span>
        {displayedHighlight && (
          <span className={highlightClassName}>
            {displayedHighlight}
          </span>
        )}

        {/* Cursor de digitação piscante esmeralda com brilho neon */}
        <span
          className={`inline-block w-[3px] sm:w-[4px] lg:w-[5px] h-[0.82em] bg-emerald-400 ml-1.5 align-baseline rounded-sm shadow-[0_0_12px_rgba(52,211,153,0.95)] transition-opacity duration-300 ${
            isTypingComplete ? 'animate-pulse' : 'opacity-100'
          }`}
        />
      </span>
    </h1>
  );
}
