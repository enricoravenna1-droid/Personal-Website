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

  return (
    <section id="hero">
      <div className="hero-space" ref={stage}>
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
              <Image
                src="/photo.jpg"
                alt={SITE.name}
                className="avatar-img"
                width={340}
                height={340}
                priority
                fetchPriority="high"
              />
            </div>
          </div>

          <div className="hero-text-col">
            <h1 className="hero-name">{SITE.name}</h1>
            <p className="hero-communal">{SITE.positioning}</p>
            {/* EDIT: role line */}
            <p className="hero-title">
              Executive Director · Jewish Federation of Arkansas
            </p>

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
