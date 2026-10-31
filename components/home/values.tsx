"use client";

import { useEffect, useRef } from "react";
import { FILM } from "@/lib/content";
import { easeOut, forcedProgress, norm, runwayProgress, subscribe } from "@/lib/scroll-engine";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const N = FILM.values.items.length;

/**
 * Three values, one screen each, on cream. The dark film breathes out here.
 * Cards stack: the next one slides over the last, which settles back and
 * dims, the way a deck of cards is dealt.
 */
export function Values() {
  const runway = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    return subscribe((_, vh) => {
      const el = runway.current;
      if (!el) return;
      const p = forcedProgress("values") ?? runwayProgress(el, vh);
      const u = p * (N - 1); // 0..N-1
      for (let i = 0; i < N; i++) {
        const c = cards.current[i];
        if (!c) continue;
        // How far the next card has covered this one.
        const covered = i < N - 1 ? easeOut(norm(u, i, i + 1)) : 0;
        const inner = c.firstElementChild as HTMLElement | null;
        if (inner) {
          inner.style.transform = `scale(${1 - covered * 0.07}) translate3d(0, ${-covered * 24}px, 0)`;
          inner.style.opacity = String(1 - covered * 0.6);
        }
      }
    });
  }, [reduced]);

  return (
    <div ref={runway} id="values" className="hv-runway" style={{ height: `${N * 100}vh` }}>
      {FILM.values.items.map((v, i) => (
        <section key={v.word} className="hv-card" ref={(el) => { cards.current[i] = el; }} aria-label={v.word}>
          <div className="hv-inner">
            <p className="hv-kicker">{FILM.values.kicker} · {String(i + 1).padStart(2, "0")}</p>
            <h2 className="hv-word">{v.word}</h2>
            <p className="hv-line">{v.line}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
