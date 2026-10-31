"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FILM } from "@/lib/content";
import { clamp01, easeInOut, easeOut, forcedProgress, norm, runwayProgress, smooth, subscribe } from "@/lib/scroll-engine";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const N = FILM.chapters.length;
/** Viewport heights of scroll per chapter. Longer is calmer. */
export const CHAPTER_VH = 115;
export const CHAPTERS_RUNWAY_VH = CHAPTER_VH * N + 100;

type Refs = {
  layer: HTMLDivElement | null;
  img: HTMLDivElement | null;
  copy: HTMLDivElement | null;
  ghost: HTMLDivElement | null;
};

/**
 * The breakdown. The screen pins and four full-bleed chapters play through.
 *
 * Everything is a function of `u`, 0..N, the chapter-time of the runway.
 * Chapter i owns u in [i, i+1). It wipes in from the bottom across the last
 * quarter of the previous chapter, its photo keeps a slow zoom for the whole
 * time it is on screen, and its copy rises in early and leaves late.
 */
export function Chapters() {
  const runway = useRef<HTMLDivElement>(null);
  const refs = useRef<Refs[]>(FILM.chapters.map(() => ({ layer: null, img: null, copy: null, ghost: null })));
  const rail = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const paint = (p: number) => {
      const u = p * N;
      for (let i = 0; i < N; i++) {
        const r = refs.current[i];
        if (!r.layer) continue;
        // Wipe in across the last 28% of the previous beat; chapter 0 is up from the start.
        const wipe = i === 0 ? 1 : easeInOut(norm(u, i - 0.18, i));
        // Covered by the next chapter's wipe: stays put underneath, nothing to do.
        const gone = i < N - 1 && u >= i + 1;
        r.layer.style.clipPath = `inset(${(1 - wipe) * 100}% 0 0 0)`;
        r.layer.style.visibility = wipe <= 0 || gone ? "hidden" : "visible";
        if (wipe <= 0 || gone) continue;

        // Zoom: 1.14 -> 1.0 over the chapter's whole life on screen.
        const life = norm(u, i - 0.18, i + 1);
        const z = 1.14 - 0.14 * easeOut(life);
        // A touch of counter-parallax so the photo lags the wipe.
        const lag = (1 - wipe) * -6;
        if (r.img) r.img.style.transform = `translate3d(0, ${lag}vh, 0) scale(${z})`;

        // Copy: in over the first 18%, out over the last 15%.
        const inn = smooth(norm(u, i + 0.02, i + 0.2));
        const out = smooth(norm(u, i + 0.7, i + 0.82));
        const op = i === N - 1 ? inn : Math.min(inn, 1 - out);
        const ty = (1 - inn) * 40 - out * 30;
        if (r.copy) {
          r.copy.style.opacity = String(op);
          r.copy.style.transform = `translate3d(0, ${ty}px, 0)`;
        }
        if (r.ghost) {
          r.ghost.style.opacity = String(op * 0.16);
          r.ghost.style.transform = `translate3d(0, ${(1 - inn) * 60 - out * 60}px, 0)`;
        }
      }
      // Rail: the fill tracks chapter-time.
      if (railFill.current) railFill.current.style.transform = `scaleY(${clamp01(u / N)})`;
      if (rail.current) {
        const active = Math.min(N - 1, Math.floor(u));
        rail.current.querySelectorAll<HTMLElement>(".hc-rail-n").forEach((el, i) => {
          el.dataset.active = i === active ? "1" : "0";
        });
      }
    };
    return subscribe((_, vh) => {
      const el = runway.current;
      if (!el) return;
      paint(forcedProgress("chapters") ?? runwayProgress(el, vh));
    });
  }, [reduced]);

  return (
    <div ref={runway} id="chapters" className="hc-runway" style={{ height: `${CHAPTERS_RUNWAY_VH}vh` }}>
      <div className="hc-stage">
        {FILM.chapters.map((c, i) => (
          <section
            key={c.id}
            id={c.id}
            className="hc-layer"
            style={{ zIndex: i + 1, "--pos": c.pos, "--pos-m": c.posMobile } as React.CSSProperties}
            ref={(el) => { refs.current[i].layer = el as HTMLDivElement | null; }}
            aria-label={`Chapter ${c.n}, ${c.word}`}
          >
            <div className={"cutout" in c && c.cutout ? "hc-img hc-cutout" : "hc-img"} ref={(el) => { refs.current[i].img = el; }}>
              <Image
                src={c.photo}
                alt={c.alt}
                fill
                sizes="100vw"
                priority={i === 0}
                className="hc-photo"
              />
            </div>
            <div className="hc-veil" aria-hidden="true" />
            <div className="hc-ghost" aria-hidden="true" ref={(el) => { refs.current[i].ghost = el; }}>{c.n}</div>
            <div className="hc-copy" ref={(el) => { refs.current[i].copy = el; }}>
              <p className="hc-kicker">Chapter {c.n}</p>
              <h2 className="hc-word">{c.word}</h2>
              <p className="hc-line">{c.line}</p>
              <p className="hc-stat">{c.stat}</p>
            </div>
          </section>
        ))}

        <div ref={rail} className="hc-rail" aria-hidden="true">
          <span className="hc-rail-track"><span ref={railFill} className="hc-rail-fill" /></span>
          <div className="hc-rail-ns">
            {FILM.chapters.map((c, i) => (
              <span key={c.id} className="hc-rail-n" data-active={i === 0 ? "1" : "0"}>{c.n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
