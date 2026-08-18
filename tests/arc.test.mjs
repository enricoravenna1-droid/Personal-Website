/**
 * Camera-choreography checks.
 *
 * The globe cannot be verified by eye in the Claude preview pane: it throttles
 * requestAnimationFrame and ResizeObserver, so the canvas sits at its default
 * 300x150 and never paints. That is a real limitation of the harness, not of
 * the scene, but it means the framing maths has to be checked some other way.
 *
 * These are the two classes of bug that actually shipped during the build:
 *   1. distances that put the camera inside the globe's angular diameter, so
 *      every beat was an unreadable close-up;
 *   2. longitude interpolation taking the long way round the planet.
 *
 * Run: node tests/arc.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

/**
 * Transpile lib/arc.ts with the real compiler rather than stripping types
 * with regexes. The first version of this file did the regex thing and fell
 * over on the first tuple return annotation, which is the usual outcome.
 */
const source = readFileSync(new URL("../lib/arc.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(outputText, "utf8").toString("base64")}`
);

const {
  APPROACH,
  APPROACH_VH,
  BEATS,
  BEATS_VH,
  RUNWAY_VH,
  cameraApproach,
  cameraAt,
  shortestDelta,
  latLonToVec3,
  CAMERA_FOV,
  GLOBE_RADIUS,
  markerOpacity,
} = mod;

let passed = 0;
const check = (name, fn) => {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
};

console.log("camera framing");

check("every beat frames the whole globe inside the FOV", () => {
  // The globe's angular diameter at distance d is 2*asin(r/d). If that exceeds
  // the vertical FOV the sphere overflows the viewport and the shot becomes a
  // close-up of whatever is under the camera. This is the bug that shipped in
  // the first draft, where four of five beats used d < 2.9.
  for (const b of BEATS) {
    const halfAngle = (Math.asin(GLOBE_RADIUS / b.distance) * 180) / Math.PI;
    assert.ok(
      2 * halfAngle <= CAMERA_FOV,
      `beat "${b.kicker}" at d=${b.distance} spans ${(2 * halfAngle).toFixed(1)}° of a ${CAMERA_FOV}° frame`,
    );
  }
});

check("the camera never enters the globe", () => {
  for (const b of BEATS) {
    assert.ok(b.distance > GLOBE_RADIUS * 1.5, `beat "${b.kicker}" too close`);
  }
});

check("the final beat is the widest shot", () => {
  const last = BEATS[BEATS.length - 1];
  for (const b of BEATS.slice(0, -1)) {
    assert.ok(last.distance > b.distance, `"${b.kicker}" is wider than the pull-back`);
  }
});

console.log("the approach");

check("the approach ends exactly where beat one begins", () => {
  // The handover between cameraApproach and cameraAt happens at entry 1, and
  // the two have to agree there or the globe jumps at the moment the hero
  // finishes dissolving — the single most visible frame in the whole sequence.
  // Compared to a tolerance rather than exactly: the approach reaches beat one
  // by interpolating a 27° longitude delta to t=1, and 62 + (-27.2) lands on
  // 34.799999999999955 in binary floating point. A sub-microdegree difference
  // on a sphere of radius 1 is nine decimal places below a pixel.
  const a = cameraApproach(1);
  const b = cameraAt(0);
  for (const k of ["lat", "lon", "distance"]) {
    assert.ok(Math.abs(a[k] - b[k]) < 1e-9, `${k} differs: ${a[k]} vs ${b[k]}`);
  }
});

check("the approach starts far enough out to read as an arrival", () => {
  // At FOV 40 the globe spans 2*asin(1/d) degrees: 12.5° at the approach's
  // 9.2 radii against 38.9° at beat one's 3.05. The point of the approach is
  // that it starts as a marble and lands as a planet, and a third of the frame
  // is the line between the two — above it there is no arrival left to watch.
  const span = (d) => (2 * Math.asin(GLOBE_RADIUS / d) * 180) / Math.PI;
  assert.ok(span(APPROACH.distance) < CAMERA_FOV * 0.35,
    `starts at ${span(APPROACH.distance).toFixed(1)}° of a ${CAMERA_FOV}° frame`);
  assert.ok(APPROACH.distance > BEATS[0].distance * 2,
    "the approach barely moves");
});

check("the approach is continuous and only ever closes in", () => {
  let prev = null;
  let prevDist = Infinity;
  for (let e = 0; e <= 1.0001; e += 0.01) {
    const c = cameraApproach(e);
    assert.ok(c.distance <= prevDist + 1e-9, `dolly reversed at entry ${e.toFixed(2)}`);
    prevDist = c.distance;
    const v = latLonToVec3(c.lat, c.lon, GLOBE_RADIUS * c.distance);
    if (prev) {
      const d = Math.hypot(v[0] - prev[0], v[1] - prev[1], v[2] - prev[2]);
      assert.ok(d < 0.35, `camera jumped ${d.toFixed(3)} units at entry ${e.toFixed(2)}`);
    }
    prev = v;
  }
});

check("the runway is the approach plus the beats, and nothing else", () => {
  // The stylesheet pulls the runway up by APPROACH_VH and the scroll handler
  // subtracts the same overlap before computing beat progress. If these stop
  // adding up, the beats start early and beat one is half gone before the
  // hero has finished leaving.
  assert.equal(RUNWAY_VH, BEATS_VH + APPROACH_VH);
});

console.log("beat windows");

check("windows are ordered and never overlap", () => {
  for (let i = 0; i < BEATS.length; i++) {
    const [s, e] = BEATS[i].at;
    assert.ok(e > s, `beat ${i} ends before it starts`);
    if (i > 0) {
      assert.ok(s > BEATS[i - 1].at[1], `beat ${i} overlaps beat ${i - 1}`);
    }
  }
});

check("every window is wide enough to be read", () => {
  // Under 10% of a 520vh runway is roughly 270px of travel at a 900px
  // viewport, which under momentum scrolling flashes past unread.
  for (const b of BEATS) {
    assert.ok(b.at[1] - b.at[0] >= 0.1, `"${b.kicker}" window is too short`);
  }
});

console.log("longitude interpolation");

check("takes the short way across the antimeridian", () => {
  // Israel +34.8 to Atlanta -84.4 is 119° west or 241° east. Lerping the raw
  // numbers picks the wrong one and the camera swings across the Pacific.
  assert.equal(Math.round(shortestDelta(34.8, -84.4)), -119);
  assert.equal(Math.round(shortestDelta(170, -170)), 20);
  assert.equal(Math.round(shortestDelta(-170, 170)), -20);
});

check("the transit from Israel to Atlanta stays over the Atlantic", () => {
  // Sampling the leg between beat 1 and beat 2: longitude must decrease
  // monotonically from +34.8 toward -84.4 and never wrap past ±180.
  const from = BEATS[0].at[1];
  const to = BEATS[1].at[0];
  let prev = cameraAt(from).lon;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const lon = cameraAt(from + (to - from) * t).lon;
    assert.ok(lon <= prev + 1e-6, `longitude went backwards at t=${t.toFixed(2)}`);
    assert.ok(Math.abs(lon) <= 180, `longitude left the sphere at t=${t.toFixed(2)}`);
    prev = lon;
  }
});

