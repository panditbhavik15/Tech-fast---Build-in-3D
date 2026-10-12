import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { chapters } from "../config/site";
import { paletteFor, qualityTiers } from "../config/palette";
import { damp, getWorld, motion, setWorld } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { glowTexture } from "./lib/textures";
import AmbientBackdrop from "./AmbientBackdrop";
import CoreScene from "./HeroScene";
import AIScene from "./AIScene";
import RoboticsScene from "./RoboticsScene";
import SpaceScene from "./SpaceScene";
import InnovationScene from "./InnovationScene";
import Effects from "./Effects";

type Shot = { position: [number, number, number]; look: [number, number, number]; dolly: number };

function anchor(id: string): [number, number, number] {
  return chapters.find((chapter) => chapter.id === id)?.anchor ?? [0, 0, 0];
}

/**
 * One camera pose per narrative section. `dolly` is how far the camera travels
 * toward its subject across the section, which is what makes the scroll read
 * as one continuous move instead of a set of fades.
 */
const shots: Record<string, Shot> = {
  hero: { position: [0, 1.1, 17.5], look: [0, 0, 0], dolly: -3.2 },
  ch01: { position: [0, 0.4, 10.2], look: [0, 0, 0], dolly: 3.6 },
  ch02: { position: [26, -1.4, 7.5], look: [26, -4, -8], dolly: 2.8 },
  ch03: { position: [-19, -8.6, 4.5], look: [-26, -12, -10], dolly: 2.4 },
  ch04: { position: [4, -29, 5], look: [4, -34, -18], dolly: 9.5 },
  ch05: { position: [-15.5, -50.5, 11], look: [-18, -54, -6], dolly: 4 },
  finale: { position: [17, -58.5, 20], look: [10, -62, -6], dolly: 8 },
};

const FINALE_ANCHOR: [number, number, number] = [10, -62, -6];

/**
 * On wide screens the opening compositions are framed off-centre so the hero
 * typography owns the left column instead of fighting the object for it.
 */
const WIDE_SHIFT: Record<string, number> = { hero: -3.6, ch01: -3.1 };

/**
 * Portrait stacks the copy at the bottom of the viewport, so the opening
 * compositions are translated down in world space to read above the headline.
 */
const PORTRAIT_SHIFT: Record<string, number> = { hero: -2.9, ch01: -2.6 };

