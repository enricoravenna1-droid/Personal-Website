"use client";

import Image from "next/image";
import { Children, cloneElement, isValidElement, useEffect, useRef } from "react";
import { clamp01, forcedProgress, smooth, speedZoom, subscribe, velocity } from "@/lib/scroll-engine";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import "./one-frame.css";

/**
 * One Frame: the inner-page grammar from round three (2026-11-01).
 *
 * One photograph is pinned on the right and the words scroll past it on
 * the left. When the words reach a beat with a different photograph, the
 * frame cross-dissolves to it. Text never sits on a face: the frame owns
 * its half of the screen, and its left edge fades into the page.
 *
 * Depth follows the site rule: the photograph drifts slower than the page,
 * the words move with it, and each `[data-depth]` kicker moves faster. The
 * frame zooms out a hair while you scroll fast and settles when you stop.
 *
 * On a phone the frame sits above the words and the dissolve still runs.
 * Under reduced motion it is a plain page: no pinned frame, each photograph
 * inline above the beat that introduces it.
 *
 * Beats are <Beat> children, anywhere inside; `frame` picks the photograph.
 * `next` on a beat is the faint word at the foot of the screen.
 */
export type Frame = {
  src: string;
  alt: string;
  /** object-position on desktop; `posM` on a phone. */
  pos?: string;
  posM?: string;
  /** A transparent cutout, stood on a lit floor rather than cropped. */
  cutout?: boolean;
};

type BeatProps = {
  id?: string;
  frame: number;
  next?: string;
  group?: string;
  className?: string;
  children: React.ReactNode;
  /** Filled in by OneFrame. */
  inline?: Frame | null;
  labelledBy?: string;
};

export function Beat({ id, frame, next, group, className, children, inline, labelledBy }: BeatProps) {
  return (
    <section
      id={id}
      className={className ? `of-beat ${className}` : "of-beat"}
      data-frame={frame}
      data-next={next ?? ""}
      data-group={group ?? ""}
      aria-labelledby={labelledBy}
    >
      {inline ? (
        <div className={inline.cutout ? "of-inline of-inline-cutout" : "of-inline"}>
          <Image
            src={inline.src}
            alt={inline.alt}
            fill
            sizes="(max-width: 760px) 92vw, 560px"
            style={{ objectPosition: inline.pos ?? "50% 30%" }}
          />
        </div>
      ) : null}
      <div className="of-beat-inner">{children}</div>
    </section>
  );
}

/** A wrapper that only carries an id, for a dropdown entry that names a group of beats. */
export function BeatGroup({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="of-group">
      {Children.map(children, (c) => c)}
    </div>
  );
}

type Props = {
  name: string;
  frames: Frame[];
  /** Small list over the frame's faded edge that marks where you are. */
  index?: { id: string; label: string }[];
  children: React.ReactNode;
};

/** Walks the tree once so each beat that opens a new photograph carries it
 *  inline for the reduced-motion page. */
function withInline(children: React.ReactNode, frames: Frame[]) {
  let prev = -1;
  const walk = (node: React.ReactNode): React.ReactNode =>
    Children.map(node, (child) => {
      if (!isValidElement(child)) return child;
      const props = child.props as { frame?: number; children?: React.ReactNode };
      // Matched by shape, not by `child.type === Beat`: elements that cross
      // the server boundary arrive as client references, not this function.
      if (typeof props.frame === "number") {
        const first = props.frame !== prev;
        prev = props.frame;
        return cloneElement(child as React.ReactElement<BeatProps>, { inline: first ? frames[props.frame] : null });
      }
      if (props.children) {
        return cloneElement(child as React.ReactElement<{ children: React.ReactNode }>, {
          children: walk(props.children),
        });
      }
      return child;
    });
  return walk(children);
}

