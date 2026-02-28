'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight hook that sets data-visible when the element enters the viewport.
 * Use with CSS: [data-visible="true"] { animation: ... }
 */
export function useInView<T extends HTMLElement = HTMLElement>(options?: { rootMargin?: string; threshold?: number }) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const { rootMargin = '0px 0px -8% 0px', threshold = 0 } = options ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin, threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, visible };
}