function CameraRig() {
  const { camera } = useThree();
  const aspect = useThree((state) => state.viewport.aspect);
  const buffers = useMemo(
    () => ({
      target: new THREE.Vector3(),
      look: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      current: new THREE.Vector3(0, 1.1, 24),
      currentLook: new THREE.Vector3(0, 0, 0),
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const delta = Math.min(rawDelta, 0.05);
    const shot = shots[world.activeSection] ?? shots.hero;
    const p = motion.progress[world.activeSection] ?? 0;

    buffers.target.set(...shot.position);
    buffers.look.set(...shot.look);
    buffers.direction.copy(buffers.target).sub(buffers.look).normalize();
    buffers.target.addScaledVector(buffers.direction, shot.dolly * (p - 0.5) * 2);
    buffers.target.y += Math.sin(p * Math.PI) * 0.6;

    const shift = aspect > 1.2 ? (WIDE_SHIFT[world.activeSection] ?? 0) : 0;
    buffers.target.x += shift;
    buffers.look.x += shift;

    const lift = aspect <= 1.2 ? (PORTRAIT_SHIFT[world.activeSection] ?? 0) : 0;
    buffers.target.y += lift;
    buffers.look.y += lift;

    // Damping turns a section change into a camera move rather than a cut.
    const lambda = world.reduceMotion ? 30 : 2.6;
    buffers.currentLook.lerp(buffers.look, damp(delta, lambda));
    buffers.current.lerp(buffers.target, damp(delta, lambda * 0.85));

    const drift = world.reduceMotion ? 0 : 1;
    const time = motion.time;
    camera.position.set(
      buffers.current.x + motion.pointerSmoothed.x * 0.9 * drift,
      buffers.current.y + motion.pointerSmoothed.y * 0.55 * drift + Math.sin(time * 0.4) * 0.12 * drift,
      buffers.current.z + Math.sin(time * 0.27) * 0.18 * drift,
    );
    camera.lookAt(buffers.currentLook);
  });

  return null;
}

function StarField() {
  const { quality, theme } = useWorldState();
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const count = qualityTiers[quality].stars;
  const palette = paletteFor(theme);

  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spread along the journey corridor, not a single sphere shell.
      values[i * 3] = (Math.random() - 0.5) * 130;
      values[i * 3 + 1] = -Math.random() * 84 + 20;
      values[i * 3 + 2] = (Math.random() - 0.5) * 120 - 10;
    }
    return values;
  }, [count]);

  const sprite = useMemo(() => glowTexture(), []);
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const live = world.reduceMotion ? 0 : 1;
    const delta = Math.min(rawDelta, 0.05);
    if (points.current) {
      points.current.rotation.y += delta * 0.028 * live;
      points.current.rotation.x += delta * 0.007 * live;
      // Slow zoom in and out: the whole field inhales.
      points.current.scale.setScalar(1 + Math.sin(motion.time * 0.24) * 0.055 * live);
    }
    if (material.current) {
      scratch.set(world.theme === "dark" ? "#dfe6f2" : "#7c8496");
      material.current.color.lerp(scratch, damp(delta, 3));
      material.current.opacity = THREE.MathUtils.lerp(
        material.current.opacity,
        (world.theme === "dark" ? 0.85 : 0.32) *
          (0.84 + Math.sin(motion.time * 0.55) * 0.16 * live),
        damp(delta, 3),
      );
      material.current.size = 0.14 + Math.sin(motion.time * 0.9) * 0.022 * live;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        size={0.14}
        map={sprite}
        color={palette.star}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SceneLights() {
  const { theme } = useWorldState();
  const palette = paletteFor(theme);
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const pointerLight = useRef<THREE.PointLight>(null);
  const scratch = useMemo(() => new THREE.Color(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    const world = getWorld();
    const active = paletteFor(world.theme);
    const delta = Math.min(rawDelta, 0.05);
    if (ambient.current) {
      ambient.current.intensity = THREE.MathUtils.lerp(
        ambient.current.intensity,
        active.ambient,
        damp(delta, 3),
      );
    }
    if (key.current) {
      scratch.set(active.keyLight);
      key.current.color.lerp(scratch, damp(delta, 3));
      key.current.intensity = THREE.MathUtils.lerp(
        key.current.intensity,
        world.theme === "dark" ? 2.1 : 2.8,
        damp(delta, 3),
      );
    }
    if (rim.current) {
      scratch.set(active.rimLight);
      rim.current.color.lerp(scratch, damp(delta, 3));
      rim.current.intensity = THREE.MathUtils.lerp(
        rim.current.intensity,
        world.theme === "dark" ? 2.6 : 1.1,
        damp(delta, 3),
      );
    }
    /* Cursor-responsive highlight: an accent point light parked near the camera
       that slides with the smoothed pointer, so metal reads the cursor. Kept
       dim on purpose — it is a specular accent, not a fourth scene light. */
    if (pointerLight.current) {
      offset
        .set(motion.pointerSmoothed.x * 5, motion.pointerSmoothed.y * 3.6, -6)
        .applyQuaternion(state.camera.quaternion)
        .add(state.camera.position);
      pointerLight.current.position.copy(offset);
      scratch.set(active.accent);
      pointerLight.current.color.lerp(scratch, damp(delta, 3));
      pointerLight.current.intensity = THREE.MathUtils.lerp(
        pointerLight.current.intensity,
        world.theme === "dark" ? 40 : 22,
        damp(delta, 3),
      );
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={palette.ambient} />
      <directionalLight ref={key} position={[6, 10, 8]} intensity={2.1} color={palette.keyLight} />
      <directionalLight ref={rim} position={[-8, -4, -10]} intensity={2.4} color={palette.rimLight} />
      <hemisphereLight args={[palette.keyLight, palette.metalDark, theme === "dark" ? 0.35 : 0.75]} />
      <pointLight
        ref={pointerLight}
        intensity={0}
        distance={44}
        decay={2}
        color={palette.accent}
      />
    </>
  );
}

function Backdrop() {
  const { theme } = useWorldState();
  const palette = paletteFor(theme);
  const scene = useThree((state) => state.scene);
  const fog = useMemo(() => new THREE.FogExp2("#050507", 0.012), []);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useEffect(() => {
    fog.color.set(palette.fog);
    fog.density = palette.fogDensity;
  }, [fog, palette]);

  return <color attach="background" args={[palette.background]} />;
}

/** Advances the shared scene clock and smoothed pointer without re-rendering React. */
function Clock({ onReady }: { onReady: () => void }) {
  const reported = useRef(false);
  useFrame((_, rawDelta) => {
    const world = getWorld();
    motion.time += world.reduceMotion ? 0 : Math.min(rawDelta, 0.05);
    motion.pointerSmoothed.x = THREE.MathUtils.lerp(motion.pointerSmoothed.x, motion.pointer.x, 0.08);
    motion.pointerSmoothed.y = THREE.MathUtils.lerp(motion.pointerSmoothed.y, motion.pointer.y, 0.08);
    if (!reported.current) {
      reported.current = true;
      onReady();
    }
  });
  return null;
}

export default function WorldCanvas() {
  const { quality, theme, backgroundPaused, webglAvailable } = useWorldState();
  const tiers = qualityTiers[quality];
  const palette = paletteFor(theme);

  useEffect(() => {
    if (!webglAvailable) setWorld({ sceneReady: true });
  }, [webglAvailable]);

  if (!webglAvailable) return null;

  return (
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        dpr={tiers.dpr}
        frameloop={backgroundPaused ? "never" : "always"}
        camera={{ position: [0, 1.1, 24], fov: 42, near: 0.1, far: 260 }}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance", alpha: false }}
      >
        <Backdrop />
        <Clock onReady={() => setWorld({ sceneReady: true })} />
        <CameraRig />
        <SceneLights />
        <StarField />
        <AmbientBackdrop />

        {/* Locally-rendered environment: metallic reflections with no HDRI fetch. */}
        <Environment key={theme} resolution={quality === "low" ? 64 : 128} frames={1}>
          <Lightformer
            form="rect"
            intensity={theme === "dark" ? 1.2 : 0.6}
            color={palette.keyLight}
            position={[0, 6, 8]}
            scale={[12, 6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={theme === "dark" ? 0.8 : 0.4}
            color={palette.accent}
            position={[-8, -2, -6]}
            rotation={[0, Math.PI / 3, 0]}
            scale={[10, 8, 1]}
          />
          <Lightformer
            form="ring"
            intensity={theme === "dark" ? 1.4 : 0.5}
            color={palette.violet}
            position={[6, -6, -10]}
            scale={4}
          />
        </Environment>

        {/* Chapter 01 shares the hero object: one world, one continuous camera. */}
        <CoreScene sectionId="ch01" alsoVisibleFor="hero" position={[0, 0, 0]} />
        <AIScene sectionId="ch02" position={anchor("ch02")} />
        <RoboticsScene sectionId="ch03" position={anchor("ch03")} />
        <SpaceScene sectionId="ch04" position={anchor("ch04")} />
        <InnovationScene sectionId="ch05" position={anchor("ch05")} />
        <InnovationScene sectionId="finale" position={FINALE_ANCHOR} settled />
        <Effects />
      </Canvas>
    </div>
  );
}
