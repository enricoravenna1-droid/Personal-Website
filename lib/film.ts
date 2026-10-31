/**
 * The film's choreography. Pure maths, no React, no three.js.
 *
 * One number drives everything: `p`, scroll progress through the runway,
 * 0 at the top of the page and 1 at the end of the sequence. Every plate
 * position, the camera, the thread's glow and which callout is lit are all
 * functions of `p` and nothing else. That is what makes the sequence
 * seekable (`window.__film.seek(p)`) and therefore checkable frame by frame
 * in headless Chrome, which the preview pane cannot do for WebGL.
 *
 * The object is a stack of four black glass plates on a red thread. Each
 * plate is one chapter, oldest at the bottom like strata. The thread is the
 * through-line and never breaks, even when the plates are fanned apart.
 */

export const RUNWAY_VH = 1000;

/**
 * Plate dimensions in scene units. A plate is a flat tile: `w` along X,
 * `d` thick along Y, `h` deep along Z. The photo lies on its top face. The
 * camera framing below assumes these.
 */
export const PLATE = { w: 2.6, h: 1.62, d: 0.16, radius: 0.05 } as const;
/** Vertical pitch between plate centres when the stack is closed. */
export const PITCH_CLOSED = PLATE.d + 0.05;
/** ...and when fully fanned apart. */
export const PITCH_OPEN = 0.92;
export const PLATE_COUNT = 4;

export const CAMERA_FOV = 32;

/** Phase boundaries in `p`. Each chapter gets an equal slice of CHAPTERS. */
export const PHASE = {
  hero: [0, 0.1],
  fracture: [0.1, 0.24],
  chapters: [0.24, 0.76],
  reassemble: [0.76, 0.87],
  core: [0.87, 1],
} as const;

export type Phase = keyof typeof PHASE;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const norm = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** Ease in-out quintic. Holds longer at the ends than smoothstep, so a move
 *  reads as settled before the copy over it asks to be read. */
export const easeQ = (t: number) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

export type Vec3 = [number, number, number];

export type PlateState = {
  /** Centre position. */
  position: Vec3;
  /** Euler rotation. */
  rotation: Vec3;
  /** 0 dim, 1 lit. Drives the photo brightness and the glass sheen. */
  focus: number;
};

export type FilmState = {
  phase: Phase;
  /** Which chapter is lit, or -1. */
  beat: number;
  /** 0..1 visibility of the lit chapter's callout. */
  callout: number;
  /** Rotation of the whole stack about Y, radians. */
  stackRotY: number;
  stackRotX: number;
  plates: PlateState[];
  camera: { position: Vec3; target: Vec3 };
  /** Emissive strength of the thread, 1 = resting. */
  thread: number;
  /** 0..1 opacity of the hero copy. */
  hero: number;
  /** 0..1 opacity of the values copy over the core. */
  core: number;
  /** 0..1 how far apart the plates are. */
  spread: number;
};

export function phaseAt(p: number): Phase {
  if (p < PHASE.hero[1]) return "hero";
  if (p < PHASE.fracture[1]) return "fracture";
  if (p < PHASE.chapters[1]) return "chapters";
  if (p < PHASE.reassemble[1]) return "reassemble";
  return "core";
}

/** Chapter index 0..3 for a `p` inside the chapters phase, else -1. */
export function beatAt(p: number): number {
  const [a, b] = PHASE.chapters;
  if (p < a || p >= b) return -1;
  return Math.min(PLATE_COUNT - 1, Math.floor(norm(p, a, b) * PLATE_COUNT));
}

/** Y of plate i's centre for a given spread, stack centred on the origin. */
export function plateY(i: number, spread: number): number {
  const pitch = lerp(PITCH_CLOSED, PITCH_OPEN, spread);
  return (i - (PLATE_COUNT - 1) / 2) * pitch;
}

