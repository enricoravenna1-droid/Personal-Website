/**
 * The career-arc cinematic: geometry and choreography.
 *
 * Same instrument as the AJ2054 atlas globe, playing a different tune. There
 * the globe argued that 147 federations are further-flung and smaller than
 * the national conversation admits. Here it argues one thing about one
 * person: the reach widened, then deliberately narrowed, then widened again.
 *
 * That claim is already the thesis line on /vision — "I started with an
 * entire community, narrowed into a single generation on campus, and now
 * lead an entire state." It happens to be a *geographic* claim, which is why
 * a globe is the right instrument rather than decoration. The camera does
 * the arguing; the copy only names what you are already looking at.
 *
 * Everything below is pure maths and data. No React, no Three. That keeps it
 * testable and keeps the scene file about rendering.
 */

/** Sphere radius in world units. Every other distance is relative to it. */
export const GLOBE_RADIUS = 1;

/**
 * Vertical field of view, in degrees. Lives here rather than only on the
 * Canvas because the framing distances below are derived from it.
 */
export const CAMERA_FOV = 40;

/**
 * Convert WGS84 degrees to a point on the sphere.
 *
 * The +180 on longitude aligns markers with an equirectangular basemap:
 * Three's SphereGeometry lays out u as `x = -cos(u*2PI)*sin(t)`, which
 * solves to `u = (lon + 180) / 360`, and the left edge of an
 * equirectangular image is the 180th meridian. Drop the offset and every
 * marker lands half a world east — which looks plausible right up until you
 * notice Little Rock is in the Pacific.
 */