export function OneFrame({ name, frames, index, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const frameEl = useRef<HTMLDivElement>(null);
  const zoomEl = useRef<HTMLDivElement>(null);
  const imgs = useRef<(HTMLDivElement | null)[]>([]);
  const ghost = useRef<HTMLDivElement>(null);
  const ghostWord = useRef<HTMLSpanElement>(null);
  const indexEl = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = root.current;
    if (!el) return;
    const beats = Array.from(el.querySelectorAll<HTMLElement>(".of-beat"));
    const frameOf = beats.map((b) => Number(b.dataset.frame ?? 0));
    const nextOf = beats.map((b) => b.dataset.next ?? "");
    // The index entry each beat belongs to: its own group, or the last one seen.
    let g = "";
    const groupOf = beats.map((b) => (g = b.dataset.group || g));
    const depth = beats.map((b) => Array.from(b.querySelectorAll<HTMLElement>("[data-depth]")));
    const phone = window.matchMedia("(max-width: 760px)");
    let zoom = 0;
    let shownWord = "\u0000";
    let lastSeek: number | null = null;
    let lastTop = new Array(frames.length).fill(-1);

    return subscribe((_, vh, dt) => {
      // A seek scrolls the page itself: these pages are not pinned runways.
      const f = forcedProgress(name);
      if (f !== null && f !== lastSeek) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + f * Math.max(0, el.offsetHeight - vh), behavior: "instant" as ScrollBehavior });
      }
      lastSeek = f;

      const rects = beats.map((b) => b.getBoundingClientRect());
      const top = phone.matches && frameEl.current ? frameEl.current.getBoundingClientRect().bottom : 0;
      // The dissolve runs while the next beat's top crosses this band.
      const a = top + (vh - top) * 0.7;
      const b = top + (vh - top) * 0.42;

      let cur = 0;
      for (let i = 0; i < beats.length; i++) if (rects[i].top <= b) cur = i;
      const nx = cur + 1 < beats.length ? cur + 1 : -1;
      const t = nx >= 0 ? clamp01((a - rects[nx].top) / (a - b)) : 0;
      const fCur = frameOf[cur];
      const fNext = nx >= 0 ? frameOf[nx] : fCur;
      const mix = fNext !== fCur ? smooth(t) : 0;

      zoom += (speedZoom(velocity()) - zoom) * (1 - Math.exp(-dt / 0.18));
      if (zoom < 1e-4) zoom = 0;
      if (zoomEl.current) zoomEl.current.style.transform = `scale(${(1 - zoom).toFixed(4)})`;

      for (let k = 0; k < frames.length; k++) {
        const node = imgs.current[k];
        if (!node) continue;
        const op = k === fCur ? 1 : k === fNext ? mix : 0;
        node.style.opacity = String(op);
        const z = k === fNext && fNext !== fCur ? "2" : k === fCur ? "1" : "0";
        if (node.style.zIndex !== z) node.style.zIndex = z;
        if (op <= 0) continue;
        // Drift across every beat that shows this photograph: slower than the page.
        let s = -1;
        let e = -1;
        for (let i = 0; i < beats.length; i++) {
          if (frameOf[i] !== k) continue;
          if (s < 0) s = rects[i].top;
          e = rects[i].bottom;
        }
        if (s < 0) continue;
        const q = clamp01((vh - s) / (e - s + vh));
        const ty = (0.5 - q) * 6;
        if (lastTop[k] !== ty) {
          lastTop[k] = ty;
          node.style.transform = `translate3d(0, ${ty.toFixed(3)}%, 0)`;
        }
      }

      // Kickers run ahead of the words they head.
      for (let i = 0; i < beats.length; i++) {
        if (rects[i].bottom < -vh * 0.5 || rects[i].top > vh * 1.5) continue;
        for (const k of depth[i]) {
          const c = rects[i].top + k.offsetTop + k.offsetHeight / 2;
          // Only once it is above centre, so it pulls away from its heading, never into it.
          const d = Math.min(0, (c - vh / 2) / vh);
          const ty = Math.max(-40, d * 0.1 * vh);
          k.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0)`;
        }
      }

      // The next chapter's word, faint at the foot; it swaps at the midpoint of a dissolve.
      if (ghost.current && ghostWord.current) {
        const wCur = nextOf[cur];
        const wNext = nx >= 0 ? nextOf[nx] : wCur;
        const swap = wNext !== wCur;
        const word = swap && t >= 0.5 ? wNext : wCur;
        const vis = swap ? Math.abs(t - 0.5) * 2 : 1;
        if (word !== shownWord) {
          shownWord = word;
          ghostWord.current.textContent = word;
        }
        ghost.current.style.opacity = String(word ? vis * 0.13 : 0);
        ghost.current.style.transform = `translate3d(0, ${((1 - vis) * 24).toFixed(2)}px, 0)`;
      }

      if (indexEl.current) {
        const on = groupOf[t >= 0.5 && nx >= 0 ? nx : cur];
        indexEl.current.querySelectorAll<HTMLElement>("a").forEach((a) => {
          const v = a.dataset.id === on ? "true" : "false";
          if (a.dataset.on !== v) a.dataset.on = v;
        });
      }

      return zoom > 0;
    });
  }, [reduced, name, frames.length]);

  return (
    <div ref={root} className="of" data-of={name}>
      <div ref={frameEl} className="of-frame">
        <div ref={zoomEl} className="of-zoom">
          {frames.map((f, k) => (
            <div
              key={f.src + k}
              className={f.cutout ? "of-img of-cutout" : "of-img"}
              ref={(n) => { imgs.current[k] = n; }}
              style={{ "--pos": f.pos ?? "50% 30%", "--pos-m": f.posM ?? f.pos ?? "50% 30%" } as React.CSSProperties}
            >
              <Image src={f.src} alt={f.alt} fill priority={k === 0} sizes="(max-width: 760px) 100vw, 50vw" className="of-photo" />
            </div>
          ))}
        </div>
        <div className="of-fade" aria-hidden="true" />
        {index ? (
          <ol ref={indexEl} className="of-index" aria-label="Voices on this page">
            {index.map((e, i) => (
              <li key={e.id}>
                <a href={`#${e.id}`} data-id={e.id} data-on={i === 0 ? "true" : "false"}>
                  <span>{String(i + 1).padStart(2, "0")}</span> {e.label}
                </a>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="of-text">
        <div className="of-cap" aria-hidden="true" />
        {withInline(children, frames)}
        <div ref={ghost} className="of-next" aria-hidden="true">
          <span ref={ghostWord} />
        </div>
      </div>
    </div>
  );
}
