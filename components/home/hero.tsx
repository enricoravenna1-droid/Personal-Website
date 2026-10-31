"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FILM } from "@/lib/content";
import { clamp01, forcedProgress, subscribe } from "@/lib/scroll-engine";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The hero. You, large, on the right; the claim on the left.
 *
 * Two motions. On load the type rises line by line and the portrait fades
 * up (CSS keyframes, so they run before any JS). On scroll the portrait
 * and the arch fall behind the page while the copy leaves faster: three
 * layers at three speeds is what reads as depth.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const arch = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const index = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    return subscribe((y, vh) => {
      const p = forcedProgress("hero") ?? clamp01(y / vh);
      const px = p * vh;
      if (photo.current) photo.current.style.transform = `translate3d(0, ${px * 0.22}px, 0)`;
      if (arch.current) arch.current.style.transform = `translate3d(0, ${px * 0.12}px, 0) scale(${1 + p * 0.06})`;
      if (copy.current) {
        copy.current.style.transform = `translate3d(0, ${px * 0.42}px, 0)`;
        copy.current.style.opacity = String(1 - clamp01((p - 0.1) / 0.55));
      }
      if (index.current) index.current.style.opacity = String(1 - clamp01(p / 0.35));
    });
  }, [reduced]);

  const { hero, chapters } = FILM;

  return (
    <section ref={root} className="hh" aria-label="Introduction">
      <div ref={arch} className="hh-arch" aria-hidden="true" />
      <div ref={photo} className="hh-photo">
        <Image
          src="/hero-cutout.png"
          alt="Enrico Omri Ravenna"
          width={1334}
          height={2000}
          priority
          sizes="(max-width: 760px) 90vw, 46vw"
        />
      </div>

      <div ref={copy} className="hh-copy">
        <p className="hh-kicker">{hero.kicker}</p>
        <h1 className="hh-title">
          {hero.title.map((line, i) => (
            <span key={line} className="hh-line" style={{ animationDelay: `${0.12 + i * 0.09}s` }}>
              <span className={i === hero.title.length - 1 ? "hh-accent" : undefined}>{line}</span>
            </span>
          ))}
        </h1>
        <p className="hh-sub">{hero.sub}</p>
        <div className="hh-btns">
          <Link href={hero.primary.href} className="hh-btn hh-btn-p">{hero.primary.label}</Link>
          <Link href={hero.secondary.href} className="hh-btn hh-btn-s">{hero.secondary.label}</Link>
        </div>
      </div>

      <div ref={index} className="hh-index" aria-label="Chapters">
        {chapters.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="hh-ix">
            <span className="hh-ix-n">{c.n}</span>
            <span className="hh-ix-w">{c.word}</span>
          </a>
        ))}
      </div>

      <div className="hh-scroll" aria-hidden="true"><span /></div>
    </section>
  );
}
