"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MARKERS, GLOBE_RADIUS, markerOpacity } from "@/lib/arc";
import { ELEVATION_SCALE } from "./earth";

/**
 * The place markers.
 *
 * One InstancedMesh rather than thirty meshes. Thirty is few enough that
 * separate meshes would render fine, but it would be thirty draw calls and
 * thirty matrix updates a frame next to a 256x128 displaced sphere, and the
 * instanced path costs nothing extra to write.
 *
 * Opacity is per-beat rather than per-marker: markers arrive with their beat
 * and then stay, because the argument the last beat makes depends on seeing
 * the whole accumulated map at once.
 */

/** Marker sits just clear of the highest terrain so peaks cannot occlude it. */
const LIFT = 1 + ELEVATION_SCALE + 0.004;

const RED = new THREE.Color("#E05252");
const BONE = new THREE.Color("#C9C4BE");

export function GlobeMarkers({
  progress,
}: {
  progress: React.RefObject<number>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const placed = useMemo(
    () =>
      MARKERS.map((m) => {
        const phi = (90 - m.lat) * (Math.PI / 180);
        const theta = (m.lon + 180) * (Math.PI / 180);
        const r = GLOBE_RADIUS * LIFT;
        return {
          beat: m.beat,
          weight: m.weight,
          pos: new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta),
          ),
        };
      }),
    [],
  );

  // Beat 3 is the campuses. They read as a different kind of work from the
  // regional beats, so they carry the bone accent rather than the red.
  const colors = useMemo(() => {
    const arr = new Float32Array(placed.length * 3);
    placed.forEach((m, i) => {
      const c = m.beat === 3 ? BONE : RED;
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    });
    return arr;
  }, [placed]);

  useFrame(({ clock }) => {
    const node = mesh.current;
    if (!node) return;
    const p = progress.current ?? 0;
    const t = clock.elapsedTime;

    placed.forEach((m, i) => {
      const shown = markerOpacity(m.beat, p);
      // A slow breath so the field is never dead, keyed off index so they
      // are not all pulsing in lockstep.
      const pulse = 1 + Math.sin(t * 1.4 + i * 0.7) * 0.09;
      const scale = 0.012 + m.weight * 0.026;
      dummy.position.copy(m.pos);
      dummy.scale.setScalar(shown * scale * pulse);
      dummy.updateMatrix();
      node.setMatrixAt(i, dummy.matrix);
    });
    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, placed.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 12]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      {/* Unlit on purpose. These are annotations on a map, not objects in the
          world; shading them would make the ones on the terminator vanish. */}
      <meshBasicMaterial
        vertexColors
        toneMapped={false}
        transparent
        opacity={0.95}
      />
    </instancedMesh>
  );
}
