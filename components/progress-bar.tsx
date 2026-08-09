"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Reading progress.
 *
 * Where the browser supports `animation-timeline: scroll()` the CSS owns
 * this outright and nothing here runs. JS takes over in exactly two cases:
 * no support, or reduced motion — under which the blanket
 * `animation-duration: 0.001ms` rule would otherwise park the bar on its
 * end state and show it permanently full.
 */
export function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cssDrives =
      typeof CSS !== "undefined" &&
      CSS.supports?.("animation-timeline", "scroll()") &&
      !reduced;
    if (cssDrives) return;

    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        el.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [reduced]);

  return <div id="progress-bar" ref={ref} aria-hidden="true" />;
}