const TILT = 1.22;
const CAM_HERO: Vec3 = [0.6, 1.5, 6.6];
const HERO_TARGET: Vec3 = [0, -0.55, 0];
const CAM_FRACTURE: Vec3 = [0.9, 1.7, 8.6];
const CAM_CORE_IN: Vec3 = [0.5, 1.0, 5.0];

export function filmAt(p: number): FilmState {
  p = clamp(p);
  const phase = phaseAt(p);

  // --- spread: closed in the hero, opens across the fracture, holds through
  // the chapters, closes across the reassemble.
  let spread = 0;
  if (phase === "fracture") spread = easeQ(norm(p, PHASE.fracture[0], PHASE.fracture[1]));
  else if (phase === "chapters") spread = 1;
  else if (phase === "reassemble")
    spread = 1 - easeQ(norm(p, PHASE.reassemble[0], PHASE.reassemble[1]));

  // --- stack rotation: a slow, continuous turn so the object never stops
  // being an object. Slightly faster through the fracture so the fan reads
  // in three-quarter view.
  // Hero: a three-quarter pose that turns slowly. Chapters: the stack holds
  // at a shallow angle so every plate faces the camera; the lit plate turns
  // the rest of the way itself. Reassemble and core: it turns back.
  const ROT_HERO = 0.62, ROT_CHAPTERS = 0.3, ROT_CORE = 0.5;
  let stackRotY = ROT_HERO;
  let stackRotX = 0.1;
  if (phase === "hero") {
    stackRotY = ROT_HERO - norm(p, 0, PHASE.hero[1]) * 0.08;
  } else if (phase === "fracture") {
    const t = easeQ(norm(p, PHASE.fracture[0], PHASE.fracture[1]));
    stackRotY = lerp(ROT_HERO - 0.08, ROT_CHAPTERS, t);
    stackRotX = lerp(0.1, 0.04, t);
  } else if (phase === "chapters") {
    stackRotY = ROT_CHAPTERS;
    stackRotX = 0.04;
  } else if (phase === "reassemble") {
    const t = easeQ(norm(p, PHASE.reassemble[0], PHASE.reassemble[1]));
    stackRotY = lerp(ROT_CHAPTERS, ROT_CORE, t);
    stackRotX = lerp(0.04, 0.1, t);
  } else {
    const t = easeQ(norm(p, PHASE.core[0], PHASE.core[1]));
    stackRotY = lerp(ROT_CORE, ROT_CORE - 0.12, t);
    stackRotX = 0.1;
  }

  // --- beat and callout
  const beat = beatAt(p);
  let callout = 0;
  if (beat >= 0) {
    const [a, b] = PHASE.chapters;
    const slice = (b - a) / PLATE_COUNT;
    const local = (p - a - beat * slice) / slice; // 0..1 inside this beat
    // Rise over the first 22%, hold, fall over the last 18%.
    callout = Math.min(smooth(norm(local, 0.04, 0.26)), 1 - smooth(norm(local, 0.82, 1)));
  }

  // --- plates
  // Each plate's focus is a bump centred on its own beat, overlapping its
  // neighbours slightly so the handover is a crossfade, not a cut.
  const focusOf = (i: number) => {
    if (beat < 0) return 0;
    const [a, b] = PHASE.chapters;
    const slice = (b - a) / PLATE_COUNT;
    const centre = a + (i + 0.5) * slice;
    const dist = Math.abs(p - centre) / slice;
    return 1 - smooth(norm(dist, 0.3, 0.62));
  };
  const focus = Array.from({ length: PLATE_COUNT }, (_, i) => focusOf(i));
  const plates: PlateState[] = [];
  for (let i = 0; i < PLATE_COUNT; i++) {
    const y = plateY(i, spread);
    const e = easeQ(focus[i]);
    // Plates above a lit one lift out of its way; plates below settle a
    // touch, so the lifted tile has room to tilt without clipping either.
    let room = 0;
    for (let j = 0; j < PLATE_COUNT; j++) {
      if (j === i) continue;
      const ej = easeQ(focus[j]);
      room += j < i ? ej * 0.95 : -ej * 0.2;
    }
    // The lit plate slides forward out of the stack, rises, and tilts up to
    // present its face to the camera, like a tile lifted off a pile. The
    // camera sits a little above and to the right, so TILT is what makes the
    // face square to it; see the chapter camera below.
    plates.push({
      position: [0, y + e * 0.35 + room, e * 0.75],
      rotation: [e * TILT, -e * 0.12, 0],
      focus: focus[i],
    });
  }

  // --- camera
  let position: Vec3 = CAM_HERO;
  let target: Vec3 = [0, 0, 0];
  if (phase === "hero") {
    position = CAM_HERO;
    target = HERO_TARGET;
  } else if (phase === "fracture") {
    const t = easeQ(norm(p, PHASE.fracture[0], PHASE.fracture[1]));
    position = lerp3(CAM_HERO, CAM_FRACTURE, t);
    target = lerp3(HERO_TARGET, [0, 0, 0], t);
  } else if (phase === "chapters") {
    const [a, b] = PHASE.chapters;
    const slice = (b - a) / PLATE_COUNT;
    // Camera rides a continuous dolly from plate 0 to plate 3, pausing on
    // each. The pause is the hold in the middle of each beat; the move is
    // eased across the last third of one beat and the first third of the next.
    const u = norm(p, a, b) * PLATE_COUNT; // 0..4
    const k = Math.min(PLATE_COUNT - 1, Math.floor(u));
    const local = u - k;
    const move = k < PLATE_COUNT - 1 ? easeQ(norm(local, 0.68, 1)) : 0;
    const yFrom = plateY(k, 1);
    const yTo = plateY(Math.min(k + 1, PLATE_COUNT - 1), 1);
    const y = lerp(yFrom, yTo, move);
    // The camera looks at where the lit tile *is*: lifted and forward while
    // lit, back at rest as its focus falls. On the last beat that is what
    // lets the reassemble pick up without a jump.
    const liftK = k === PLATE_COUNT - 1 ? easeQ(focus[k]) : 1;
    const beatPos: Vec3 = [1.1, y + 1.5, 5.4];
    const beatTarget: Vec3 = [0.4, y + 0.5 * liftK, 0.45 * liftK];
    // The arrival into the first beat settles from the fracture framing.
    const arrive = k === 0 ? easeQ(norm(local, 0, 0.3)) : 1;
    position = lerp3(CAM_FRACTURE, beatPos, arrive);
    target = lerp3([0, 0, 0], beatTarget, arrive);
  } else if (phase === "reassemble") {
    // The camera pulls out ahead of the plates closing, so the whole object
    // is in frame while it comes back together.
    const [a, b] = PHASE.reassemble;
    const t = easeQ(norm(p, a, a + (b - a) * 0.6));
    const yTop = plateY(PLATE_COUNT - 1, 1);
    position = lerp3([1.1, yTop + 1.5, 5.4], [0.6, 1.6, 7.0], t);
    target = lerp3([0.4, yTop, 0], [0, 0, 0], t);
  } else {
    const t = easeQ(norm(p, PHASE.core[0], PHASE.core[1]));
    position = lerp3([0.6, 1.6, 7.0], CAM_CORE_IN, t);
    target = lerp3([0, 0, 0], [0, -0.35, 0], t);
  }

  // --- thread glow: rests at 1, swells as the camera pushes into the core.
  const thread =
    phase === "core" ? lerp(1, 3.2, easeQ(norm(p, PHASE.core[0], PHASE.core[1]))) : 1;

  // --- copy layers
  const hero = 1 - smooth(norm(p, 0.04, 0.12));
  const core = smooth(norm(p, 0.9, 0.97));

  return {
    phase,
    beat,
    callout,
    stackRotY,
    stackRotX,
    plates,
    camera: { position, target },
    thread,
    hero,
    core,
    spread,
  };
}
