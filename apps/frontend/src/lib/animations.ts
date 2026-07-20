'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';

export function useTypingAnimation(
  text: string,
  options: {
    speed?: number;
    onStart?: () => void;
    onComplete?: () => void;
    enabled?: boolean;
  } = {}
) {
  const { speed = 30, onStart, onComplete, enabled = true } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);
    onStart?.();

    const typeChar = () => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current];
        setDisplayedText((prev) => prev + char);
        indexRef.current++;

        const delay = char === '\n' ? speed * 3 : speed;
        timeoutRef.current = setTimeout(typeChar, delay);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    timeoutRef.current = setTimeout(typeChar, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, enabled, speed]);

  return { displayedText, isTyping };
}

export function useTextPopAnimation() {
  const elementRef = useRef<HTMLDivElement>(null);

  const animate = useCallback(() => {
    if (!elementRef.current) return;

    const chars = elementRef.current.querySelectorAll('.pop-char');

    gsap.fromTo(
      chars,
      {
        opacity: 0,
        scale: 0,
        y: 20,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.02,
        ease: 'back.out(1.7)',
      }
    );
  }, []);

  return { elementRef, animate };
}

export function useSmoothScroll(containerRef: React.RefObject<HTMLElement | null>) {
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;

    const scrollElement = containerRef.current.querySelector('[data-radix-scroll-area-viewport]') || containerRef.current;

    gsap.to(scrollElement, {
      scrollTop: scrollElement.scrollHeight,
      duration: 0.6,
      ease: 'power3.out',
    });
  }, [containerRef]);

  const scrollToElement = useCallback(
    (element: HTMLElement) => {
      if (!containerRef.current) return;

      const scrollElement = containerRef.current.querySelector('[data-radix-scroll-area-viewport]') || containerRef.current;

      gsap.to(scrollElement, {
        scrollTop: element.offsetTop - scrollElement.clientHeight / 2 + element.clientHeight / 2,
        duration: 0.5,
        ease: 'power2.out',
      });
    },
    [containerRef]
  );

  return { scrollToBottom, scrollToElement };
}

export function useEntranceAnimation<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power3.out',
      }
    );
  }, deps);

  return ref;
}

export function useFloatAnimation<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    tl.to(ref.current, {
      y: -8,
      duration: 2,
      ease: 'power1.inOut',
    }).to(ref.current, {
      y: 0,
      duration: 2,
      ease: 'power1.inOut',
    });

    return () => {
      tl.kill();
    };
  }, []);

  return ref;
}

export function usePulseGlowAnimation<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const tl = gsap.timeline({ repeat: -1 });

    tl.to(ref.current, {
      boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
      duration: 1.5,
      ease: 'power2.inOut',
    }).to(ref.current, {
      boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)',
      duration: 1.5,
      ease: 'power2.inOut',
    });

    return () => {
      tl.kill();
    };
  }, []);

  return ref;
}

export function splitTextToChars(text: string): string[] {
  return text.split('');
}

export function TypewriterText({
  text,
  speed = 30,
  className = '',
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}): React.ReactElement {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setDisplayedText('');
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && text.length > 0) {
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete]);

  return React.createElement(
    'span',
    { className },
    displayedText,
    currentIndex < text.length &&
      React.createElement('span', {
        className: 'inline-block w-0.5 h-4 bg-primary/70 animate-pulse ml-0.5',
      })
  );
}

export function PopInText({ text, className = '' }: { text: string; className?: string }): React.ReactElement {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.8, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
    );
  }, [text]);

  return React.createElement('span', { ref: containerRef, className }, text);
}