export function latLonToVec3(
  lat: number,
  lon: number,
  radius: number = GLOBE_RADIUS,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export type Marker = {
  lat: number;
  lon: number;
  label: string;
  /** Which beat this marker belongs to. Used to fade groups in and out. */
  beat: number;
  /** Relative size, 0..1. Scaled to world units in the scene. */
  weight: number;
};

/**
 * The places, in the order he actually went.
 *
 * Campus markers are the six Midwest schools the Maccabee Task Force role
 * covered. They are individually small on purpose: the point of beat 3 is
 * that the work got narrower and more numerous at once.
 */
export const MARKERS: Marker[] = [
  // Beat 1 — Israel
  { lat: 31.26, lon: 34.8, label: "Negev", beat: 1, weight: 0.85 },
  { lat: 32.08, lon: 34.78, label: "Tel Aviv", beat: 1, weight: 1 },

  // Beat 2 — Atlanta and the Southeast region
  { lat: 33.75, lon: -84.39, label: "Atlanta", beat: 2, weight: 1 },
  { lat: 35.23, lon: -80.84, label: "Charlotte", beat: 2, weight: 0.5 },
  { lat: 30.33, lon: -81.66, label: "Jacksonville", beat: 2, weight: 0.5 },
  { lat: 36.16, lon: -86.78, label: "Nashville", beat: 2, weight: 0.55 },
  { lat: 32.78, lon: -79.93, label: "Charleston", beat: 2, weight: 0.45 },
  { lat: 25.76, lon: -80.19, label: "Miami", beat: 2, weight: 0.6 },

  // Beat 3 — Midwest campuses
  { lat: 42.28, lon: -83.74, label: "Ann Arbor", beat: 3, weight: 0.42 },
  { lat: 43.07, lon: -89.4, label: "Madison", beat: 3, weight: 0.42 },
  { lat: 39.96, lon: -82.99, label: "Columbus", beat: 3, weight: 0.42 },
  { lat: 39.17, lon: -86.52, label: "Bloomington", beat: 3, weight: 0.42 },
  { lat: 40.11, lon: -88.24, label: "Champaign", beat: 3, weight: 0.42 },
  { lat: 44.98, lon: -93.27, label: "Minneapolis", beat: 3, weight: 0.42 },

  // Beat 4 — Arkansas
  { lat: 34.75, lon: -92.29, label: "Little Rock", beat: 4, weight: 1 },
  { lat: 36.07, lon: -94.17, label: "Fayetteville", beat: 4, weight: 0.7 },
  { lat: 36.33, lon: -94.12, label: "Bentonville", beat: 4, weight: 0.55 },
  { lat: 35.46, lon: -94.4, label: "Fort Smith", beat: 4, weight: 0.45 },

  // Beat 5 — the wider map the argument lands on
  { lat: 40.71, lon: -74.01, label: "New York", beat: 5, weight: 0.7 },
  { lat: 34.05, lon: -118.24, label: "Los Angeles", beat: 5, weight: 0.65 },
  { lat: 41.88, lon: -87.63, label: "Chicago", beat: 5, weight: 0.6 },
  { lat: 29.76, lon: -95.37, label: "Houston", beat: 5, weight: 0.55 },
  { lat: 39.74, lon: -104.99, label: "Denver", beat: 5, weight: 0.5 },
  { lat: 47.61, lon: -122.33, label: "Seattle", beat: 5, weight: 0.5 },
  { lat: 33.45, lon: -112.07, label: "Phoenix", beat: 5, weight: 0.5 },
  { lat: 44.98, lon: -93.27, label: "Twin Cities", beat: 5, weight: 0.45 },
  { lat: 42.36, lon: -71.06, label: "Boston", beat: 5, weight: 0.55 },
  { lat: 38.91, lon: -77.04, label: "Washington", beat: 5, weight: 0.55 },
];

export type Beat = {
  /** Scroll progress window, 0..1 across the whole runway. */
  at: readonly [number, number];
  kicker: string;
  line: string;
  /** Camera target on the sphere. */
  lat: number;
  lon: number;
  /**
   * Camera distance from the centre, in sphere radii.
   *
   * These are not free numbers. At FOV 40 the globe's angular diameter is
   * `2·asin(1/d)`, so it fills the frame height at d≈2.9 and overflows it
   * below that. The first draft used 1.85–3.1 and the globe overflowed the
   * viewport on every beat but the last — the camera was correct and the
   * shot was a close-up of whatever happened to be under it.
   *
   *   d=2.9  fills the frame        d=3.4  86% of frame height
   *   d=3.7  78%                    d=5.2  55%, whole disc with space around it
   */
  distance: number;
};

/**
 * Five beats.
 *
 * The windows leave gaps between them on purpose: the gap is the camera move,
 * and copy that cross-fades edge-to-edge never has a moment where the globe is
 * simply the globe.
 *
 * **The gaps are not equal, and that is the point.** Transit time is allocated
 * by how far the camera actually travels, not evenly. Israel to Atlanta is 119°
 * of longitude; the other three hops are 3°, 8° and 7°. The first draft gave
 * all four an identical 0.05 of runway, which made the opening move a whip-pan
 * roughly fifteen times faster than the rest of the sequence — caught by the
 * continuity check in tests/arc.test.mjs, not by eye. The Atlantic crossing now
 * gets 0.19 and the short hops get 0.06 to 0.08.
 */
export const BEATS: Beat[] = [
  {
    at: [0.02, 0.13],
    kicker: "Israel",
    line: "I was born here. I served here. Everything I have built since starts here.",
    lat: 31.5,
    lon: 34.8,
    distance: 3.05,
  },
  {
    at: [0.32, 0.44],
    kicker: "Atlanta, and a whole region",
    line: "An entire community across the Southeast. Every demographic, not a single population.",
    lat: 33.2,
    lon: -84.4,
    distance: 3.45,
  },
  {
    at: [0.52, 0.63],
    kicker: "Then I narrowed",
    line: "Campus by campus across the Midwest. One generation, on purpose.",
    lat: 41.5,
    lon: -87.5,
    distance: 3.25,
  },
  {
    at: [0.71, 0.82],
    kicker: "Arkansas",
    line: "A lean team, an outsized mission, and a state nobody was counting.",
    lat: 34.9,
    lon: -92.5,
    distance: 2.95,
  },
  {
    at: [0.88, 0.99],
    kicker: "The map is bigger than the metros",
    line: "The future of American Jewry runs through communities like this one.",
    lat: 39.5,
    lon: -98.35,
    distance: 5.2,
  },
];

/**
 * Runway length in viewport heights, *excluding* the approach.
 *
 * Five beats need room. Deliberately not shortened for phones, which is the
 * opposite of the obvious call: a runway measured in viewport heights is
 * already shorter in pixels on a phone (520vh of a 700px viewport is 3.6k
 * pixels against 4.7k on a 900px one), and the unit a phone user feels is
 * gestures rather than pixels. Two or three flicks with momentum. Cutting it
 * would put each beat under 250px of travel, which under iOS momentum
 * scrolling is a line that flashes past unread.
 *
 * The real fix for "this is long on a phone" is a way out of it, which is
 * what the skip link is for.
 */
export const BEATS_VH = 520;

/**
 * The approach, in viewport heights, and why it exists at all.
 *
 * The first build cut straight from the hero to the globe: the hero scrolled
 * away, the runway's sticky stage arrived already pinned, and beat one was
 * fully framed on its first painted pixel. Two separate sections, butted
 * together, with nothing between them — which is exactly what "a bit abrupt"
 * describes.
 *
 * The fix is that the two sections now *overlap by one viewport*. The runway
 * is pulled up under the hero by `APPROACH_VH`, so the stage is already
 * pinned and rendering while the hero is still on screen. Across that overlap
 * the hero dissolves and the globe flies in from `APPROACH` below, so the
 * handoff is a single continuous move rather than a cut between two shots.
 *
 * One viewport is the right length because it is exactly the distance the
 * hero takes to leave. Shorter and the globe arrives before there is room for
 * it; longer and the visitor scrolls through dead space with the hero already
 * gone.
 */
export const APPROACH_VH = 100;

/** Total runway height. The pin lasts `BEATS_VH`; the first `APPROACH_VH` of
 *  it is spent under the departing hero. */
export const RUNWAY_VH = BEATS_VH + APPROACH_VH;

/**
 * Where the camera starts before beat one.
 *
 * Far enough out that the globe is a marble rather than a planet — at d=9.2
 * with FOV 40 it spans 12.5% of the frame height, against 82% at beat one —
 * and rotated ~27° east of Israel so the approach carries a small amount of
 * spin as well as a large amount of dolly. The tilt down to lat 8 means the
 * camera climbs as it closes, which is what stops the move reading as a
 * straight zoom.
 */
export const APPROACH: CameraState = { lat: 8, lon: 62, distance: 9.2 };

/**
 * Camera framing during the approach, 0 (far) to 1 (beat one).
 *
 * Eased twice on purpose. `smooth` alone spends the middle of the move at
 * near-constant speed, which at this dolly range reads as a mechanical zoom;
 * squaring the eased value back-loads it so the globe hangs small and distant
 * for most of the hero's exit and then closes fast in the last third, at the
 * moment the hero has faded out of the way.
 */
export function cameraApproach(entry: number): CameraState {
  const first = BEATS[0];
  const t = smooth(Math.min(1, Math.max(0, entry)));
  const k = t * t;
  return {
    lat: APPROACH.lat + (first.lat - APPROACH.lat) * k,
    lon: APPROACH.lon + shortestDelta(APPROACH.lon, first.lon) * k,
    distance: APPROACH.distance + (first.distance - APPROACH.distance) * k,
  };
}

/** Clamped 0..1 position of `v` within [min, max]. */
export function norm(v: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (v - min) / (max - min)));
}

