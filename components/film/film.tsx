"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { PLATE_COUNT, RUNWAY_VH, filmAt, type FilmState } from "@/lib/film";
import type { CalloutEls, FilmHandles } from "./scene";
import "./film.css";

const FilmScene = dynamic(() => import("./scene"), { ssr: false, loading: () => null });

/** Prototype copy. The real words will live in lib/content.ts. */
const CHAPTERS = [
  {
    n: "01",
    title: "Soldier",
    body: "Born in Israel. Served in the IDF, discharged as a First Sergeant. Where accountability was learned.",
    stat: "First Sergeant",
  },
  {
    n: "02",
    title: "Builder",
    body: "Israeli American Council across the Southeast. Then Maccabee Task Force, campus by campus across the Midwest.",
    stat: "Two regions",
  },
  {
    n: "03",
    title: "Leader",
    body: "Executive Director, Jewish Federation of Arkansas, 2025 to 2026. Tripled programming. Rebuilt a dormant donor base.",
    stat: "3× programming",
  },
  {
    n: "04",
    title: "Operator",
    body: "Vice President of Operations, Reut USA. New York, from November 2026. The deputy seat at a national organization.",
    stat: "Reut USA",
  },
];

declare global {
  interface Window {
    __film?: { seek: (p: number) => void; release: () => void; state: () => FilmState };
  }
}

export function Film() {
  const runway = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const forced = useRef<number | null>(null);
  const callouts = useRef<CalloutEls[]>(Array.from({ length: PLATE_COUNT }, () => ({ label: null, line: null, dot: null })));
  const state = useRef<FilmState>(filmAt(0));
  const heroEl = useRef<HTMLDivElement>(null);
  const coreEl = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const handles: FilmHandles = { progress, forced, callouts, state };

  useEffect(() => {
    setMounted(true);
    document.documentElement.dataset.film = "1";
    return () => {
      delete document.documentElement.dataset.film;
    };
  }, []);

  // Scroll → progress. The runway is RUNWAY_VH tall; the stage is sticky
  // inside it, so progress is how far the runway's top has travelled past the
  // viewport top, over the runway's height minus one viewport.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = runway.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      progress.current = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      paintDom();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const paintDom = () => {
      const s = filmAt(forced.current ?? progress.current);
      if (heroEl.current) heroEl.current.style.opacity = String(s.hero);
      if (coreEl.current) {
        coreEl.current.style.opacity = String(s.core);
        coreEl.current.style.transform = `translateY(${(1 - s.core) * 24}px)`;
      }
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.__film = {
      seek: (p) => {
        forced.current = Math.min(1, Math.max(0, p));
        paintDom();
      },
      release: () => {
        forced.current = null;
        measure();
      },
      state: () => state.current,
    };
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      delete window.__film;
    };
  }, []);

  return (
    <div ref={runway} className="film-runway" style={{ height: `${RUNWAY_VH}vh` }}>
      <div className="film-stage">
        <div className="film-canvas">{mounted && <FilmScene handles={handles} />}</div>

        <div ref={heroEl} className="film-hero">
          <p className="film-kicker">Enrico Omri Ravenna</p>
          <h1 className="film-title">Jewish Communal Leader</h1>
          <p className="film-sub">Four chapters. One through-line.</p>
          <p className="film-scroll">Scroll</p>
        </div>

        <svg className="film-lines" aria-hidden="true">
          {CHAPTERS.map((_, i) => (
            <g key={i}>
              <line ref={(el) => { callouts.current[i].line = el; }} className="film-line" />
              <circle ref={(el) => { callouts.current[i].dot = el; }} className="film-dot" r="3.5" />
            </g>
          ))}
        </svg>
        {CHAPTERS.map((c, i) => (
          <div key={c.n} ref={(el) => { callouts.current[i].label = el; }} className="film-callout">
            <p className="film-callout-n">{c.n} · {c.title}</p>
            <p className="film-callout-body">{c.body}</p>
            <p className="film-callout-stat">{c.stat}</p>
          </div>
        ))}

        <div ref={coreEl} className="film-core">
          <p className="film-kicker">The through-line</p>
          <h2 className="film-core-title">Together is the only way forward.</h2>
          <ul className="film-values">
            <li>Relationship over transaction.</li>
            <li>Security without losing joy.</li>
            <li>The next generation leads now.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
