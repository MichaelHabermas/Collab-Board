import { useState, useEffect, type RefObject } from 'react';

/**
 * Returns the width and height of an element, updated on resize.
 * Used by Board so the Stage fits the available space (viewport minus header/toolbar).
 */
export function useContainerSize(ref: RefObject<HTMLElement | null>): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const updateSize = (): void => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    // Defer initial read so layout (e.g. flex stretch) is complete
    const raf = requestAnimationFrame(updateSize);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