/** Smoothstep. Used for camera easing between beats. */
export function smooth(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Shortest signed angular distance from a to b, in degrees.
 *
 * Without this the camera takes the long way round whenever a move crosses
 * the antimeridian — Israel at +34.8° to Atlanta at -84.4° is 119° going
 * west but 241° going east, and lerping the raw numbers picks the wrong one
 * about as often as not.
 */
export function shortestDelta(a: number, b: number): number {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

export type CameraState = { lat: number; lon: number; distance: number };

/**
 * Camera position for a given scroll progress.
 *
 * Between beats the camera eases from one framing to the next; inside a
 * beat's own window it holds, so the copy has something steady to sit
 * against. Before the first beat it waits at beat one, after the last it
 * stays at beat five.
 */
export function cameraAt(progress: number): CameraState {
  const first = BEATS[0];
  const last = BEATS[BEATS.length - 1];

  if (progress <= first.at[0]) {
    return { lat: first.lat, lon: first.lon, distance: first.distance };
  }
  if (progress >= last.at[1]) {
    return { lat: last.lat, lon: last.lon, distance: last.distance };
  }

  for (let i = 0; i < BEATS.length; i++) {
    const beat = BEATS[i];
    // Holding inside a beat's window.
    if (progress >= beat.at[0] && progress <= beat.at[1]) {
      return { lat: beat.lat, lon: beat.lon, distance: beat.distance };
    }
    // Travelling from this beat to the next.
    const next = BEATS[i + 1];
    if (next && progress > beat.at[1] && progress < next.at[0]) {
      const t = smooth(norm(progress, beat.at[1], next.at[0]));
      return {
        lat: beat.lat + (next.lat - beat.lat) * t,
        lon: beat.lon + shortestDelta(beat.lon, next.lon) * t,
        distance: beat.distance + (next.distance - beat.distance) * t,
      };
    }
  }

  return { lat: last.lat, lon: last.lon, distance: last.distance };
}

/**
 * How strongly each beat's markers should show at a given progress.
 *
 * Markers fade up as their beat approaches and, once shown, stay: the whole
 * point of the last beat is seeing the accumulated map at once. Only the
 * pre-fade is animated.
 */
export function markerOpacity(beat: number, progress: number): number {
  const b = BEATS[beat - 1];
  if (!b) return 0;
  const lead = 0.06;
  return smooth(norm(progress, b.at[0] - lead, b.at[0] + 0.02));
}