console.log("camera continuity");

check("position is continuous across the whole runway", () => {
  // No jump cuts: a discontinuity here is a camera that teleports mid-scroll.
  let prev = null;
  for (let p = 0; p <= 1.0001; p += 0.005) {
    const c = cameraAt(p);
    const v = latLonToVec3(c.lat, c.lon, GLOBE_RADIUS * c.distance);
    if (prev) {
      const d = Math.hypot(v[0] - prev[0], v[1] - prev[1], v[2] - prev[2]);
      assert.ok(d < 0.35, `camera jumped ${d.toFixed(3)} units at progress ${p.toFixed(3)}`);
    }
    prev = v;
  }
});

check("holds still inside each beat window", () => {
  // The copy needs something steady to sit against.
  for (const b of BEATS) {
    const a = cameraAt(b.at[0] + 0.001);
    const z = cameraAt(b.at[1] - 0.001);
    assert.deepEqual(
      [a.lat, a.lon, a.distance],
      [z.lat, z.lon, z.distance],
      `camera drifts during "${b.kicker}"`,
    );
  }
});

console.log("markers");

check("markers arrive with their beat and then stay", () => {
  for (let beat = 1; beat <= BEATS.length; beat++) {
    const during = markerOpacity(beat, BEATS[beat - 1].at[1]);
    const atEnd = markerOpacity(beat, 1);
    assert.equal(during, 1, `beat ${beat} markers not up during their beat`);
    assert.equal(atEnd, 1, `beat ${beat} markers disappeared before the end`);

    // Beat 1 is exempt from the "not early" rule: the sequence opens on
    // Israel, so its markers being partly up at progress 0 is correct, not a
    // leak. Every later beat must be fully hidden while the previous beat is
    // on screen, or the map gives away where the story is going.
    if (beat > 1) {
      const atPrevBeat = markerOpacity(beat, BEATS[beat - 2].at[1]);
      assert.equal(atPrevBeat, 0, `beat ${beat} markers leak into beat ${beat - 1}`);
    }
  }
});

