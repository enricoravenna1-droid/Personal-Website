"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_FOV, GLOBE_RADIUS, cameraAt, latLonToVec3 } from "@/lib/arc";
import { GlobeEarth } from "./earth";
import { GlobeMarkers } from "./markers";

/**
 * Camera rig.
 *
 * The camera is what carries the argument here: it flies from Israel to
 * Atlanta to the Midwest to Arkansas and then pulls back. `cameraAt` returns
 * the framing for any scroll position, and this places the camera on that
 * bearing at that distance, always looking at the centre of the globe.
 *
 * The position is *eased toward* the target rather than set to it. Scroll
 * events do not arrive at a steady rate — a trackpad flick delivers a burst
 * and then nothing — so driving the camera straight from raw progress makes
 * the move stutter in exactly the places the copy wants to be read. A light
 * follow smooths that out without adding perceptible lag.
 */
function CameraRig({
  progress,
  reducedMotion,
}: {
  progress: React.RefObject<number>;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const current = useRef(new THREE.Vector3(0, 0, 3));
  const started = useRef(false);

  useFrame((_, delta) => {
    const p = progress.current ?? 0;
    const { lat, lon, distance } = cameraAt(p);
    const target = latLonToVec3(lat, lon, GLOBE_RADIUS * distance);
    const targetVec = new THREE.Vector3(...target);

    if (!started.current) {
      current.current.copy(targetVec);
      started.current = true;
    } else {
      // Frame-rate independent smoothing. A raw `lerp(0.1)` per frame is
      // twice as fast at 120Hz as at 60Hz, which makes the whole sequence
      // feel different on a ProMotion display than on an external monitor.
      const k = reducedMotion ? 1 : 1 - Math.pow(0.0016, delta);
      current.current.lerp(targetVec, k);
    }

    camera.position.copy(current.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function GlobeScene({
  progress,
  reducedMotion,
  compact,
}: {
  progress: React.RefObject<number>;
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
      <CameraRig progress={progress} reducedMotion={reducedMotion} />
      <Suspense fallback={null}>
        <GlobeEarth
          progress={progress}
          reducedMotion={reducedMotion}
          compact={compact}
        />
        <GlobeMarkers progress={progress} />
      </Suspense>
    </Canvas>
  );
}
