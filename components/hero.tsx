"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { SITE } from "@/lib/content";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/**
 * The hero, now built in real depth.
 *
 * The old hero was a flat stack: aurora, then a starfield, then the portrait,
 * then type, all on the same plane with a bit of parallax on scroll. This
 * gives each layer an actual Z position inside a shared `perspective`, and
 * tilts the whole scene toward the pointer. Because the layers sit at
 * different depths, they separate at different rates — which is the entire
 * difference between something that reads as three-dimensional and something
 * that reads as a moving picture of three-dimensional.
 *
 * No WebGL here on purpose. This is CSS 3D transforms, which cost nothing,
 * ship nothing, and paint on the first frame. The GPU budget for this page is
 * spent on the globe below, where it buys something a gradient cannot.
 */
export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = stage.current;
    if (!node || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    // Targets are written by the pointer, current values chase them. Applying
    // pointer position straight to the transform makes the scene snap to every
    // twitch of the hand; the chase is what makes it feel like mass.
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      node.style.setProperty("--rx", `${(-cy * 5).toFixed(3)}deg`);
      node.style.setProperty("--ry", `${(cx * 7).toFixed(3)}deg`);
      node.style.setProperty("--px", `${(cx * 14).toFixed(2)}px`);
      node.style.setProperty("--py", `${(cy * 10).toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  /**
   * Autoplay is a request, and phones refuse it more often than desktops.
   *
   * `autoplay muted playsinline` is the correct incantation and it is what
   * these elements carry, but iOS Low Power Mode refuses it outright, and so
   * does Safari with Auto-Play set to Never. A refused <video autoplay> does
   * not retry: it sits on its poster for the rest of the session, which is
   * exactly the "the headshot isn't moving on my phone" report.
   *
   * So ask directly rather than only declaring it, and if the answer is no,
   * ask again on the two occasions the answer can change: when the tab
   * becomes visible, and on the first real gesture. A user gesture is the one
   * thing every autoplay policy accepts, including Low Power Mode, so the
   * portrait starts the moment the visitor touches or scrolls the page.
   *
   * Listeners are dropped as soon as everything is playing, so the common
   * case (autoplay allowed) costs one pass and nothing after it.
   */
  useEffect(() => {
    const node = stage.current;
    if (!node || reduced) return;

    const videos = Array.from(node.querySelectorAll("video"));
    if (!videos.length) return;

    function attempt() {
      for (const video of videos) {
        if (!video.paused) continue;
        // A rejection here is the policy saying no, not an error worth
        // reporting. The retry is the handling.
        void video.play().catch(() => {});
      }
    }

    // Only the transition *to* visible can change the answer.
    function onVisibility() {
      if (document.visibilityState === "visible") attempt();
    }

    // These stay for the life of the component rather than being torn down
    // once playback starts. Stopping on first success was the tempting
    // optimisation and it is wrong: playback stops again every time the
    // phone locks, the visitor switches apps, or Low Power Mode engages
    // mid-session, and those are precisely the moments recovery is needed.
    // The cost of keeping them is a paused-check per gesture.
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", attempt, { passive: true });
    window.addEventListener("touchstart", attempt, { passive: true });
    window.addEventListener("scroll", attempt, { passive: true });

    attempt();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", attempt);
      window.removeEventListener("touchstart", attempt);
      window.removeEventListener("scroll", attempt);
    };
  }, [reduced]);

  return (
    <section id="hero">
      <div className="hero-space" ref={stage}>
        {/* Depth layer 0: the plate. A 13s sunrise over the same desert, graded
            near-black. It sits deepest in Z and is scrimmed by its own ::after,
            because the hero type has to stay readable over it at every frame —
            the plate is atmosphere, not content.

            Looped by crossfade, not by ping-pong. Ping-pong is free and seamless
            but it plays the clip backwards, which on a sunrise means the sun
            un-rises. Here the tail dissolves into the head over 2s so the light
            only ever moves forward. Measured endpoint difference is 0.84/255,
            against 5.99 for two genuinely different frames.

            Reduced motion gets the poster frame and no <video> at all, so the
            file is never even fetched. */}
        <div className="hero-plate hero-layer hero-layer-deep" aria-hidden="true">
          {reduced ? (
            <img src="/hero-plate-sunrise-poster.jpg" alt="" />
          ) : (
            <video
              src="/hero-plate-sunrise.mp4"
              poster="/hero-plate-sunrise-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          )}
        </div>

        {/* Depth layer 1: aurora, furthest back, moves least */}
        <div className="aurora hero-layer hero-layer-far" aria-hidden="true">
          <span className="a1" />
          <span className="a2" />
          <span className="a3" />
        </div>

        {/* Depth layer 2: drifting motes, mid-ground */}
        <div className="hero-motes hero-layer hero-layer-mid" aria-hidden="true">
          {Array.from({ length: 26 }).map((_, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>

        <div className="hero-inner hero-layer hero-layer-near">
          <div className="hero-photo-col">
            <div className="avatar-wrap">
              <div className="avatar-outer-glow" aria-hidden="true" />
              <div className="avatar-ring-glow" aria-hidden="true" />
              <div className="avatar-float-shadow" aria-hidden="true" />
              {/* The portrait is the real studio photograph, animated. The model
                  holds the likeness for about a second and a half before the face
                  starts drifting off-model, so the clip is cut at 1.5s and
                  ping-ponged: it never reaches a frame that is not him. Reduced
                  motion falls back to the original still. */}
              {reduced ? (
                <Image
                  src="/photo.jpg"
                  alt={SITE.name}
                  className="avatar-img"
                  width={340}
                  height={340}
                  priority
                  fetchPriority="high"
                />
              ) : (
                <video
                  className="avatar-img"
                  src="/hero-portrait.mp4"
                  poster="/hero-portrait-poster.jpg"
                  width={340}
                  height={340}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={SITE.name}
                />
              )}
            </div>
          </div>

          <div className="hero-text-col">
            <h1 className="hero-name">{SITE.name}</h1>
            <p className="hero-communal">{SITE.positioning}</p>
            {/* The JFAR role line used to sit here. Removed 2026-08-18: the
                same tenure is already named twice below the fold — in the
                BACKGROUND list a few lines down, and again as chapter three of
                /story — so on the one screen that has to land in two seconds it
                was clutter arguing for the past. The hero now states who he is;
                the pages state what he did. */}

            <div className="hero-quote">
              <blockquote>
                {/* The space has to be a text node BETWEEN the spans, not
                    inside them: a trailing space inside an inline-block is
                    collapsed away, which runs every word together. */}
                {SITE.quote.text.split("\n").map((line, i) => (
                  <span key={i}>
                    {i > 0 ? <br /> : null}
                    {line.split(" ").map((word, j) => (
                      <span key={j}>
                        {j > 0 ? " " : null}
                        <span
                          className="word"
                          style={{ "--i": i * 6 + j } as React.CSSProperties}
                        >
                          {word}
                        </span>
                      </span>
                    ))}
                  </span>
                ))}
              </blockquote>
              <p className="quote-byline">— {SITE.quote.byline}</p>
            </div>

            <div className="hero-authority">
              <span className="hero-authority-label">Background</span>
              {/* Separators sit inside the item they follow, so a wrap never
                  starts a line with an orphaned middot. */}
              <div className="hero-authority-items">
                {SITE.background.map((item, i) => (
                  <span className="hero-authority-item" key={item}>
                    {item}
                    {i < SITE.background.length - 1 ? (
                      <span className="hero-authority-sep" aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-ctas">
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-primary"
              >
                <LinkedInIcon />
                Connect on LinkedIn
              </a>
              <Link href="/story" className="btn-hero-ghost">
                Read My Story
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
        <span>Scroll</span>
      </div>
    </section>
  );
}
