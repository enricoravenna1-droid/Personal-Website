"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { BEATS, RUNWAY_VH, norm } from "@/lib/arc";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The career-arc cinematic.
 *
 * A tall runway holds a pinned viewport-height stage. As you scroll the
 * runway, the camera flies the arc and the copy beats cross-fade over it.
 *
 * Three plus four earth textures is roughly 3MB and none of it belongs in
 * the critical path, so the scene is a dynamic import with `ssr: false` and
 * is only mounted once the runway is near the viewport. Everything above it
 * — the hero, the nav, the copy — is readable long before any of that
 * arrives, and the page is fully functional if it never does.
 */
const GlobeScene = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => null,
});

const COMPACT_MAX_WIDTH = 768;

export function ArcCinematic() {
  const reducedMotion = useReducedMotion();
  const runway = useRef<HTMLDivElement>(null);

  /**
   * Progress lives in a ref, not in state.
   *
   * It changes every frame. Putting it in state would re-render the React
   * tree sixty times a second to move a camera, which is the single most
   * common way a WebGL scene in React ends up janky. The scene reads the ref
   * inside its own `useFrame`; React never re-renders for scroll at all.
   */
  const progress = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);
  /** Beat index for the copy layer. This one *is* state — it changes five
   *  times over the whole sequence, not sixty times a second. */
  const [beat, setBeat] = useState(-1);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COMPACT_MAX_WIDTH}px)`);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Mount the scene when the runway is close, not when it is visible: at
  // 400px of warning the textures are usually decoded by the time the first
  // beat needs them.
  useEffect(() => {
    const node = runway.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const node = runway.current;
    if (!node) return;

    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const p = travel > 0 ? norm(-rect.top, 0, travel) : 0;
        progress.current = p;

        let active = -1;
        for (let i = 0; i < BEATS.length; i++) {
          const [start, end] = BEATS[i].at;
          if (p >= start && p <= end) {
            active = i;
            break;
          }
        }
        setBeat((prev) => (prev === active ? prev : active));
        ticking = false;
      });
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  /**
   * Reduced motion gets the argument without the ride: the five beats as a
   * plain list, no pinning, no runway, no WebGL. This is not a degraded
   * version of the sequence, it is the same claim delivered in a way that
   * does not move.
   */
  if (reducedMotion) {
    return (
      <section className="arc-static" aria-label="Career arc">
        <div className="container">
          <p className="label">The Arc</p>
          <h2 className="arc-static-h">Where the work has been.</h2>
          <ol className="arc-static-list">
            {BEATS.map((b) => (
              <li key={b.kicker}>
                <p className="arc-static-kicker">{b.kicker}</p>
                <p className="arc-static-line">{b.line}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={runway}
      className="arc-runway"
      style={{ height: `${RUNWAY_VH}vh` }}
      aria-label="Career arc"
    >
      <div className="arc-stage">
        <div className="arc-canvas" aria-hidden="true">
          {mounted ? (
            <GlobeScene
              progress={progress}
              reducedMotion={reducedMotion}
              compact={compact}
            />
          ) : null}
        </div>

        {/* Copy layer. The list is always in the DOM so the whole sequence is
            readable to a screen reader and to search engines as a single
            block, rather than five lines that only exist at the right scroll
            offset. Only visual opacity changes. */}
        <ol className="arc-beats">
          {BEATS.map((b, i) => (
            <li
              key={b.kicker}
              className={`arc-beat${i === beat ? " arc-beat-in" : ""}`}
            >
              <p className="arc-beat-kicker">{b.kicker}</p>
              <p className="arc-beat-line">{b.line}</p>
            </li>
          ))}
        </ol>

        {/* The honest answer to "this is a long way on a phone" is not a
            shorter runway, it is a way out of it. */}
        <a className="arc-skip" href="#after-arc">
          Skip the sequence
        </a>
      </div>
    </section>
  );
}
