"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Lenis smooth scroll.
 *
 * Two things most implementations get wrong and this one does not:
 *  1. It disables itself entirely under prefers-reduced-motion. Hijacked
 *     scroll is a genuine accessibility problem, not a taste question.
 *  2. The duration is 1.05s, not the 1.6s people copy from demos. Long
 *     smoothing feels laggy rather than premium.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Never smooth touch. Mobile browsers already do this well and
      // overriding it is the single most common way to make a site feel broken.
      syncTouch: false,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
