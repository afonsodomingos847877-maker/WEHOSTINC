import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  loop?: boolean;
}

/**
 * Cycles through phrases with a smooth typewriter effect while `active` is true.
 */
export function useTypewriterText(
  phrases: string[],
  active: boolean,
  options: UseTypewriterOptions = {}
): string {
  const {
    typingSpeed = 55,
    deletingSpeed = 30,
    pauseMs = 2200,
    loop = true,
  } = options;

  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!active || phrases.length === 0) {
      setText('');
      setIsDeleting(false);
      setPhraseIndex(0);
      return;
    }

    const currentPhrase = phrases[phraseIndex % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === currentPhrase) {
      if (!loop && phraseIndex >= phrases.length - 1) return;
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      const nextLength = isDeleting ? text.length - 1 : text.length + 1;
      timeout = setTimeout(
        () => setText(currentPhrase.slice(0, nextLength)),
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    return () => clearTimeout(timeout);
  }, [active, text, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseMs, loop]);

  return text;
}
