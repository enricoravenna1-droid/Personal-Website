"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLOBE_RADIUS } from "@/lib/arc";

/**
 * How far the tallest mountain pushes off the sphere.
 *
 * Real relief is imperceptible at globe scale: Everest is 0.14% of Earth's
 * radius, which here is 0.0014 units, well under a pixel. Every globe you
 * have ever seen that reads as having terrain exaggerates it. 0.035 is
 * roughly 25x actual and is where the Rockies and Andes catch the light
 * without the silhouette turning into a golf ball.
 */
export const ELEVATION_SCALE = 0.035;

/**
 * The Earth: a displaced sphere, a cloud shell, and an atmosphere shell.
 *
 * Hand-written shaders rather than meshStandardMaterial for one reason: the
 * day/night terminator. A standard material lights the sphere and that is all
 * it can do, so the dark side goes black and the city lights have nowhere to
 * live. Here the lit fraction is computed once and used to cross-fade between
 * two entirely different images, which is the visual premise of the sequence.
 */

const DAY = "/textures/earth-color.jpg";
const NIGHT = "/textures/earth-night.jpg";
const ELEV = "/textures/earth-elev.jpg";
const CLOUDS = "/textures/earth-clouds.jpg";


/**
 * Cloud drift, rad/s. The only thing on the planet that moves on its own.
 * Slow enough to read as weather rather than as a spinning globe.
 */
const CLOUD_DRIFT = 0.006;

const vertexShader = /* glsl */ `
  uniform sampler2D uElev;
  uniform float uElevScale;
  uniform float uSeaLevel;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying float vElev;

  void main() {
    vUv = uv;

    float e = texture2D(uElev, uv).r;
    vElev = e;

    // Only land displaces. GEBCO encodes bathymetry in the same channel, so
    // displacing by the raw value would push the ocean floor out through the
    // surface and turn every abyssal plain into a mountain range.
    float land = max(e - uSeaLevel, 0.0) / max(1.0 - uSeaLevel, 0.0001);

    vec3 displaced = position + normal * (land * uElevScale);

    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uElev;
  uniform vec3 uSunDir;
  uniform float uSeaLevel;
  uniform float uNightBoost;
  uniform float uIgnite;
  uniform float uArrive;
  uniform float uRelief;
  uniform vec2 uElevTexel;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying float vElev;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    vec3 L = normalize(uSunDir);

    float water = 1.0 - smoothstep(uSeaLevel - 0.012, uSeaLevel + 0.012, vElev);

    // ── Terrain normals from the height field ────────────────────────────
    // The mesh is only 256x128, far too coarse for the displacement alone to
    // produce visible mountains. Sampling the height map's slope per pixel
    // and bending the normal gives every ridge and range real shading at no
    // extra geometry. This is what makes the surface look like land instead
    // of like a photograph wrapped around a ball.
    float hL = texture2D(uElev, vUv - vec2(uElevTexel.x, 0.0)).r;
    float hR = texture2D(uElev, vUv + vec2(uElevTexel.x, 0.0)).r;
    float hD = texture2D(uElev, vUv - vec2(0.0, uElevTexel.y)).r;
    float hU = texture2D(uElev, vUv + vec2(0.0, uElevTexel.y)).r;

    // Tangent basis on the sphere. The guard matters: cross(up, N) collapses
    // at the poles, and a zero-length tangent turns Antarctica into NaNs.
    vec3 up = abs(N.y) > 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 T = normalize(cross(up, N));
    vec3 B = cross(N, T);

    vec3 Nland = normalize(N - (T * (hR - hL) + B * (hU - hD)) * uRelief);
    // Oceans are flat. Bending their normals by seafloor terrain would light
    // mid-ocean ridges that are four kilometres underwater.
    vec3 Ns = normalize(mix(Nland, N, water));

    vec3 day = texture2D(uDay, vUv).rgb;
    vec3 night = texture2D(uNight, vUv).rgb;

    // Soft terminator, computed on the smooth normal so the day/night line
    // stays a clean curve instead of crawling over every mountain.
    float lit = smoothstep(-0.20, 0.30, dot(N, L));
    // Surface shading uses the bumped normal. This is the mountain relief.
    float shade = clamp(dot(Ns, L), 0.0, 1.0);

    // Grade NASA's warm daylight toward the site's navy so the globe belongs
    // to this page rather than looking like a stock texture demo.
    vec3 dayC = mix(day, day * vec3(0.70, 0.84, 1.14), 0.55);
    dayC = mix(dayC, dayC * vec3(0.30, 0.52, 0.98), water * 0.60);
    dayC *= 0.55 + shade * 0.75;

    // Sun glint, water only. Land is rough and should not shine.
    //
    // Exponent raised from 90 and strength cut from 0.65: at AJ2054's fixed
    // camera distance the highlight was a small sparkle, but this sequence
    // flies in to 2.95 radii, and at that range the same lobe covered a
    // quarter of the Atlantic as a flat grey smudge. Tighter and dimmer reads
    // as a glint at every distance in the arc.
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 190.0) * water * lit;

    // City lights, warmed. uIgnite lets beat 3 push them without touching day.
    vec3 nightC = night * vec3(1.0, 0.80, 0.52) * uNightBoost * (1.0 + uIgnite * 1.6);
    // A trace of blue on the unlit side. Real night is never truly black;
    // pure black reads as a hole cut in the image.
    nightC += vec3(0.012, 0.026, 0.055) * (1.0 - water * 0.4);

    vec3 col = mix(nightC, dayC, lit) + spec * 0.28;

    // Limb brightening, so the sphere reads as a body with air on it.
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    col += vec3(0.16, 0.38, 0.88) * rim * 0.55;

    // Arrival. The camera closes on the globe from 9.2 radii while the hero
    // is still dissolving over it, and a planet at full brightness behind a
    // half-faded hero is two images fighting. uArrive holds the globe near
    // black through the first part of the approach and brings it up as the
    // hero clears, so what the eye sees is one image replacing another rather
    // than two overlapping. The limb is exempted (added back at 0.35) because
    // that thin bright edge is the first thing that should be legible — it is
    // what tells you a body is arriving at all.
    col *= mix(0.04, 1.0, uArrive);
    col += vec3(0.16, 0.38, 0.88) * rim * 0.35 * (1.0 - uArrive);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const cloudVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const cloudFragment = /* glsl */ `
  uniform sampler2D uClouds;
  uniform vec3 uSunDir;
  uniform float uOpacity;
  uniform float uArrive;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float c = texture2D(uClouds, vUv).r;

    float lit = smoothstep(-0.25, 0.35, dot(N, normalize(uSunDir)));

    // Cloud tops catch more light than the ground below them, and they go
    // properly dark at night rather than glowing over the city lights.
    vec3 col = vec3(1.0, 0.99, 0.97) * (0.06 + lit * 1.05);

    // Fade the shell out at the silhouette. Without this the cloud sphere
    // ends in a hard circle a few pixels outside the planet.
    float edge = smoothstep(0.0, 0.35, dot(N, V));

    gl_FragColor = vec4(col, c * uOpacity * (0.10 + lit * 0.90) * edge * uArrive);
    #include <colorspace_fragment>
  }
