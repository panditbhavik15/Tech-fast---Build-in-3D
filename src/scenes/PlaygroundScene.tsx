import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { damp, getWorld } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { paletteFor } from "../config/palette";
import type { PartId, PlaygroundMaterial } from "../config/playground";
import { gearGeometry, glowTexture } from "./lib/textures";

type Controls = ComponentRef<typeof OrbitControls>;

type Props = {
  material: PlaygroundMaterial;
  wireframe: boolean;
  paused: boolean;
  distance: number;
  autoSpin: boolean;
  selected: PartId | null;
  hovered: PartId | null;
  /** Incremented by the reset control; restores the stored camera pose. */
  resetSignal: number;
  /** Written by keyboard controls, consumed and cleared each frame. */
  nudge: { current: { x: number; y: number } };
  onSelect: (id: PartId) => void;
  onHover: (id: PartId | null) => void;
};

const POLAR_LIMIT = 0.85;
const TARGET: [number, number, number] = [0, 0.1, 0];

/**
 * The interactive playground object. Orbiting is delegated to drei's
 * `OrbitControls` (inertia, touch, clamped pitch), while the panel's distance
 * slider is enforced as a radius on the same camera every frame. Control-panel
 * values arrive as props; per-part emphasis is written straight to the
 * transforms so React does not re-render on the animation tick.
 */
