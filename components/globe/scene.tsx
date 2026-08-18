"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_FOV,
  GLOBE_RADIUS,
  cameraApproach,
  cameraAt,
  latLonToVec3,
} from "@/lib/arc";
import { GlobeEarth } from "./earth";
import { GlobeMarkers } from "./markers";

/**
 * Camera rig.
 *
 * The camera is what carries the argument here: it arrives from deep space
 * while the hero dissolves, then flies from Israel to Atlanta to the Midwest
 * to Arkansas and pulls back. `cameraApproach` returns the framing for the
 * handoff and `cameraAt` for everything after it; this places the camera on
 * that bearing at that distance, always looking at the centre of the globe.
 *
 * The position is *eased toward* the target rather than set to it. Scroll
 * events do not arrive at a steady rate — a trackpad flick delivers a burst
 * and then nothing — so driving the camera straight from raw progress makes
 * the move stutter in exactly the places the copy wants to be read. A light
 * follow smooths that out without adding perceptible lag.
 */
function CameraRig({
  progress,
  entry,
  reducedMotion,
}: {
  progress: React.RefObject<number>;
  entry: React.RefObject<number>;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const current = useRef(new THREE.Vector3(0, 0, 3));
  const started = useRef(false);

  useFrame((_, delta) => {
    const e = entry.current ?? 0;
    // Below 1 the approach owns the camera; at 1 the beats take over. The two
    // meet at exactly beat one's framing, by construction in `cameraApproach`,
    // so the handover is not a cut even though the source of the number changes.
    const { lat, lon, distance } =
      e < 1 ? cameraApproach(e) : cameraAt(progress.current ?? 0);
    const target = latLonToVec3(lat, lon, GLOBE_RADIUS * distance);
    const targetVec = new THREE.Vector3(...target);

    if (!started.current) {
      current.current.copy(targetVec);
      started.current = true;
    } else {
      // Frame-rate independent smoothing. A raw `lerp(0.1)` per frame is
      // twice as fast at 120Hz as at 60Hz, which makes the whole sequence
      // feel different on a ProMotion display than on an external monitor.
      //
      // The approach gets a tighter follow than the beats. Over a dolly from
      // 9.2 radii to 3.05 the loose constant lags far enough behind that the
      // globe is still visibly growing after the hero has gone, which reads as
      // the transition running late rather than as weight.
      const k = reducedMotion ? 1 : 1 - Math.pow(e < 1 ? 0.00004 : 0.0016, delta);
      current.current.lerp(targetVec, k);
    }

    camera.position.copy(current.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function GlobeScene({
  progress,
  entry,
  reducedMotion,
  compact,
}: {
  progress: React.RefObject<number>;
  entry: React.RefObject<number>;
  reducedMotion: boolean;
  compact: boolean;
}) {
  return (
    <Canvas
      camera={{ fov: CAMERA_FOV, position: [0, 0, 3], near: 0.01, far: 100 }}
      // Cap at 2. Beyond that a 256x128 displaced sphere with three shader
      // passes costs more than the retina sharpness is worth on a phone.
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <CameraRig
        progress={progress}
        entry={entry}
        reducedMotion={reducedMotion}
      />
      <Suspense fallback={null}>
        <GlobeEarth
          progress={progress}
          entry={entry}
          reducedMotion={reducedMotion}
          compact={compact}
        />
        <GlobeMarkers progress={progress} entry={entry} />
      </Suspense>
    </Canvas>
  );
}
