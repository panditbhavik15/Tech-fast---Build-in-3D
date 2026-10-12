import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { clamp01, damp, getWorld, motion, window4 } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { paletteFor } from "../config/palette";
import { glowTexture } from "./lib/textures";

type SceneProps = { sectionId: string; position?: [number, number, number] };

type Node = { pos: THREE.Vector3; layer: number };

/**
 * Chapter 02 — an artistic representation of connected intelligence:
 * layered nodes, edges that draw themselves in as the chapter scrolls, and
 * signal points travelling along those paths. Not a trained model.
 */
export default function AIScene({ sectionId, position = [0, 0, 0] }: SceneProps) {
  const { quality } = useWorldState();
  const group = useRef<THREE.Group>(null);
  const hub = useRef<THREE.Mesh>(null);
  const nodeMesh = useRef<THREE.InstancedMesh>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const signals = useRef<THREE.Points>(null);

  const nodeMat = useRef<THREE.MeshStandardMaterial>(null);
  const hubMat = useRef<THREE.MeshStandardMaterial>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const signalMat = useRef<THREE.PointsMaterial>(null);

  const nodeCount = quality === "low" ? 24 : quality === "medium" ? 34 : 46;
  const signalCount = quality === "low" ? 12 : quality === "medium" ? 18 : 28;

  const graph = useMemo(() => {
    const nodes: Node[] = [];
    const layers = 4;
    const perLayer = Math.max(3, Math.round(nodeCount / layers));
    for (let layer = 0; layer < layers; layer++) {
      const spread = 2.2 + layer * 1.5;
      for (let i = 0; i < perLayer; i++) {
        const t = (i + 0.5) / perLayer;
        const angle = t * Math.PI * 2 + layer * 0.7;
        const radius = spread * (0.55 + 0.45 * Math.sin(angle * 2 + layer));
        nodes.push({
          layer,
          pos: new THREE.Vector3(
            Math.cos(angle) * radius,
            (t - 0.5) * 6.4 + Math.sin(angle * 3) * 0.6,
            Math.sin(angle) * radius * 0.7,
          ),
        });
      }
    }
    nodes.push({ layer: 1.5, pos: new THREE.Vector3(0, 0, 0) });
    nodes.push({ layer: 2.5, pos: new THREE.Vector3(0, 2.2, 0) });
    nodes.push({ layer: 2.5, pos: new THREE.Vector3(0, -2.2, 0) });

    const edges: [number, number][] = [];
    nodes.forEach((node, index) => {
      const scored = nodes
        .map((other, otherIndex) => ({
          otherIndex,
          distance: node.pos.distanceTo(other.pos),
          forward: other.layer > node.layer,
        }))
        .filter((candidate) => candidate.otherIndex !== index && candidate.forward)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);
      scored.forEach((candidate) => edges.push([index, candidate.otherIndex]));
    });

    const positions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], index) => {
      positions[index * 6 + 0] = nodes[a].pos.x;
      positions[index * 6 + 1] = nodes[a].pos.y;
      positions[index * 6 + 2] = nodes[a].pos.z;
      positions[index * 6 + 3] = nodes[b].pos.x;
      positions[index * 6 + 4] = nodes[b].pos.y;
      positions[index * 6 + 5] = nodes[b].pos.z;
    });

    const travelling = new Float32Array(signalCount);
    const travellingEdge = new Int32Array(signalCount);
    for (let i = 0; i < signalCount; i++) {
      travelling[i] = Math.random();
      travellingEdge[i] = Math.floor(Math.random() * Math.max(1, edges.length));
    }
    const signalPositions = new Float32Array(signalCount * 3);

    return { nodes, edges, positions, travelling, travellingEdge, signalPositions };
  }, [nodeCount, signalCount]);

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      color: new THREE.Color(),
      scale: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
    }),
    [],
  );

  // Per-frame node positions: the lattice floats, and edges + signals follow it.
  const live = useMemo(() => graph.nodes.map((node) => node.pos.clone()), [graph]);

  const sprite = useMemo(() => glowTexture(), []);

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const palette = paletteFor(world.theme);
    const delta = world.reduceMotion ? 0 : Math.min(rawDelta, 0.05);
    const time = motion.time;

    const p = motion.progress[sectionId] ?? 0;
    const reveal = window4(p, 0.14, 0.56, 0.3);
    const presence = clamp01(motion.intro) * reveal;
    const focus = motion.inspect.ai;

    if (group.current) {
      group.current.visible = presence > 0.01;
      group.current.position.set(
        position[0] + Math.sin(time * 0.23) * 0.45,
        position[1] + Math.cos(time * 0.31) * 0.4,
        position[2] + Math.sin(time * 0.18) * 0.45,
      );
      group.current.rotation.y += delta * (0.16 - focus * 0.12);
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        motion.pointerSmoothed.y * 0.12 + focus * 0.1,
        damp(delta, 2),
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        -motion.pointerSmoothed.x * 0.1,
        damp(delta, 2),
      );
      // Inspection spreads the layers apart for readability.
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(group.current.scale.x, 1 + focus * 0.16, damp(delta, 3)),
      );
    }

    graph.nodes.forEach((node, index) => {
      live[index].set(
        node.pos.x + Math.cos(time * 0.5 + index * 0.7) * 0.2,
        node.pos.y + Math.sin(time * 0.66 + index * 0.5) * 0.28,
        node.pos.z + Math.sin(time * 0.42 + index * 0.9) * 0.2,
      );
    });

    if (hub.current) {
      hub.current.rotation.x += delta * 0.3;
      hub.current.rotation.y += delta * 0.45;
      hub.current.scale.setScalar(1 + Math.sin(time * 1.1) * 0.09);
    }

    if (nodeMesh.current) {
      const mesh = nodeMesh.current;
      graph.nodes.forEach((node, index) => {
        const staggered = clamp01((presence * 1.35 - index * 0.012) / 0.6);
        const pulse = 1 + Math.sin(time * 1.4 + index) * 0.12;
        const size = (node.layer % 2 === 0 ? 0.16 : 0.12) * staggered * pulse;
        scratch.scale.setScalar(Math.max(size, 0.0001));
        scratch.matrix.compose(live[index], scratch.quat, scratch.scale);
        mesh.setMatrixAt(index, scratch.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (lines.current) {
      const drawn = Math.round(graph.edges.length * clamp01(presence * 1.2));
      lines.current.geometry.setDrawRange(0, drawn * 2);
      const edgeAttr = lines.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      graph.edges.forEach(([from, to], index) => {
        const a = live[from];
        const b = live[to];
        edgeAttr.setXYZ(index * 2, a.x, a.y, a.z);
        edgeAttr.setXYZ(index * 2 + 1, b.x, b.y, b.z);
      });
      edgeAttr.needsUpdate = true;
      const material = lines.current.material as THREE.LineBasicMaterial;
      scratch.color.set(palette.accent);
      material.color.lerp(scratch.color, damp(delta, 3));
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        (world.theme === "dark" ? 0.42 : 0.3) * presence + focus * 0.2,
        damp(delta, 4),
      );
    }

    if (signals.current) {
      const attr = signals.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const speed = 0.22 + focus * 0.1;
      for (let i = 0; i < signalCount; i++) {
        graph.travelling[i] = (graph.travelling[i] + delta * speed) % 1;
        const edge = graph.edges[graph.travellingEdge[i]];
        if (!edge) continue;
        const a = live[edge[0]];
        const b = live[edge[1]];
        const t = graph.travelling[i];
        attr.setXYZ(i, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
      }
      attr.needsUpdate = true;
    }

    if (nodeMat.current) {
      scratch.color.set(palette.metal);
      nodeMat.current.color.lerp(scratch.color, damp(delta, 3));
      scratch.color.set(palette.emissive);
      nodeMat.current.emissive.lerp(scratch.color, damp(delta, 3));
      nodeMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        nodeMat.current.emissiveIntensity,
        palette.emissiveBoost * 0.45 * presence,
        damp(delta, 3),
      );
    }
    if (hubMat.current) {
      scratch.color.set(palette.violet);
      hubMat.current.color.lerp(scratch.color, damp(delta, 3));
      hubMat.current.emissive.lerp(scratch.color, damp(delta, 3));
      hubMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        hubMat.current.emissiveIntensity,
        palette.emissiveBoost * (0.8 + focus * 0.6),
        damp(delta, 3),
      );
    }
    if (signalMat.current) {
      scratch.color.set(world.theme === "dark" ? palette.star : palette.accent);
      signalMat.current.color.lerp(scratch.color, damp(delta, 3));
      signalMat.current.opacity = THREE.MathUtils.lerp(
        signalMat.current.opacity,
        0.9 * presence,
        damp(delta, 4),
      );
    }
  });

  return (
    <group ref={group} position={position}>
      <instancedMesh
        ref={nodeMesh}
        args={[undefined, undefined, graph.nodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          ref={nodeMat}
          color="#c8ccd6"
          emissive="#2e7bff"
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.35}
        />
      </instancedMesh>

      {/* Hub nodes give the network a readable centre. */}
      <mesh ref={hub} position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          ref={hubMat}
          color="#7c5cff"
          emissive="#7c5cff"
          emissiveIntensity={1}
          metalness={0.5}
          roughness={0.3}
          flatShading
        />
      </mesh>

      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMat}
          color="#2e7bff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <points ref={signals} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[graph.signalPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={signalMat}
          size={0.22}
          map={sprite}
          color="#dfe6f2"
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
