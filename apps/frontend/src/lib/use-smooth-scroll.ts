'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export function useSmoothScroll(containerRef: React.RefObject<HTMLElement | null>) {
  const scrollToBottom = useCallback(
    (immediate = false) => {
      if (!containerRef.current) return;

      const viewport = containerRef.current.querySelector('[data-radix-scroll-area-viewport]') || containerRef.current;
      const executeScroll = () => {
        if (!viewport) return;
        if (immediate) {
          viewport.scrollTop = viewport.scrollHeight;
          return;
        } else {
          gsap.to(viewport, {
            scrollTop: viewport.scrollHeight,
            duration: 0.5,
            ease: 'power3.out',
          });
        }
      }
      setTimeout(executeScroll, 100);
    },
    [containerRef]
  );

  const scrollToTop = useCallback(
    (immediate = false) => {
      if (!containerRef.current) return;

      const viewport = containerRef.current.querySelector('[data-radix-scroll-area-viewport]') || containerRef.current;

      if (immediate) {
        viewport.scrollTop = 0;
        return;
      }

      gsap.to(viewport, {
        scrollTop: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    },
    [containerRef]
  );

  const scrollTo = useCallback(
    (target: number, immediate = false) => {
      if (!containerRef.current) return;

      const viewport = containerRef.current.querySelector('[data-radix-scroll-area-viewport]') || containerRef.current;

      if (immediate) {
        viewport.scrollTop = target;
        return;
      }

      gsap.to(viewport, {
        scrollTop: target,
        duration: 0.5,
        ease: 'power3.out',
      });
    },
    [containerRef]
  );

  return { scrollTo, scrollToBottom, scrollToTop };
}

export function useSmoothScrollToElement(containerRef: React.RefObject<HTMLElement | null>) {
  const scrollToElement = useCallback(
    (element: HTMLElement, offset = 0) => {
      if (!containerRef.current) return;

      const viewport = containerRef.current.querySelector('[data-radix-scroll-area-viewport]') || containerRef.current;

      const elementTop = element.offsetTop;
      const viewportHeight = viewport.clientHeight;
      const targetScroll = elementTop - viewportHeight / 2 + element.clientHeight / 2 + offset;

      gsap.to(viewport, {
        scrollTop: targetScroll,
        duration: 0.6,
        ease: 'power3.out',
      });
    },
    [containerRef]
  );

  return scrollToElement;
}