check("longitude convention puts Little Rock in North America", () => {
  // The +180 offset in latLonToVec3 is the difference between markers landing
  // on their own coastlines and the entire dataset rendering half a world east.
  const [x, y, z] = latLonToVec3(34.75, -92.29);
  assert.ok(y > 0, "Little Rock is in the northern hemisphere");
  // 92°W: the equirectangular convention puts that at negative X, positive Z.
  assert.ok(x < 0 && z > 0, `unexpected octant: ${[x, y, z].map((n) => n.toFixed(2))}`);
});


console.log("what each beat actually frames");

check("each beat's own markers are on the visible hemisphere", () => {
  // The check a screenshot would have made for me. A camera can be pointed at
  // exactly the right coordinates and still frame the wrong thing if the
  // marker projection and the texture projection disagree about longitude —
  // the markers would sit on the far side of the sphere, hidden.
  const { MARKERS } = mod;
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    const cam = latLonToVec3(b.lat, b.lon, GLOBE_RADIUS * b.distance);
    const camLen = Math.hypot(...cam);
    const camDir = cam.map((v) => v / camLen);

    const own = MARKERS.filter((m) => m.beat === i + 1);
    assert.ok(own.length > 0, `beat ${i + 1} has no markers`);

    for (const m of own) {
      const p = latLonToVec3(m.lat, m.lon, GLOBE_RADIUS);
      // Facing the camera at all: surface normal vs camera direction.
      const facing = p[0] * camDir[0] + p[1] * camDir[1] + p[2] * camDir[2];
      assert.ok(
        facing > 0.15,
        `beat ${i + 1} "${m.label}" is on the far side of the globe (facing ${facing.toFixed(3)})`,
      );
    }
  }
});

check("each beat's markers fall inside the camera frustum", () => {
  const { MARKERS } = mod;
  const halfFov = ((CAMERA_FOV / 2) * Math.PI) / 180;

  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    const cam = latLonToVec3(b.lat, b.lon, GLOBE_RADIUS * b.distance);
    // Camera looks at the origin, so the view axis is -cam normalised.
    const camLen = Math.hypot(...cam);
    const axis = cam.map((v) => -v / camLen);

    for (const m of MARKERS.filter((x) => x.beat === i + 1)) {
      const p = latLonToVec3(m.lat, m.lon, GLOBE_RADIUS);
      const toM = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
      const toLen = Math.hypot(...toM);
      const cos =
        (toM[0] * axis[0] + toM[1] * axis[1] + toM[2] * axis[2]) / toLen;
      const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
      assert.ok(
        angle < halfFov,
        `beat ${i + 1} "${m.label}" is ${((angle * 180) / Math.PI).toFixed(1)}° off axis, outside the ${(CAMERA_FOV / 2).toFixed(0)}° half-FOV`,
      );
    }
  }
});

check("the pull-back frames the continental US", () => {
  // Beat 5's claim is "the map is bigger than the metros", which only lands if
  // the shot actually contains both coasts.
  const b = BEATS[BEATS.length - 1];
  const cam = latLonToVec3(b.lat, b.lon, GLOBE_RADIUS * b.distance);
  const camLen = Math.hypot(...cam);
  const axis = cam.map((v) => -v / camLen);
  const halfFov = ((CAMERA_FOV / 2) * Math.PI) / 180;

  for (const [label, lat, lon] of [
    ["Seattle", 47.61, -122.33],
    ["Boston", 42.36, -71.06],
    ["Miami", 25.76, -80.19],
  ]) {
    const p = latLonToVec3(lat, lon, GLOBE_RADIUS);
    const toM = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
    const toLen = Math.hypot(...toM);
    const cos = (toM[0] * axis[0] + toM[1] * axis[1] + toM[2] * axis[2]) / toLen;
    const angle = Math.acos(Math.min(1, Math.max(-1, cos)));
    assert.ok(angle < halfFov, `${label} is outside the final frame`);
  }
});

console.log(`\n${passed} checks passed`);