`;

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosW = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDir;
  uniform float uArrive;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);

    // Inverted fresnel: this shell is rendered BackSide, so the glow belongs
    // where the surface faces away from the eye.
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);

    // Scattering is strongest on the day limb. Without this the halo sits
    // evenly around the disc and the globe looks like a sticker.
    float sun = smoothstep(-0.55, 0.6, dot(N, normalize(uSunDir)));

    // Warm the forward-scattering edge slightly, the way a real sunrise limb
    // goes gold before it goes blue.
    vec3 tint = mix(uColor, vec3(1.0, 0.72, 0.45), pow(sun, 6.0) * 0.35);

    // The halo leads the arrival rather than tracking it: at uArrive 0 it is
    // already at 45% strength, so the first thing that resolves out of the
    // dark behind the hero is a rim of atmosphere, not a grey ball.
    float a = fres * (0.28 + sun * 0.85) * mix(0.45, 1.0, uArrive);
    gl_FragColor = vec4(tint, a);
  }
`;

/**
 * Sphere tessellation, per frame size.
 *
 * The main sphere is the one that matters: its vertex shader does a texture
 * fetch per vertex to displace terrain, so 256x128 is 33k dependent texture
 * reads every frame. Halving each axis on a phone cuts that to 8k.
 *
 * What is *not* lost by doing so is the mountains. Relief here comes from
 * per-pixel normals derived from the height map in the fragment shader, which
 * is independent of tessellation; the geometry only carries the silhouette and
 * the broad displacement. A lower count softens the edge of the disc slightly
 * and nothing else, and the atmosphere shell sits outside that edge anyway.
 */
const SEGMENTS = {
  wide: { earth: [256, 128], clouds: [128, 64], atmosphere: [96, 48] },
  compact: { earth: [128, 64], clouds: [96, 48], atmosphere: [64, 32] },
} as const;

type Props = {
  /**
   * Live scroll progress, 0..1. A ref rather than a prop value on purpose:
   * this updates every frame, and re-rendering a WebGL tree sixty times a
   * second to move a camera is how a smooth scene turns into a slideshow.
   */
  progress: React.RefObject<number>;
  /** Approach progress, 0..1 across the overlap with the departing hero. */
  entry: React.RefObject<number>;
  reducedMotion: boolean;
  compact: boolean;
};

