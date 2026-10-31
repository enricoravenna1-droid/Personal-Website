"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { CAMERA_FOV, PLATE, PLATE_COUNT, filmAt, plateY, type FilmState } from "@/lib/film";

export type CalloutEls = {
  label: HTMLDivElement | null;
  line: SVGLineElement | null;
  dot: SVGCircleElement | null;
};

export type FilmHandles = {
  /** Scroll progress, 0..1. Written by the runway, read every frame. */
  progress: React.RefObject<number>;
  /** When non-null, overrides `progress` and disables camera smoothing, so a
   *  frame is a pure function of the number. Used by the headless checker. */
  forced: React.RefObject<number | null>;
  callouts: React.RefObject<CalloutEls[]>;
  /** Latest state, for the DOM layers that live outside the canvas. */
  state: React.RefObject<FilmState>;
};

const PHOTOS = ["/photo-idf.jpg", "/photo-mtf.jpg", "/photo-leader.jpg", "/photo.jpg"];

/**
 * The environment the glass reflects, built procedurally so nothing is
 * fetched. Black glass is photographed in a dark room with a few soft
 * panels, not in a bright showroom: the reflections are what you see, so
 * the room is black and the panels are the only things in it.
 */
function buildStudio(): THREE.Scene {
  const room = new THREE.Scene();
  room.background = new THREE.Color("#000000");
  const panel = (w: number, h: number, pos: Vec3, look: Vec3, intensity: number, color = "#ffffff") => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(...look);
    room.add(m);
  };
  // Key: a large soft panel high and to the left, slightly behind.
  panel(10, 6, [-8, 9, -2], [0, 0, 0], 3.2, "#fff6ec");
  // Rim: a long thin strip top right, behind, for the edge highlight.
  panel(16, 1.2, [7, 6, -9], [0, 0, 0], 4.5, "#e8eeff");
  // Fill: faint, low and in front, so the undersides are not pure black.
  panel(8, 4, [2, -6, 9], [0, 0, 0], 0.35);
  return room;
}
type Vec3 = [number, number, number];

function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(buildStudio(), 0.02).texture;
    scene.environment = env;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** The photograph sealed inside a plate, cover-cropped to the plate's face. */
function Photo({ src, materialRef }: { src: string; materialRef: React.RefObject<THREE.MeshBasicMaterial | null> }) {
  const texture = useLoader(THREE.TextureLoader, src);
  const w = PLATE.w * 0.9;
  const h = PLATE.h * 0.84;
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const img = texture.image as { width: number; height: number };
    const ia = img.width / img.height;
    const pa = w / h;
    if (ia > pa) {
      texture.repeat.set(pa / ia, 1);
      texture.offset.set((1 - pa / ia) / 2, 0);
    } else {
      texture.repeat.set(1, ia / pa);
      texture.offset.set(0, (1 - ia / pa) / 2);
    }
    texture.needsUpdate = true;
  }, [texture, w, h]);
  return (
    <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={materialRef} map={texture} color="#333333" toneMapped />
    </mesh>
  );
}

function Plate({ index, group, glass, photo }: {
  index: number;
  group: React.RefObject<THREE.Group | null>;
  glass: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  photo: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  return (
    <group ref={group} position={[0, plateY(index, 0), 0]}>
      <Suspense fallback={null}>
        <Photo src={PHOTOS[index]} materialRef={photo} />
      </Suspense>
      <RoundedBox args={[PLATE.w, PLATE.d, PLATE.h]} radius={PLATE.radius} smoothness={6}>
        <meshPhysicalMaterial
          ref={glass}
          color="#08090b"
          transparent
          opacity={0.9}
          roughness={0.16}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1}
          ior={1.5}
          specularIntensity={1}
          depthWrite={false}
        />
      </RoundedBox>
    </group>
  );
}

