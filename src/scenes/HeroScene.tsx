import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { clamp01, damp, getWorld, motion, window4 } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { paletteFor } from "../config/palette";
import { glowTexture } from "./lib/textures";

type CoreSceneProps = {
  /** Narrative section whose scroll progress animates this composition. */
  sectionId: string;
  /**
   * A second section that keeps the object alive. Chapter 01 shares the hero's
   * core, and the hero sits above it in the document, so its own progress is
   * still zero on first paint.
   */
  alsoVisibleFor?: string;
  position?: [number, number, number];
  scale?: number;
  /** Keeps the object revealed instead of fading it out at the end of a section. */
  hold?: boolean;
  /** Multiplies orbital motion, used for the climax and finale. */
  intensity?: number;
};

const RING_TILT: [number, number, number][] = [
  [0, 0, 0.35],
  [1.15, 0.2, -0.4],
  [-0.75, 0.5, 0.9],
];

const RING_RADIUS = [2.5, 3.15, 3.9];

/**
 * The signature object: a faceted metallic core with three independently
 * orbiting rings, an emissive shell and particles bound to ring paths.
 * Entirely procedural — no external model or texture is loaded.
 */
export default function CoreScene({
  sectionId,
  alsoVisibleFor,
  position = [0, 0, 0],
  scale = 1,
  hold = false,
  intensity = 1,
}: CoreSceneProps) {
  const { quality } = useWorldState();
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const ringMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const glowRings = useRef<(THREE.Mesh | null)[]>([]);
  const glowMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const points = useRef<THREE.Points>(null);

  const metalMat = useRef<THREE.MeshStandardMaterial>(null);
  const innerMat = useRef<THREE.MeshStandardMaterial>(null);
  const wireMat = useRef<THREE.MeshBasicMaterial>(null);
  const pointMat = useRef<THREE.PointsMaterial>(null);

  const scratch = useMemo(
    () => ({
      color: new THREE.Color(),
      vec: new THREE.Vector3(),
      euler: new THREE.Euler(),
      quat: new THREE.Quaternion(),
    }),
    [],
  );

  const orbitCount = quality === "low" ? 150 : quality === "medium" ? 240 : 320;
  const orbit = useMemo(() => {
    const ring = new Float32Array(orbitCount);
    const phase = new Float32Array(orbitCount);
    const offset = new Float32Array(orbitCount);
    const positions = new Float32Array(orbitCount * 3);
    for (let i = 0; i < orbitCount; i++) {
      ring[i] = i % 3;
      phase[i] = Math.random() * Math.PI * 2;
      offset[i] = (Math.random() - 0.5) * 0.5;
    }
    return { ring, phase, offset, positions };
  }, [orbitCount]);

  const sprite = useMemo(() => glowTexture(), []);

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const palette = paletteFor(world.theme);
    const delta = world.reduceMotion ? 0 : Math.min(rawDelta, 0.05);
    const time = motion.time;

    const p = motion.progress[sectionId] ?? 0;
    const shared = alsoVisibleFor ? (motion.progress[alsoVisibleFor] ?? 0) : 0;
    const intro = clamp01(motion.intro);
    const reveal = hold
      ? clamp01(p / 0.3)
      : Math.max(window4(p, 0.16, 0.5, 0.34), window4(shared, 0.16, 0.5, 0.34));
    const presence = hold ? intro : intro * reveal;

    if (group.current) {
      group.current.visible = presence > 0.01;
      const target = scale * (0.55 + presence * 0.45);
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(group.current.scale.x, target, damp(delta, 5)),
      );
      group.current.rotation.y += delta * 0.12 * intensity;
      // Cursor-responsive tilt, damped so it never fights the scroll motion.
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        motion.pointerSmoothed.y * 0.22,
        damp(delta, 2.5),
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        -motion.pointerSmoothed.x * 0.16,
        damp(delta, 2.5),
      );
    }

    if (shell.current) {
      shell.current.rotation.y -= delta * 0.25;
      shell.current.rotation.x = Math.sin(time * 0.5) * 0.12;
    }
    if (inner.current) {
      inner.current.rotation.x += delta * 0.4;
      inner.current.rotation.y += delta * 0.55;
      inner.current.scale.setScalar(1 + Math.sin(time * 1.6) * 0.03);
    }
    if (wire.current) {
      wire.current.rotation.y += delta * 0.1;
      wire.current.rotation.z -= delta * 0.06;
    }

    // Rings separate as the chapter progresses, then synchronise when held.
    RING_RADIUS.forEach((baseRadius, index) => {
      const ring = rings.current[index];
      if (!ring) return;
      const spin = (0.25 + index * 0.18) * intensity;
      const tilt = RING_TILT[index];
      const sync = hold ? 1 : 0.35 + reveal * 0.65;
      ring.rotation.x = tilt[0] + time * spin * 0.35 * sync;
      ring.rotation.y = tilt[1] + time * spin * sync;
      ring.rotation.z = tilt[2];
      const wobble = Math.sin(time * 0.6 + index * 1.2) * 0.022;
      const factor = (baseRadius * (1 + reveal * 0.3 + p * 0.08 + wobble)) / baseRadius;
      ring.scale.setScalar(factor);
      const glow = glowRings.current[index];
      if (glow) glow.scale.setScalar(factor);
    });

    if (points.current) {
      const attr = points.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < orbitCount; i++) {
        const ringIndex = orbit.ring[i];
        const radius = RING_RADIUS[ringIndex] * (1 + reveal * 0.3) + orbit.offset[i];
        const speed = (0.35 + ringIndex * 0.22) * intensity;
        const angle = orbit.phase[i] + time * speed;
        scratch.vec.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        scratch.euler.set(RING_TILT[ringIndex][0], RING_TILT[ringIndex][1], RING_TILT[ringIndex][2]);
        scratch.quat.setFromEuler(scratch.euler);
        scratch.vec.applyQuaternion(scratch.quat);
        attr.setXYZ(i, scratch.vec.x, scratch.vec.y, scratch.vec.z);
      }
      attr.needsUpdate = true;
    }

    // Palette transitions without rebuilding materials.
    if (metalMat.current) {
      scratch.color.set(palette.metal);
      metalMat.current.color.lerp(scratch.color, damp(delta, 3));
      metalMat.current.envMapIntensity = THREE.MathUtils.lerp(
        metalMat.current.envMapIntensity,
        palette.envIntensity * 1.4,
        damp(delta, 3),
      );
    }
    ringMats.current.forEach((mat) => {
      if (!mat) return;
      scratch.color.set(palette.ring);
      mat.color.lerp(scratch.color, damp(delta, 3));
    });
    glowMats.current.forEach((mat) => {
      if (!mat) return;
      scratch.color.set(palette.accent);
      mat.color.lerp(scratch.color, damp(delta, 3));
      mat.opacity = THREE.MathUtils.lerp(
        mat.opacity,
        (world.theme === "dark" ? 0.5 : 0.26) * presence,
        damp(delta, 4),
      );
    });
    if (innerMat.current) {
      scratch.color.set(palette.emissive);
      innerMat.current.color.lerp(scratch.color, damp(delta, 3));
      innerMat.current.emissive.lerp(scratch.color, damp(delta, 3));
      innerMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        innerMat.current.emissiveIntensity,
        palette.emissiveBoost * (0.8 + Math.sin(time * 1.2) * 0.2),
        damp(delta, 3),
      );
    }
    if (wireMat.current) {
      scratch.color.set(palette.accent);
      wireMat.current.color.lerp(scratch.color, damp(delta, 3));
      wireMat.current.opacity = THREE.MathUtils.lerp(
        wireMat.current.opacity,
        0.16 * presence,
        damp(delta, 4),
      );
    }
    if (pointMat.current) {
      scratch.color.set(palette.particle);
      pointMat.current.color.lerp(scratch.color, damp(delta, 3));
      pointMat.current.opacity = THREE.MathUtils.lerp(
        pointMat.current.opacity,
        0.85 * presence,
        damp(delta, 4),
      );
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshStandardMaterial
          ref={metalMat}
          color="#c8ccd6"
          metalness={0.96}
          roughness={0.22}
          flatShading
          envMapIntensity={1.2}
        />
      </mesh>

      <mesh ref={inner}>
        <octahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial
          ref={innerMat}
          color="#2e7bff"
          emissive="#2e7bff"
          emissiveIntensity={1.4}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>

      <mesh ref={wire}>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial ref={wireMat} color="#2e7bff" wireframe transparent opacity={0.14} />
      </mesh>

      {RING_RADIUS.map((radius, index) => (
        <mesh
          key={`ring-${radius}`}
          ref={(el) => {
            rings.current[index] = el;
          }}
        >
          <torusGeometry args={[radius, 0.032, 8, 128]} />
          <meshStandardMaterial
            ref={(el) => {
              ringMats.current[index] = el;
            }}
            color="#aab2c2"
            metalness={0.9}
            roughness={0.28}
            envMapIntensity={1.1}
          />
        </mesh>
      ))}

      {RING_RADIUS.map((radius, index) => (
        <mesh
          key={`glow-${radius}`}
          ref={(el) => {
            glowRings.current[index] = el;
          }}
          rotation={[0, 0, index * 0.4]}
        >
          <torusGeometry args={[radius * 1.02, 0.008, 6, 128]} />
          <meshBasicMaterial
            ref={(el) => {
              glowMats.current[index] = el;
            }}
            color="#2e7bff"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbit.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointMat}
          size={0.085}
          map={sprite}
          color="#9fb2d0"
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
