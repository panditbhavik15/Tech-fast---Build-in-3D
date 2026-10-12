import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { clamp01, damp, getWorld, motion, window4 } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { paletteFor } from "../config/palette";
import { gearGeometry } from "./lib/textures";

type SceneProps = { sectionId: string; position?: [number, number, number] };

type Kind = "gear" | "beam" | "actuator" | "plate" | "hub";

type PartSpec = {
  id: string;
  kind: Kind;
  label: string;
  blurb: string;
  assembled: [number, number, number];
  exploded: [number, number, number];
  size: [number, number, number];
  /** Gears only: angular multiplier so the train meshes believably. */
  ratio?: number;
  hotspot?: boolean;
};

const PARTS: PartSpec[] = [
  {
    id: "drive",
    kind: "gear",
    label: "Primary drive gear",
    blurb: "Torque enters here. 16 machined teeth, sized to mesh exactly with the pinion.",
    assembled: [0, 0, 0],
    exploded: [-3.4, 2.2, 2.4],
    size: [1.95, 1.95, 0.42],
    ratio: 1,
    hotspot: true,
  },
  {
    id: "pinion",
    kind: "gear",
    label: "Pinion",
    blurb: "A smaller gear that trades force for speed — the ratio the actuator runs on.",
    assembled: [2.55, 1.25, 0],
    exploded: [4.2, 3.4, 1.4],
    size: [0.95, 0.95, 0.36],
    ratio: -2.05,
    hotspot: true,
  },
  {
    id: "idler",
    kind: "gear",
    label: "Idler wheel",
    blurb: "Reverses direction and closes the loop back into the frame.",
    assembled: [-2.4, -1.6, 0],
    exploded: [-4.6, -3.2, 1.1],
    size: [1.1, 1.1, 0.32],
    ratio: -1.72,
  },
  {
    id: "frame",
    kind: "beam",
    label: "Chassis frame",
    blurb: "The load path. Everything else is positioned relative to this rectangle.",
    assembled: [0, -2.7, 0],
    exploded: [0, -5.4, -2.6],
    size: [7.6, 0.36, 0.36],
  },
  {
    id: "column",
    kind: "beam",
    label: "Support column",
    blurb: "Two machined columns carry the gear train and damp vibration.",
    assembled: [-3.4, 0, 0],
    exploded: [-6.2, 0, -3],
    size: [0.34, 5.6, 0.34],
  },
  {
    id: "column-2",
    kind: "beam",
    label: "Support column",
    blurb: "Two machined columns carry the gear train and damp vibration.",
    assembled: [3.4, 0, 0],
    exploded: [6.2, 0, -3],
    size: [0.34, 5.6, 0.34],
  },
  {
    id: "actuator",
    kind: "actuator",
    label: "Linear actuator",
    blurb: "Rotary input becomes linear travel. Watch it stroke as the chapter scrolls.",
    assembled: [0, 2.6, 0.9],
    exploded: [1.2, 5.2, 3.4],
    size: [3.4, 0.5, 0.5],
    hotspot: true,
  },
  {
    id: "plate",
    kind: "plate",
    label: "Mounting plate",
    blurb: "The interface surface: every subsystem bolts down to this.",
    assembled: [0, -3.3, 0],
    exploded: [0, -6.4, 2.2],
    size: [6.4, 0.2, 3.2],
  },
  {
    id: "hub",
    kind: "hub",
    label: "Bearing hub",
    blurb: "Keeps the drive shaft concentric under load.",
    assembled: [0, 0, 0.5],
    exploded: [0, 0, 4.6],
    size: [0.62, 0.62, 0.62],
  },
];

/**
 * Chapter 03 — a coherent procedural machine. Parts fly together as the
 * chapter scrolls, gears mesh with correct relative speeds, and the selected
 * component can be highlighted, inspected and dragged.
 */
