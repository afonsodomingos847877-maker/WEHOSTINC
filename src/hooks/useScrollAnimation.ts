'use client';

import { useEffect, useRef } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  resetOnLeave?: boolean;
}

/**
 * Hook que retorna uma callback ref compatível com JSX.
 * Adiciona `is-visible` ao entrar na viewport e remove ao sair (resetOnLeave=true).
 */
export function useScrollAnimation<T extends HTMLElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.15, resetOnLeave = true } = options;
  const elRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else if (resetOnLeave) {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, resetOnLeave]);

  // Callback ref - compatível com React sem problema de null
  const setRef = (node: T | null) => {
    elRef.current = node;
  };

  return setRef;
}


/**
 * Hook para múltiplos elementos com animações escalonadas.
 * Retorna uma função `setRef` que deve ser usada como `ref={setRef(index)}`.
 */
export function useScrollAnimationGroup(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, resetOnLeave = true } = options;
  const refs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else if (resetOnLeave) {
            entry.target.classList.remove('is-visible');
          }
        });
      },
      { threshold }
    );

    refs.current.forEach((el) => {
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [threshold, resetOnLeave]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
    if (el && observerRef.current) {
      observerRef.current.observe(el);
    }
  };

  return { setRef };
}
