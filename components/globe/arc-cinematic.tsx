"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { APPROACH_VH, BEATS, RUNWAY_VH, norm } from "@/lib/arc";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The career-arc cinematic.
 *
 * A tall runway holds a pinned viewport-height stage. As you scroll the
 * runway, the camera flies the arc and the copy beats cross-fade over it.
 *
 * The first viewport of the runway is the *approach*, and it is spent
 * underneath the hero: the runway is pulled up by `APPROACH_VH` in the
 * stylesheet, so the stage is pinned and painting the globe while the hero is
 * still on screen and dissolving. Two progress values come out of one scroll
 * measurement — `entry` drives the approach and the hero's dissolve, `progress`
 * drives the five beats and starts at zero the moment the hero is gone.
 *
 * Three plus four earth textures is roughly 3MB and none of it belongs in
 * the critical path, so the scene is a dynamic import with `ssr: false` and
 * is mounted on the first idle moment after load rather than on layout
 * position — see the mount effect for why position stopped working. Everything
 * above it — the hero, the nav, the copy — is readable long before any of that
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
  /** Approach progress, 0..1 across the overlap with the hero. Same reasoning
   *  as above: it changes every frame, so it never touches state. */
  const entry = useRef(0);

  const [mounted, setMounted] = useState(false);
  const [compact, setCompact] = useState(false);
  /** Beat index for the copy layer. This one *is* state — it changes five
   *  times over the whole sequence, not sixty times a second. */
  const [beat, setBeat] = useState(-1);
  /** True once the approach is nearly over. Gates the skip control, which
   *  must not be focusable while the hero still covers the stage. Flips
   *  once per visit, so state is the right home for it. */
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COMPACT_MAX_WIDTH}px)`);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /**
   * When the scene mounts, and why it is no longer an IntersectionObserver.
   *
   * It used to be one: observe the runway, mount at 400px of warning. That
   * worked because the runway began below the fold. It does not work now —
   * the runway starts at the top of the hero, so it is intersecting on the
   * first frame, and observing it would put three megabytes of earth texture
   * and the whole of three.js straight into the critical path of the landing
   * page.
   *
   * So the trigger moves from *position* to *time and intent*. The hero paints
   * first, unblocked; then the scene mounts on the first idle moment after
   * load, which is while the visitor is still reading the hero and several
   * seconds before the approach can possibly begin. A scroll of more than a
   * tenth of a viewport short-circuits that wait, because someone who starts
   * scrolling immediately needs the globe sooner than idle might deliver it.
   */
  useEffect(() => {
    let done = false;
    const mount = () => {
      if (done) return;
      done = true;
      setMounted(true);
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.1) mount();
    };

    // requestIdleCallback is still not in Safari's shipping surface on every
    // version this site sees, hence the timeout fallback rather than a bare
    // call. Either way the wait is bounded.
    const idle = () => {
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) ric(mount, { timeout: 2500 });
      else setTimeout(mount, 1200);
    };

    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      done = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", idle);
    };
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
        // The approach is the overlap with the hero, and its length is read
        // back off the stylesheet rather than recomputed here. The negative
        // margin is what actually creates the overlap; deriving `lead` from
        // `innerHeight * APPROACH_VH` instead would agree with it on desktop
        // and disagree on a phone, where `100vh` is the large viewport and
        // `innerHeight` is whatever the toolbars have left. One number, one
        // place, no drift.
        const lead = Math.abs(parseFloat(getComputedStyle(node).marginTop)) || 0;
        const travelled = -rect.top;

        const e = norm(travelled, 0, lead);
        entry.current = e;
        // The hero reads this rather than measuring the scroll a second time.
        // One measurement, one source of truth, and the dissolve can never
        // disagree with the camera about how far through the handoff it is.
        document.documentElement.style.setProperty("--hero-exit", e.toFixed(4));

        setArmed((prev) => {
          const next = e > 0.75;
          return prev === next ? prev : next;
        });

        const p = travel > lead ? norm(travelled - lead, 0, travel - lead) : 0;
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
      document.documentElement.style.removeProperty("--hero-exit");
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
      className={`arc-runway${armed ? " arc-armed" : ""}`}
      // Both numbers come from lib/arc so the choreography and the layout are
      // the same source. `marginTop` is the overlap with the hero; the scroll
      // handler reads it back rather than recomputing it.
      style={{ height: `${RUNWAY_VH}vh`, marginTop: `${-APPROACH_VH}vh` }}
      aria-label="Career arc"
    >
      <div className="arc-stage">
        {/* The dawn band. The hero's ember horizon and the globe's atmosphere
            limb are the same colour doing the same job, one flat and one
            curved, and this is the join between them: a wide warm bar sitting
            at the screen height the hero's horizon occupies, which cools toward
            the atmosphere's own blue and contracts as the globe arrives to
            take the job over. It lives on this side of the handoff rather than
            in the hero because the hero is fading to nothing, and a child
            cannot be more opaque than the parent dissolving it. */}
        <div className="arc-dawn" aria-hidden="true" />

        <div className="arc-canvas" aria-hidden="true">
          {mounted ? (
            <GlobeScene
              progress={progress}
              entry={entry}
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