export function GlobeEarth({ progress, entry, reducedMotion, compact }: Props) {
  const seg = compact ? SEGMENTS.compact : SEGMENTS.wide;

  const [dayMap, nightMap, elevMap, cloudMap] = useLoader(THREE.TextureLoader, [
    DAY,
    NIGHT,
    ELEV,
    CLOUDS,
  ]);

  const group = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const cloudMat = useRef<THREE.ShaderMaterial>(null);
  const atmoMat = useRef<THREE.ShaderMaterial>(null);

  // Accumulated cloud angle.
  const spin = useRef(0);

  useMemo(() => {
    // Colour maps are authored in sRGB; the elevation map is data and must
    // stay linear or the displacement picks up a gamma curve and the
    // continents come out subtly the wrong height.
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    elevMap.colorSpace = THREE.NoColorSpace;

    for (const t of [dayMap, nightMap, elevMap, cloudMap]) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.anisotropy = 8;
    }
  }, [dayMap, nightMap, elevMap, cloudMap]);

  const sunDir = useMemo(
    () => new THREE.Vector3(1, 0.25, 0.6).normalize(),
    [],
  );

  const uniforms = useMemo(
    () => ({
      uDay: { value: dayMap },
      uNight: { value: nightMap },
      uElev: { value: elevMap },
      uElevScale: { value: ELEVATION_SCALE },
      // Tuned against the GEBCO ramp: this is where its grey crosses 0m.
      uSeaLevel: { value: 0.503 },
      uSunDir: { value: sunDir },
      uNightBoost: { value: 1.35 },
      uIgnite: { value: 0 },
      uArrive: { value: 0 },
      // Slope gain for the derived normals. Purely aesthetic.
      uRelief: { value: 22.0 },
      uElevTexel: { value: new THREE.Vector2(1 / 2048, 1 / 1024) },
    }),
    [dayMap, nightMap, elevMap, sunDir],
  );

  const cloudUniforms = useMemo(
    () => ({
      uClouds: { value: cloudMap },
      uSunDir: { value: sunDir },
      uOpacity: { value: 0.62 },
      uArrive: { value: 0 },
    }),
    [cloudMap, sunDir],
  );

  const atmoUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#3f85f6") },
      uSunDir: { value: sunDir },
      uArrive: { value: 0 },
    }),
    [sunDir],
  );

  useFrame((_, delta) => {
    const p = progress.current ?? 0;

    /**
     * Arrival ramp. Smoothstep across the middle of the approach rather than
     * a linear fade: the ends are the parts that must not be noticed — one is
     * behind an opaque hero, the other has to land on full brightness exactly
     * as the beats begin — and a linear ramp has visible corners at both.
     */
    const e = Math.min(1, Math.max(0, ((entry.current ?? 0) - 0.15) / 0.7));
    const arrive = e * e * (3 - 2 * e);

    /**
     * City lights come up as the sequence starts and stay up. `uIgnite`
     * cross-fades the night texture in over the day one on the unlit side.
     */
    if (mat.current) {
      mat.current.uniforms.uIgnite.value = Math.min(1, Math.max(0, (p - 0.01) / 0.12));
      mat.current.uniforms.uArrive.value = arrive;
    }
    if (cloudMat.current) cloudMat.current.uniforms.uArrive.value = arrive;
    if (atmoMat.current) atmoMat.current.uniforms.uArrive.value = arrive;
    if (!group.current) return;

    /**
     * The ground does not move. At all.
     *
     * AJ2054's globe spins and locks North America to a fixed camera. Here
     * the camera is the thing that moves, and it is aimed with `latLonToVec3`
     * in *world* space — so any rotation on this group slides the geography
     * out from under it. The first build kept a slow 0.008 rad/s drift for
     * life, and beat 2 duly framed Newfoundland instead of Atlanta: the
     * camera was pointed exactly where it was told, at ground that had moved.
     *
     * The life comes from the clouds instead, which are weather and are
     * allowed to move independently of the coastlines.
     */
    group.current.rotation.y = 0;

    if (clouds.current && !reducedMotion) {
      spin.current += delta * CLOUD_DRIFT;
      clouds.current.rotation.y = spin.current;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, seg.earth[0], seg.earth[1]]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>

      {/* Clouds sit just above the highest terrain, which tops out at
          1 + ELEVATION_SCALE. Any lower and the Himalayas poke through. */}
      <mesh ref={clouds} scale={1 + ELEVATION_SCALE + 0.008}>
        <sphereGeometry args={[GLOBE_RADIUS, seg.clouds[0], seg.clouds[1]]} />
        <shaderMaterial
          ref={cloudMat}
          uniforms={cloudUniforms}
          vertexShader={cloudVertex}
          fragmentShader={cloudFragment}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Outermost shell, and it has to stay that way: the cloud sphere now
          sits at 1.043, so an atmosphere at the old 1.028 would have been
          rendering *inside* the weather. */}
      <mesh scale={1.075}>
        <sphereGeometry args={[GLOBE_RADIUS, seg.atmosphere[0], seg.atmosphere[1]]} />
        <shaderMaterial
          ref={atmoMat}
          uniforms={atmoUniforms}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