export default function RoboticsScene({ sectionId, position = [0, 0, 0] }: SceneProps) {
  const { activeSection, quality } = useWorldState();
  const [hovered, setHovered] = useState<string | null>(null);
  const [openHotspot, setOpenHotspot] = useState<string | null>(null);

  const group = useRef<THREE.Group>(null);
  const partGroups = useRef<(THREE.Group | null)[]>([]);
  const partMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const hoverLevels = useRef<number[]>(PARTS.map(() => 0));
  const spin = useRef(0);
  const dragState = useRef({ active: false, x: 0, last: 0, velocity: 0 });

  const gearTeeth = quality === "low" ? 10 : quality === "medium" ? 13 : 16;
  const geometries = useMemo(() => {
    return PARTS.map((part) => {
      if (part.kind === "gear") {
        return gearGeometry(gearTeeth, part.size[0], part.size[0] * 0.16, part.size[2]);
      }
      switch (part.kind) {
        case "plate":
          return new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
        case "actuator":
          return new THREE.CylinderGeometry(part.size[1] / 2, part.size[1] / 2, part.size[0], 20);
        case "hub":
          return new THREE.TorusGeometry(part.size[0], 0.14, 10, 28);
        default:
          return new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
      }
    });
  }, [gearTeeth]);

  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);

  const isActive = activeSection === sectionId;
  const scratch = useMemo(() => ({ color: new THREE.Color() }), []);

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const palette = paletteFor(world.theme);
    const delta = world.reduceMotion ? 0 : Math.min(rawDelta, 0.05);

    const p = motion.progress[sectionId] ?? 0;
    const reveal = window4(p, 0.12, 0.6, 0.28);
    const presence = clamp01(motion.intro) * reveal;
    const assembly = clamp01((p - 0.12) / 0.36);
    const focus = motion.inspect.robotics;

    if (group.current) {
      group.current.visible = presence > 0.01;
      // The whole rig idles on a slow swell so the chapter is never frozen.
      group.current.position.set(
        position[0],
        position[1] + Math.sin(motion.time * 0.45) * 0.25,
        position[2] + Math.cos(motion.time * 0.32) * 0.2,
      );
      // Idle spin plus manual drag; drag velocity decays for a weighted feel.
      spin.current += delta * (0.18 + p * 0.1) + dragState.current.velocity;
      dragState.current.velocity *= 1 - Math.min(1, damp(delta, 4));
      const pointerTarget = motion.pointerSmoothed.x * 0.35;
      group.current.rotation.y = spin.current + (dragState.current.active ? 0 : pointerTarget);
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        -0.12 + motion.pointerSmoothed.y * 0.14,
        damp(delta, 2),
      );
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, 0.9 + focus * 0.06, damp(delta, 3)));
    }

    PARTS.forEach((part, index) => {
      const node = partGroups.current[index];
      if (!node) return;
      const targetHover = hovered === part.id || openHotspot === part.id ? 1 : 0;
      hoverLevels.current[index] = THREE.MathUtils.lerp(
        hoverLevels.current[index],
        targetHover,
        damp(delta, 6),
      );
      const level = hoverLevels.current[index];

      const from = part.exploded;
      const to = part.assembled;
      const t = assembly * assembly * (3 - 2 * assembly);
      const drift = Math.sin(motion.time * 0.6 + index) * (1 - t) * 0.18;
      // Running-machine hum: parts keep micro-vibrating after they lock together.
      const hum = Math.sin(motion.time * 5.5 + index * 1.7) * 0.02 * t;
      node.position.set(
        from[0] + (to[0] - from[0]) * t + hum,
        from[1] + (to[1] - from[1]) * t + drift,
        from[2] + (to[2] - from[2]) * t,
      );
      const spread = (1 - t) * 0.5;
      node.rotation.x = part.kind === "beam" ? hum * 2 : spread * Math.sin(index) + hum;
      const lift = 1 + level * 0.06;
      node.scale.setScalar(lift);

      if (part.kind === "gear") {
        node.rotation.z =
          spin.current * (part.ratio ?? 1) * 1.6 + motion.time * (part.ratio ?? 1) * 0.5;
      }
      if (part.kind === "actuator") {
        node.rotation.z = Math.PI / 2;
        node.position.y = to[1] * t + from[1] * (1 - t) + Math.sin(motion.time * 1.1) * 0.3 * t;
      }
      if (part.kind === "hub") {
        node.rotation.z += delta * 1.4;
      }

      const material = partMats.current[index];
      if (material) {
        /* Two-tone steel: bright faces on the gears, mid-grey on the frame. The
           darker tone is `ring`, not `metalDark`, so the assembly keeps its
           silhouette against the near-black chapter background. */
        scratch.color.set(index % 3 === 0 ? palette.metal : palette.ring);
        material.color.lerp(scratch.color, damp(delta, 3));
        scratch.color.set(level > 0.02 ? palette.accent : palette.emissive);
        material.emissive.lerp(scratch.color, damp(delta, 5));
        material.emissiveIntensity = THREE.MathUtils.lerp(
          material.emissiveIntensity,
          palette.emissiveBoost * (0.05 + level * 0.75),
          damp(delta, 5),
        );
        material.opacity = THREE.MathUtils.lerp(material.opacity, clamp01(presence * 1.2), damp(delta, 4));
        material.transparent = true;
      }
    });
  });

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isActive) return;
    event.stopPropagation();
    dragState.current.active = true;
    dragState.current.last = event.nativeEvent.clientX;
    document.body.classList.add("is-dragging");
  };

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragState.current.active) return;
    const x = event.nativeEvent.clientX;
    const dx = x - dragState.current.last;
    dragState.current.last = x;
    dragState.current.velocity = dx * 0.0016;
    spin.current += dx * 0.005;
  };

  const endDrag = () => {
    dragState.current.active = false;
    document.body.classList.remove("is-dragging");
  };

  return (
    <group
      ref={group}
      position={position}
      onPointerDown={isActive ? onPointerDown : undefined}
      onPointerMove={isActive ? onPointerMove : undefined}
      onPointerUp={isActive ? endDrag : undefined}
      onPointerLeave={isActive ? endDrag : undefined}
    >
      {PARTS.map((part, index) => (
        <group
          key={part.id}
          ref={(el) => {
            partGroups.current[index] = el;
          }}
          onPointerOver={
            isActive
              ? (event) => {
                  event.stopPropagation();
                  setHovered(part.id);
                }
              : undefined
          }
          onPointerOut={
            isActive
              ? () => {
                  setHovered((current) => (current === part.id ? null : current));
                }
              : undefined
          }
        >
          <mesh geometry={geometries[index]}>
            <meshStandardMaterial
              ref={(el) => {
                partMats.current[index] = el;
              }}
              color={index % 3 === 0 ? "#c8ccd6" : "#aab2c2"}
              metalness={0.92}
              roughness={0.3}
              emissive="#2e7bff"
              emissiveIntensity={0.05}
              transparent
              opacity={1}
            />
          </mesh>

          {part.hotspot && isActive && (
            <Html position={[0, part.size[1] + 0.45, 0]} center zIndexRange={[20, 0]}>
              <button
                type="button"
                className="hotspot"
                data-open={openHotspot === part.id || undefined}
                aria-expanded={openHotspot === part.id}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setOpenHotspot((current) => (current === part.id ? null : part.id))}
              >
                <span className="hotspot-dot" aria-hidden="true" />
                <span className="hotspot-label">{part.label}</span>
              </button>
              {openHotspot === part.id && (
                <span className="hotspot-card" role="status">
                  {part.blurb}
                </span>
              )}
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}
