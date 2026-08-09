"use client";

import { useEffect, useState } from "react";

/**
 * Reads prefers-reduced-motion and stays subscribed to changes.
 *
 * Returns false during SSR and the first paint, then corrects. Components
 * that gate expensive WebGL work on this should render the static fallback
 * until it resolves, never the animated version.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