export default function PlaygroundScene({
  material,
  wireframe,
  paused,
  distance,
  autoSpin,
  selected,
  hovered,
  resetSignal,
  nudge,
  onSelect,
  onHover,
}: Props) {
  const { theme, reduceMotion } = useWorldState();
  const palette = paletteFor(theme);

  const controls = useRef<Controls>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const satellites = useRef<THREE.InstancedMesh>(null);
  const satelliteMat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.Points>(null);

  const clock = useRef(0);

  const satelliteCount = 12;
  const ringGeometry = useMemo(() => gearGeometry(18, 2.25, 0.2, 0.22), []);
  const sprite = useMemo(() => glowTexture(), []);
  const glowPositions = useMemo(() => orbitRing(satelliteCount), []);

  const satellitePaths = useMemo(
    () =>
      Array.from({ length: satelliteCount }, (_, index) => ({
        radius: 3.3 + (index % 3) * 0.45,
        phase: (index / satelliteCount) * Math.PI * 2,
        speed: 0.35 + (index % 4) * 0.1,
        tilt: ((index % 5) - 2) * 0.28,
        size: 0.2 + (index % 3) * 0.05,
      })),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      scale: new THREE.Vector3(),
      spherical: new THREE.Spherical(),
    }),
    [],
  );

  useEffect(() => () => ringGeometry.dispose(), [ringGeometry]);

  // Reset view hands control back to OrbitControls' stored pose.
  useEffect(() => {
    if (resetSignal === 0) return;
    controls.current?.reset();
  }, [resetSignal]);

  useFrame((state, rawDelta) => {
    const world = getWorld();
    const delta = world.reduceMotion || paused ? 0 : Math.min(rawDelta, 0.05);
    const step = Math.min(rawDelta, 0.05);
    clock.current += delta;
    const time = clock.current;
    const smooth = damp(step + 0.016, 8);

    if (core.current) {
      core.current.rotation.z += delta * 0.25;
      core.current.rotation.x += delta * 0.09;
      const emphasis = selected === "core" ? 1.1 : hovered === "core" ? 1.05 : 1;
      const breath = 1 + Math.sin(time * 1.5) * 0.022;
      core.current.scale.setScalar(
        THREE.MathUtils.lerp(core.current.scale.x, emphasis * breath, smooth),
      );
    }
    if (ring.current) {
      ring.current.rotation.z -= delta * 0.6;
      ring.current.rotation.y = Math.sin(time * 0.4) * 0.16;
      const emphasis = selected === "ring" ? 1.06 : hovered === "ring" ? 1.03 : 1;
      ring.current.scale.setScalar(THREE.MathUtils.lerp(ring.current.scale.x, emphasis, smooth));
    }

    if (satellites.current) {
      const mesh = satellites.current;
      const isolate = selected === "satellites" || hovered === "satellites";
      satellitePaths.forEach((path, index) => {
        const angle = path.phase + time * path.speed;
        const radius = path.radius + Math.sin(time * 0.8 + index) * 0.22;
        scratch.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * Math.sin(path.tilt),
          Math.sin(angle) * radius * Math.cos(path.tilt),
        );
        scratch.euler.set(angle, angle * 0.6, 0);
        scratch.quat.setFromEuler(scratch.euler);
        scratch.scale.setScalar(path.size * (isolate ? 1.4 : 1));
        scratch.matrix.compose(scratch.position, scratch.quat, scratch.scale);
        mesh.setMatrixAt(index, scratch.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (glow.current) {
      glow.current.rotation.y += delta * 0.05;
      glow.current.rotation.x = Math.sin(time * 0.35) * 0.14;
    }

    if (coreMat.current) {
      const mat = coreMat.current;
      switch (material) {
        case "glass":
          mat.transmission = 0.92;
          mat.thickness = 1.4;
          mat.roughness = 0.08;
          mat.metalness = 0;
          mat.color.set(theme === "dark" ? "#dbe6ff" : "#b9c6dd");
          mat.emissiveIntensity = 0.05;
          break;
        case "emissive":
          mat.transmission = 0;
          mat.thickness = 0;
          mat.roughness = 0.35;
          mat.metalness = 0.2;
          mat.color.set(palette.emissive);
          mat.emissiveIntensity = (selected === "core" ? 1.5 : 0.9) * palette.emissiveBoost;
          break;
        case "matte":
          mat.transmission = 0;
          mat.thickness = 0;
          mat.roughness = 0.92;
          mat.metalness = 0.05;
          mat.color.set(theme === "dark" ? "#8d94a3" : "#c2c7d2");
          mat.emissiveIntensity = 0.06;
          break;
        default:
          mat.transmission = 0;
          mat.thickness = 0;
          mat.roughness = 0.2;
          mat.metalness = 1;
          mat.color.set(palette.metal);
          mat.emissiveIntensity = selected === "core" ? 0.45 : 0.12;
      }
      mat.emissive.set(palette.accent);
      mat.wireframe = wireframe;
      mat.envMapIntensity = palette.envIntensity * 1.6;
    }
    if (ringMat.current) {
      ringMat.current.color.set(palette.ring);
      ringMat.current.emissive.set(palette.accent);
      ringMat.current.emissiveIntensity =
        (selected === "ring" ? 0.6 : hovered === "ring" ? 0.35 : 0.12) * palette.emissiveBoost;
      ringMat.current.wireframe = wireframe;
    }
    if (satelliteMat.current) {
      satelliteMat.current.color.set(palette.metalDark);
      satelliteMat.current.emissive.set(palette.violet);
      satelliteMat.current.emissiveIntensity =
        (selected === "satellites" ? 0.85 : hovered === "satellites" ? 0.5 : 0.22) *
        palette.emissiveBoost;
      satelliteMat.current.wireframe = wireframe;
    }

    const rig = controls.current;
    if (rig) {
      // Keyboard orbiting: rotate the camera about the target in spherical space.
      if (nudge.current.x !== 0 || nudge.current.y !== 0) {
        scratch.position.copy(state.camera.position).sub(rig.target);
        scratch.spherical.setFromVector3(scratch.position);
        scratch.spherical.theta += nudge.current.x;
        scratch.spherical.phi = THREE.MathUtils.clamp(
          scratch.spherical.phi + nudge.current.y,
          Math.PI / 2 - POLAR_LIMIT,
          Math.PI / 2 + POLAR_LIMIT,
        );
        scratch.spherical.makeSafe();
        scratch.position.setFromSpherical(scratch.spherical);
        state.camera.position.copy(rig.target).add(scratch.position);
        nudge.current.x = 0;
        nudge.current.y = 0;
        rig.update();
      }

      // The panel owns the radius; OrbitControls owns the direction.
      scratch.position.copy(state.camera.position).sub(rig.target);
      const radius = scratch.position.length();
      const next = THREE.MathUtils.lerp(radius, distance, damp(step + 0.016, 4));
      if (Math.abs(next - radius) > 0.002) {
        scratch.position.multiplyScalar(next / Math.max(radius, 0.001));
        state.camera.position.copy(rig.target).add(scratch.position);
      }
    }
  });

  return (
    <>
      <group>
        <mesh
          ref={core}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover("core");
          }}
          onPointerOut={() => onHover(null)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect("core");
          }}
        >
          <torusKnotGeometry args={[1.05, 0.34, 160, 24]} />
          <meshPhysicalMaterial
            ref={coreMat}
            color={palette.metal}
            metalness={1}
            roughness={0.2}
            clearcoat={0.4}
            clearcoatRoughness={0.25}
            envMapIntensity={1.6}
          />
        </mesh>

        <mesh
          ref={ring}
          geometry={ringGeometry}
          rotation={[Math.PI / 2, 0, 0]}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover("ring");
          }}
          onPointerOut={() => onHover(null)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect("ring");
          }}
        >
          <meshStandardMaterial
            ref={ringMat}
            color={palette.ring}
            metalness={0.95}
            roughness={0.26}
            emissive={palette.accent}
            emissiveIntensity={0.12}
          />
        </mesh>

        <instancedMesh
          ref={satellites}
          args={[undefined, undefined, satelliteCount]}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHover("satellites");
          }}
          onPointerOut={() => onHover(null)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect("satellites");
          }}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            ref={satelliteMat}
            color={palette.metalDark}
            metalness={0.8}
            roughness={0.3}
            emissive={palette.violet}
            emissiveIntensity={0.2}
            flatShading
          />
        </instancedMesh>

        <points ref={glow}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.16}
            map={sprite}
            color={palette.particle}
            transparent
            opacity={0.7}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>

      <ambientLight intensity={theme === "dark" ? 0.4 : 0.85} />
      <directionalLight
        position={[4, 6, 6]}
        intensity={theme === "dark" ? 1.6 : 2.2}
        color={palette.keyLight}
      />
      <directionalLight position={[-6, -2, -4]} intensity={0.7} color={palette.fillLight} />

      <OrbitControls
        makeDefault
        ref={controls}
        target={TARGET}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        autoRotate={autoSpin && !paused && !reduceMotion}
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 2 - POLAR_LIMIT}
        maxPolarAngle={Math.PI / 2 + POLAR_LIMIT}
      />
    </>
  );
}

function orbitRing(segments: number) {
  const total = segments * 12;
  const values = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2;
    const radius = 2.9 + Math.sin(angle * 6) * 0.18;
    values[i * 3] = Math.cos(angle) * radius;
    values[i * 3 + 1] = Math.sin(angle * 3) * 0.35;
    values[i * 3 + 2] = Math.sin(angle) * radius;
  }
  return values;
}
