"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FILM } from "@/lib/content";
import { clamp01, easeInOut, easeOut, norm, pinnedTracker, smooth, speedZoom, subscribe, velocity } from "@/lib/scroll-engine";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const N = FILM.chapters.length;
/** Viewport heights of scroll per chapter. One screen each, no dead air. */
export const CHAPTER_VH = 100;
export const CHAPTERS_RUNWAY_VH = CHAPTER_VH * N + 100;

type Refs = {
  layer: HTMLDivElement | null;
  img: HTMLDivElement | null;
  shade: HTMLDivElement | null;
  copy: HTMLDivElement | null;
  kicker: HTMLParagraphElement | null;
  ghost: HTMLDivElement | null;
};

/**
 * The breakdown. The screen pins and four full-bleed chapters play through.
 *
 * Everything is a function of `u`, 0..N, the chapter-time of the runway.
 * Chapter i owns u in [i, i+1). Transforms and opacity only: nothing here
 * repaints. Each chapter arrives as a panel sliding up from the bottom
 * with its photograph counter-moving inside it, so the picture holds
 * nearly still while its edge travels: the look of a wipe without a
 * clip-path. The chapter underneath drifts up and darkens as it leaves.
 *
 * Three speeds: the photograph moves slower than its panel, the copy with
 * it, and the kicker faster than the copy. The photograph also zooms out a
 * hair while you scroll fast and settles when you stop.
 */
export function Chapters() {
  const runway = useRef<HTMLDivElement>(null);
  const refs = useRef<Refs[]>(FILM.chapters.map(() => ({ layer: null, img: null, shade: null, copy: null, kicker: null, ghost: null })));
  const rail = useRef<HTMLDivElement>(null);
  const railFill = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const track = pinnedTracker("chapters");
    let zoom = 0;
    const paint = (p: number) => {
      const u = p * N;
      for (let i = 0; i < N; i++) {
        const r = refs.current[i];
        if (!r.layer) continue;
        // Arrive across the last 22% of the previous beat; chapter 0 is up from the start.
        const wipe = i === 0 ? 1 : easeInOut(norm(u, i - 0.22, i));
        // Leaving: the next chapter's arrival, mirrored.
        const leave = i < N - 1 ? easeInOut(norm(u, i + 0.78, i + 1)) : 0;
        const gone = i < N - 1 && u >= i + 1.02;
        const hidden = wipe <= 0 || gone;
        r.layer.style.visibility = hidden ? "hidden" : "visible";
        if (hidden) continue;

        const off = (1 - wipe) * 100; // % of the stage height
        r.layer.style.transform = `translate3d(0, ${off.toFixed(3)}%, 0)`;

        // Zoom 1.12 -> 1.0 over the chapter's whole life, less a touch at speed.
        const life = norm(u, i - 0.22, i + 1);
        const z = (1.12 - 0.12 * easeOut(life)) * (1 - zoom);
        // Counter-move 84% of the panel's travel, then drift up as it leaves.
        const ty = -off * 0.84 - leave * 9;
        if (r.img) r.img.style.transform = `translate3d(0, ${ty.toFixed(3)}%, 0) scale(${z.toFixed(4)})`;
        if (r.shade) r.shade.style.opacity = String(leave * 0.55);

        // Copy: rises while the panel is still arriving, leaves as the next one comes.
        const inn = smooth(norm(u, i - 0.16, i + 0.06));
        const out = smooth(norm(u, i + 0.66, i + 0.84));
        const op = i === N - 1 ? inn : Math.min(inn, 1 - out);
        const cy = (1 - inn) * 36 - out * 28;
        if (r.copy) {
          r.copy.style.opacity = String(op);
          r.copy.style.transform = `translate3d(0, ${cy.toFixed(2)}px, 0)`;
        }
        // The kicker travels farther than the copy it heads.
        if (r.kicker) r.kicker.style.transform = `translate3d(0, ${((1 - inn) * 30 - out * 34).toFixed(2)}px, 0)`;
        if (r.ghost) {
          r.ghost.style.opacity = String(op * 0.16);
          r.ghost.style.transform = `translate3d(0, ${((1 - inn) * 60 - out * 60).toFixed(2)}px, 0)`;
        }
      }
      // Rail: the fill tracks chapter-time.
      if (railFill.current) railFill.current.style.transform = `scaleY(${clamp01(u / N)})`;
      if (rail.current) {
        const active = Math.min(N - 1, Math.floor(u + 0.1));
        rail.current.querySelectorAll<HTMLElement>(".hc-rail-n").forEach((el, i) => {
          el.dataset.active = i === active ? "1" : "0";
        });
      }
    };
    return subscribe((_, vh, dt) => {
      const el = runway.current;
      if (!el) return;
      const [p, moving] = track(el, vh, dt);
      // Only while the stage is pinned does speed mean anything here.
      const pinned = p > 0 && p < 1;
      zoom += ((pinned ? speedZoom(velocity()) : 0) - zoom) * (1 - Math.exp(-dt / 0.18));
      if (zoom < 1e-4) zoom = 0;
      paint(p);
      return moving || zoom > 0;
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
            <div className="hc-shade" aria-hidden="true" ref={(el) => { refs.current[i].shade = el; }} />
            <div className="hc-ghost" aria-hidden="true" ref={(el) => { refs.current[i].ghost = el; }}>{c.n}</div>
            <div className="hc-copy" ref={(el) => { refs.current[i].copy = el; }}>
              <p className="hc-kicker" ref={(el) => { refs.current[i].kicker = el; }}>Chapter {c.n}</p>
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