function Rig({ handles }: { handles: FilmHandles }) {
  const { camera, size } = useThree();
  const stack = useRef<THREE.Group>(null);
  const thread = useRef<THREE.Mesh>(null);
  const threadMat = useRef<THREE.MeshStandardMaterial>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const glasses = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const photos = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const camPos = useRef(new THREE.Vector3());
  const camTarget = useRef(new THREE.Vector3());
  const started = useRef(false);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const plateRefs = useMemo(
    () =>
      Array.from({ length: PLATE_COUNT }, (_, i) => ({
        group: { get current() { return groups.current[i] ?? null; }, set current(v: THREE.Group | null) { groups.current[i] = v; } },
        glass: { get current() { return glasses.current[i] ?? null; }, set current(v: THREE.MeshPhysicalMaterial | null) { glasses.current[i] = v; } },
        photo: { get current() { return photos.current[i] ?? null; }, set current(v: THREE.MeshBasicMaterial | null) { photos.current[i] = v; } },
      })),
    [],
  );

  useFrame((_, delta) => {
    const forced = handles.forced.current;
    const p = forced ?? handles.progress.current ?? 0;
    const s = filmAt(p);
    handles.state.current = s;

    if (stack.current) {
      stack.current.rotation.set(s.stackRotX, s.stackRotY, 0);
    }
    for (let i = 0; i < PLATE_COUNT; i++) {
      const g = groups.current[i];
      const ps = s.plates[i];
      if (g) {
        g.position.set(...ps.position);
        g.rotation.set(...ps.rotation);
      }
      const ph = photos.current[i];
      if (ph) {
        const v = 0.1 + ps.focus * 0.9;
        ph.color.setScalar(v);
      }
      const gl = glasses.current[i];
      if (gl) {
        gl.envMapIntensity = 1 + ps.focus * 0.4;
        gl.opacity = 0.9 - ps.focus * 0.62;
      }
    }

    // Thread: spans the stack plus a little, glows with the core.
    const yBottom = plateY(0, s.spread);
    const yTop = plateY(PLATE_COUNT - 1, s.spread);
    if (thread.current) {
      const len = yTop - yBottom + PLATE.d + 0.7;
      thread.current.scale.set(1, len, 1);
      thread.current.position.y = (yTop + yBottom) / 2;
    }
    if (threadMat.current) threadMat.current.emissiveIntensity = 3 * s.thread;


    // Camera, eased in live scroll, snapped when seeked.
    const target = tmp.set(...s.camera.target);
    const pos = new THREE.Vector3(...s.camera.position);
    // Portrait screens see less width for the same distance, so back off,
    // and sit the object higher so the callout has the bottom of the screen.
    const aspect = size.width / size.height;
    if (aspect < 1.2) {
      pos.sub(target).multiplyScalar(Math.min(2.6, 1.2 / aspect)).add(target);
      // While the tiles are apart the callout owns the bottom of the screen,
      // so the object sits high; closed, it can sit lower and stay in frame.
      const apart = s.phase === "fracture" || s.phase === "chapters";
      const lift = (1.2 - aspect) * (apart ? 2.1 : 1.1);
      pos.y -= lift;
      target.y -= lift;
    }
    if (forced != null || !started.current) {
      camPos.current.copy(pos);
      camTarget.current.copy(target);
      started.current = true;
    } else {
      const k = 1 - Math.pow(0.0008, delta);
      camPos.current.lerp(pos, k);
      camTarget.current.lerp(target, k);
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camTarget.current);

    // Callouts: project the lit plate's right edge to the screen.
    const els = handles.callouts.current ?? [];
    for (let i = 0; i < PLATE_COUNT; i++) {
      const c = els[i];
      if (!c?.label) continue;
      const g = groups.current[i];
      const vis = i === s.beat ? s.callout : 0;
      c.label.style.opacity = String(vis);
      if (c.line) c.line.style.opacity = String(vis);
      if (c.dot) c.dot.style.opacity = String(vis);
      if (vis <= 0 || !g) continue;
      // Anchor: the plate's right edge, mid-depth, on its top face.
      const anchor = new THREE.Vector3(PLATE.w / 2, PLATE.d / 2, 0);
      g.localToWorld(anchor);
      anchor.project(camera);
      const x = (anchor.x * 0.5 + 0.5) * size.width;
      const y = (-anchor.y * 0.5 + 0.5) * size.height;
      const compact = size.width < 700;
      const labelW = c.label.offsetWidth || 300;
      const labelX = compact
        ? (size.width - labelW) / 2
        : Math.max(x + 64, Math.min(size.width * 0.6, size.width - labelW - 40));
      const labelH = c.label.offsetHeight || 160;
      const labelY = compact ? size.height - labelH - 36 : y;
      c.label.style.transform = compact
        ? `translate(${labelX}px, ${labelY}px)`
        : `translate(${labelX}px, ${labelY}px) translateY(-50%)`;
      if (compact) {
        if (c.line) c.line.style.opacity = "0";
        if (c.dot) c.dot.style.opacity = "0";
        continue;
      }
      if (c.line) {
        c.line.setAttribute("x1", String(x));
        c.line.setAttribute("y1", String(y));
        c.line.setAttribute("x2", String(labelX - 14));
        c.line.setAttribute("y2", String(y));
      }
      if (c.dot) {
        c.dot.setAttribute("cx", String(x));
        c.dot.setAttribute("cy", String(y));
      }
    }
  });

  return (
    <>
      <group ref={stack}>
        {plateRefs.map((r, i) => (
          <Plate key={i} index={i} group={r.group} glass={r.glass} photo={r.photo} />
        ))}
        <mesh ref={thread}>
          <cylinderGeometry args={[0.014, 0.014, 1, 24]} />
          <meshStandardMaterial
            ref={threadMat}
            color="#ff3b3b"
            emissive="#ff2a2a"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      </group>
    </>
  );
}

export default function FilmScene({ handles }: { handles: FilmHandles }) {
  return (
    <Canvas
      camera={{ fov: CAMERA_FOV, position: [0, 0.55, 6.4], near: 0.1, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ width: "100%", height: "100%" }}
    >
      <Studio />
      {/* Key from high left, cool rim from the right, a soft fill from below. */}
      <spotLight position={[-7, 9, -2]} angle={0.55} penumbra={1} intensity={7} color="#fff4ea" />
      <directionalLight position={[5, 3, -5]} intensity={1.4} color="#dfe8ff" />
      <directionalLight position={[0, -3, 4]} intensity={0.3} color="#ffffff" />
      <Rig handles={handles} />
      <EffectComposer>
        <Bloom luminanceThreshold={1.15} mipmapBlur intensity={0.85} radius={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
