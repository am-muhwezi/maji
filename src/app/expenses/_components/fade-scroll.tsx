"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades the right (and, once scrolled, left) edge of a horizontally scrolling child,
 * so a cut-off row of chips reads as "there is more", not as broken layout.
 * The scroller is the wrapper's first child (e.g. Segmented, which scrolls itself).
 */
export function FadeScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const mask =
    edges.left || edges.right
      ? `linear-gradient(to right, ${edges.left ? "transparent, black 2.5rem" : "black"}, ${edges.right ? "black calc(100% - 3rem), transparent" : "black"})`
      : undefined;

  return (
    <div ref={ref} data-fade={edges.right ? "right" : edges.left ? "left" : "none"} className="min-w-0" style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}>
      {children}
    </div>
  );
}
