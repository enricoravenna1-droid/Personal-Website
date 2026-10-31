/**
 * One requestAnimationFrame loop for every scroll-driven piece on the page.
 *
 * Subscribers get (scrollY, viewportHeight) each frame the scroll position
 * changes. Lenis already smooths the scroll, so nothing here adds a second
 * lerp on top: that would read as lag, not polish.
 *
 * `window.__home.seek(name, p)` pins a named section at a progress value so
 * headless Chrome can render it frame by frame. The preview pane throttles
 * rAF and cannot judge motion, so this is how the film gets checked.
 */
export type FrameFn = (y: number, vh: number) => void;

const subs = new Set<FrameFn>();
const forced = new Map<string, number>();
let raf = 0;
let lastY = -1;
let lastVh = -1;
let dirty = true;

function tick() {
  const y = window.scrollY;
  const vh = window.innerHeight;
  if (dirty || y !== lastY || vh !== lastVh) {
    lastY = y;
    lastVh = vh;
    dirty = false;
    subs.forEach((f) => f(y, vh));
  }
  raf = requestAnimationFrame(tick);
}

export function subscribe(f: FrameFn): () => void {
  subs.add(f);
  dirty = true;
  if (subs.size === 1) {
    raf = requestAnimationFrame(tick);
    installSeek();
  }
  return () => {
    subs.delete(f);
    if (subs.size === 0) cancelAnimationFrame(raf);
  };
}

export function forcedProgress(name: string): number | null {
  const v = forced.get(name);
  return v === undefined ? null : v;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const norm = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Progress of a pinned runway: 0 when its top reaches the viewport top,
 *  1 when its bottom reaches the viewport bottom. */
export function runwayProgress(el: HTMLElement, vh: number): number {
  const r = el.getBoundingClientRect();
  const span = r.height - vh;
  return span > 0 ? clamp01(-r.top / span) : 0;
}

declare global {
  interface Window {
    __home?: {
      seek: (name: string, p: number) => void;
      release: (name?: string) => void;
    };
  }
}

function installSeek() {
  if (typeof window === "undefined" || window.__home) return;
  window.__home = {
    seek: (name, p) => {
      forced.set(name, clamp01(p));
      dirty = true;
    },
    release: (name) => {
      if (name) forced.delete(name);
      else forced.clear();
      dirty = true;
    },
  };
}
