import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import CoreScene from "./HeroScene";
import { clamp01, damp, getWorld, motion } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { paletteFor } from "../config/palette";

type SceneProps = {
  sectionId: string;
  position?: [number, number, number];
  /** Finale keeps the converged composition settled instead of re-exploding it. */
  settled?: boolean;
};

/**
 * Chapter 05 / finale — the visual climax. Shards that stood for neural
 * clusters, gear teeth and orbital debris converge onto one structure, the
 * rings synchronise, and a light intensifies as the composition locks.
 */
export default function InnovationScene({ sectionId, position = [0, 0, 0], settled = false }: SceneProps) {
  const { quality } = useWorldState();
  const group = useRef<THREE.Group>(null);
  const shards = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const shardMat = useRef<THREE.MeshStandardMaterial>(null);
  const shellMat = useRef<THREE.MeshBasicMaterial>(null);

  const count = quality === "low" ? 60 : quality === "medium" ? 100 : 150;

  const layout = useMemo(() => {
    const scatter: THREE.Vector3[] = [];
    const locked: THREE.Vector3[] = [];
    const spin = new Float32Array(count);
    const delay = new Float32Array(count);
    const eulers: THREE.Euler[] = [];

    for (let i = 0; i < count; i++) {
      // Fibonacci sphere for an even scattered cloud.
      const t = (i + 0.5) / count;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 7.5 + Math.sin(i * 12.9898) * 3.2;
      scatter.push(
        new THREE.Vector3(
          Math.sin(inclination) * Math.cos(azimuth) * radius,
          Math.cos(inclination) * radius * 0.75,
          Math.sin(inclination) * Math.sin(azimuth) * radius,
        ),
      );

      // Locked form: two stacked rings plus a vertical lattice.
      const ring = i % 3;
      const per = Math.ceil(count / 3);
      const angle = ((i % per) / per) * Math.PI * 2;
      const ringRadius = [3.4, 4.4, 2.3][ring];
      const ringY = [1.35, -1.35, 0][ring];
      const flatten = [0.25, 0.25, 1][ring];
      locked.push(
        new THREE.Vector3(
          Math.cos(angle) * ringRadius,
          ringY + Math.sin(angle * 3) * 0.22 * flatten,
          Math.sin(angle) * ringRadius,
        ),
      );

      spin[i] = (Math.random() - 0.5) * 2.4;
      delay[i] = (i / count) * 0.45;
      eulers.push(
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      );
    }
    return { scatter, locked, spin, delay, eulers };
  }, [count]);

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
      color: new THREE.Color(),
      euler: new THREE.Euler(),
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const palette = paletteFor(world.theme);
    const delta = world.reduceMotion ? 0 : Math.min(rawDelta, 0.05);
    const time = motion.time;

    const p = motion.progress[sectionId] ?? 0;
    const intro = clamp01(motion.intro);
    const presence = settled ? intro : intro * clamp01(0.25 + p * 1.6);
    // Convergence curve: scattered -> locked, with a hold once assembled.
    const rawConverge = settled ? 1 : clamp01((p - 0.1) / 0.55);
    const converge = settled ? 1 : rawConverge * rawConverge * (3 - 2 * rawConverge);

    if (group.current) {
      group.current.visible = presence > 0.01;
      // Slow buoyant drift so the composition never sits dead still.
      group.current.position.set(
        position[0] + Math.sin(time * 0.21) * 0.5,
        position[1] + Math.sin(time * 0.29) * 0.45,
        position[2] + Math.cos(time * 0.17) * 0.5,
      );
      group.current.rotation.y += delta * (0.1 + converge * 0.08);
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        motion.pointerSmoothed.y * 0.1,
        damp(delta, 2),
      );
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(group.current.scale.x, 0.9 + converge * 0.14, damp(delta, 3)),
      );
    }

    if (shards.current) {
      const mesh = shards.current;
      for (let i = 0; i < count; i++) {
        const start = layout.scatter[i];
        const end = layout.locked[i];
        const local = clamp01((converge - layout.delay[i]) / (1 - layout.delay[i]));
        const eased = local * local * (3 - 2 * local);
        // Assembled shards keep orbiting, spinning and breathing: the locked
        // form is a running machine, never a still frame.
        const wave = Math.sin(time * 0.7 + i * 0.83);
        scratch.position.lerpVectors(start, end, eased);
        scratch.position.multiplyScalar(1 + wave * 0.035 * eased);
        scratch.position.y += Math.cos(time * 0.5 + i * 0.4) * 0.24 * eased;
        scratch.euler.set(
          layout.eulers[i].x + layout.spin[i] * time * (0.4 + 0.6 * (1 - eased)),
          layout.eulers[i].y + time * (0.2 + 0.18 * (1 - eased)),
          layout.eulers[i].z + wave * 0.45 * eased,
        );
        scratch.quat.setFromEuler(scratch.euler);
        const size = (0.16 + (i % 4) * 0.035) * presence * (0.7 + eased * 0.3);
        scratch.scale.setScalar(Math.max(size, 0.0001));
        scratch.matrix.compose(scratch.position, scratch.quat, scratch.scale);
        mesh.setMatrixAt(i, scratch.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (shell.current) {
      shell.current.rotation.y += delta * 0.16;
      shell.current.rotation.x += delta * 0.07;
      shell.current.rotation.z -= delta * 0.05;
      shell.current.scale.setScalar(1 + Math.sin(time * 0.85) * 0.035);
    }

    if (shardMat.current) {
      scratch.color.set(converge > 0.7 ? palette.accent : palette.metal);
      shardMat.current.color.lerp(scratch.color, damp(delta, 2));
      scratch.color.set(palette.emissive);
      shardMat.current.emissive.lerp(scratch.color, damp(delta, 3));
      shardMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        shardMat.current.emissiveIntensity,
        palette.emissiveBoost * (0.12 + converge * 0.5) * presence,
        damp(delta, 3),
      );
    }
    if (shellMat.current) {
      scratch.color.set(palette.violet);
      shellMat.current.color.lerp(scratch.color, damp(delta, 3));
      shellMat.current.opacity = THREE.MathUtils.lerp(
        shellMat.current.opacity,
        (world.theme === "dark" ? 0.2 : 0.12) * presence * (0.4 + converge * 0.6),
        damp(delta, 4),
      );
    }
    if (light.current) {
      // Lighting intensifies subtly as the core completes.
      light.current.intensity = THREE.MathUtils.lerp(
        light.current.intensity,
        (world.theme === "dark" ? 55 : 18) * presence * (0.35 + converge * 0.65) *
          (0.9 + Math.sin(time * 1.1) * 0.1),
        damp(delta, 3),
      );
    }
  });

  return (
    <group ref={group} position={position}>
      <CoreScene sectionId={sectionId} position={[0, 0, 0]} scale={0.78} hold intensity={1.35} />

      <instancedMesh
        ref={shards}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        key={count}
      >
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={shardMat}
          color="#c8ccd6"
          emissive="#2e7bff"
          emissiveIntensity={0.3}
          metalness={0.85}
          roughness={0.3}
          flatShading
        />
      </instancedMesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[5.6, 1]} />
        <meshBasicMaterial
          ref={shellMat}
          color="#7c5cff"
          wireframe
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>

      <pointLight ref={light} position={[0, 0, 3]} intensity={0} distance={30} decay={1.8} />
    </group>
  );
}
