/**
 * One requestAnimationFrame loop for every scroll-driven piece on the site.
 *
 * Subscribers get (scrollY, viewportHeight, dt) each frame something moved.
 * A subscriber returns `true` while it is still settling (a damped value
 * that has not arrived yet), which keeps the loop calling it after the
 * scroll itself has stopped.
 *
 * Three things live here so every page shares them:
 *
 *  - `damper()`: a critically damped follower. Lenis smooths the wheel, but
 *    a pinned section's progress still followed it tick for tick, so every
 *    wheel notch stopped dead. A ~120 ms follower on the progress turns that
 *    into a soft stop. Touch input bypasses it: phones already scroll well,
 *    and lag under a finger reads as broken.
 *  - `velocity()`: smoothed scroll speed in px/s, for the zoom-out a pinned
 *    photo does when you scroll fast. Anchor jumps do not count as speed.
 *  - `window.__home`: `seek(name, p)` pins a named section at a progress
 *    value, and `frame(y, ms)` scrolls and runs exactly one tick with a fixed
 *    time step. Headless Chrome uses both to render frames and a 60 fps
 *    video; the preview pane throttles rAF and cannot judge motion.
 */
export type FrameFn = (y: number, vh: number, dt: number) => boolean | void;

const subs = new Set<FrameFn>();
const forced = new Map<string, number>();
let raf = 0;
let lastY = -1;
let lastVh = -1;
let lastT = 0;
let dirty = true;
let settling = false;
let vel = 0;
let touch = false;
let manual = false;

function step(now: number, fixedDt?: number) {
  const dt = fixedDt ?? Math.min(0.05, Math.max(0.001, (now - lastT) / 1000 || 1 / 60));
  lastT = now;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const dy = lastY < 0 ? 0 : y - lastY;
  // A jump of more than half a screen in one frame is an anchor or a seek,
  // not a scroll. Treat it as standing still rather than as a burst of speed.
  const inst = Math.abs(dy) > vh * 0.5 ? 0 : dy / dt;
  vel += (inst - vel) * (1 - Math.exp(-dt / 0.09));
  if (Math.abs(vel) < 2) vel = 0;
  if (dirty || settling || vel !== 0 || y !== lastY || vh !== lastVh) {
    lastY = y;
    lastVh = vh;
    dirty = false;
    let busy = false;
    subs.forEach((f) => {
      if (f(y, vh, dt)) busy = true;
    });
    settling = busy;
  }
}

function tick(now: number) {
  step(now);
  raf = requestAnimationFrame(tick);
}

export function subscribe(f: FrameFn): () => void {
  subs.add(f);
  dirty = true;
  if (subs.size === 1) {
    installSeek();
    installInput();
    if (!manual) {
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    }
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

/** Smoothed scroll speed in px/s. Zero while anything is being seeked. */
export function velocity(): number {
  return forced.size ? 0 : vel;
}

/** True when the last scroll input was a finger. */
export function isTouch(): boolean {
  return touch;
}

/**
 * Critically damped follower (the SmoothDamp integrator). `time` is how
 * long it takes to cover 90% of a jump: 120 ms reads as a soft stop, not
 * as lag. `snap` jumps straight to the target.
 */
export function damper(time = 0.12) {
  let x = Number.NaN;
  let v = 0;
  return {
    step(target: number, dt: number, snap = false): number {
      if (snap || Number.isNaN(x)) {
        x = target;
        v = 0;
        return x;
      }
      const omega = 3.9 / time;
      const k = omega * dt;
      const e = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
      const change = x - target;
      const temp = (v + omega * change) * dt;
      v = (v - omega * temp) * e;
      x = target + (change + temp) * e;
      if (Math.abs(x - target) < 1e-4 && Math.abs(v) < 1e-3) {
        x = target;
        v = 0;
      }
      return x;
    },
    get settled() {
      return v === 0;
    },
  };
}

/**
 * Damped progress of a pinned runway. Seeks and touch input snap; wheel
 * and keyboard get the soft stop. Returns [progress, stillMoving].
 */
export function pinnedTracker(name: string, time = 0.12) {
  const d = damper(time);
  return (el: HTMLElement, vh: number, dt: number): [number, boolean] => {
    const f = forcedProgress(name);
    const p = d.step(f ?? runwayProgress(el, vh), dt, f !== null || touch);
    return [p, !d.settled];
  };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const norm = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** How much a pinned photo shrinks at speed: up to 3.5%, settling at rest. */
export const speedZoom = (v: number) => Math.min(1, Math.abs(v) / 4200) * 0.035;

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
      frame: (y: number, ms?: number) => number;
    };
    __lenis?: {
      scrollTo: (target: number | string | HTMLElement, opts?: { offset?: number; immediate?: boolean }) => void;
    };
  }
}

function installInput() {
  if (typeof window === "undefined" || (window as unknown as { __engineInput?: 1 }).__engineInput) return;
  (window as unknown as { __engineInput?: 1 }).__engineInput = 1;
  window.addEventListener("touchstart", () => { touch = true; }, { passive: true });
  window.addEventListener("wheel", () => { touch = false; }, { passive: true });
  window.addEventListener("keydown", () => { touch = false; }, { passive: true });
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
    // Video mode: the free-running loop stops and each call is one frame.
    frame: (y, ms = 1000 / 60) => {
      if (!manual) {
        manual = true;
        cancelAnimationFrame(raf);
      }
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      lastT += ms;
      step(lastT, ms / 1000);
      return window.scrollY;
    },
  };
}
