import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { paletteFor, qualityTiers } from "../config/palette";
import { damp, getWorld, motion } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { glowTexture } from "./lib/textures";

type HazeTint = "accent" | "violet" | "particle";

/**
 * Deep-field haze parked behind the corridor. Each band sits at a different
 * depth along the journey so at least one is always in frame, and each breathes
 * on its own phase so the background never pulses in lockstep.
 */
const HAZE_BANDS: { position: [number, number, number]; size: number; tint: HazeTint; phase: number }[] =
  [
    { position: [-30, 6, -60], size: 78, tint: "accent", phase: 0 },
    { position: [26, -26, -66], size: 92, tint: "violet", phase: 2.1 },
    { position: [-14, -56, -58], size: 70, tint: "particle", phase: 4.3 },
  ];

/** How far each band wanders from its parked point, in world units. */
const HAZE_DRIFT = 9;

/**
 * The living background: drifting motes and breathing haze behind the narrative
 * objects. Both are fog-exempt and depth-write-free so they read as atmosphere
 * rather than geometry, and both collapse to a still frame under
 * `prefers-reduced-motion`.
 */
export default function AmbientBackdrop() {
  const { quality, theme } = useWorldState();
  const tiers = qualityTiers[quality];
  const palette = paletteFor(theme);

  const dust = useRef<THREE.Points>(null);
  const dustMat = useRef<THREE.PointsMaterial>(null);
  const haze = useRef<(THREE.Sprite | null)[]>([]);

  const sprite = useMemo(() => glowTexture(), []);
  const scratch = useMemo(() => ({ color: new THREE.Color() }), []);

  const positions = useMemo(() => {
    const values = new Float32Array(tiers.dust * 3);
    for (let i = 0; i < tiers.dust; i++) {
      values[i * 3] = (Math.random() - 0.5) * 150;
      values[i * 3 + 1] = -Math.random() * 96 + 22;
      // Always downrange of the camera: a mote passing through the near plane
      // would flash a screen-filling blob.
      values[i * 3 + 2] = -Math.random() * 110 - 12;
    }
    return values;
  }, [tiers.dust]);

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const live = world.reduceMotion ? 0 : 1;
    const delta = Math.min(rawDelta, 0.05);
    const time = motion.time;
    const dark = world.theme === "dark";
    const active = paletteFor(world.theme);

    if (dust.current) {
      // Rotation alone reads as stillness in the hero shot: the field is far
      // away, so an angular crawl never crosses a perceptible pixel delta.
      // A sideways current carries individual motes visibly across the frame.
      dust.current.rotation.y += delta * 0.045 * live;
      dust.current.rotation.x += delta * 0.012 * live;
      dust.current.position.set(
        Math.sin(time * 0.16) * 14 * live,
        Math.sin(time * 0.11 + 1.2) * 9 * live,
        Math.cos(time * 0.13) * 8 * live,
      );
      dust.current.scale.setScalar(1 + Math.sin(time * 0.33) * 0.085 * live);
    }
    if (dustMat.current) {
      scratch.color.set(dark ? active.particle : active.ring);
      dustMat.current.color.lerp(scratch.color, damp(delta, 3));
      dustMat.current.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      dustMat.current.size = 1.15 + Math.sin(time * 0.27) * 0.32 * live;
      dustMat.current.opacity = THREE.MathUtils.lerp(
        dustMat.current.opacity,
        (dark ? 0.55 : 0.26) * (0.62 + Math.sin(time * 0.5) * 0.38 * live),
        damp(delta, 3),
      );
    }

    HAZE_BANDS.forEach((band, index) => {
      const node = haze.current[index];
      if (!node) return;
      // Wander on a lazy ellipse, then inhale: position and scale move on
      // different clocks so the bands never sync up.
      node.position.set(
        band.position[0] + Math.sin(time * 0.21 + band.phase) * HAZE_DRIFT * live,
        band.position[1] + Math.cos(time * 0.17 + band.phase * 1.4) * HAZE_DRIFT * 0.8 * live,
        band.position[2] + Math.sin(time * 0.13 + band.phase * 0.6) * 10 * live,
      );
      const swell = 1 + Math.sin(time * 0.3 + band.phase) * 0.2 * live;
      node.scale.set(band.size * swell, band.size * swell, 1);
      const material = node.material as THREE.SpriteMaterial;
      scratch.color.set(active[band.tint]);
      material.color.lerp(scratch.color, damp(delta, 3));
      material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        (dark ? 0.2 : 0.1) * (0.6 + Math.sin(time * 0.24 + band.phase * 1.7) * 0.4 * live),
        damp(delta, 2),
      );
    });
  });

  return (
    <>
      <points ref={dust} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={dustMat}
          size={1.15}
          map={sprite}
          color={palette.particle}
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </points>

      {HAZE_BANDS.map((band, index) => (
        <sprite
          key={`haze-${band.tint}`}
          ref={(el) => {
            haze.current[index] = el;
          }}
          position={band.position}
          scale={[band.size, band.size, 1]}
        >
          <spriteMaterial
            map={sprite}
            color={palette[band.tint]}
            transparent
            opacity={0.18}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      ))}
    </>
  );
}
