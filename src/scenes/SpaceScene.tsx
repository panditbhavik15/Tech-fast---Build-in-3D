import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { clamp01, damp, getWorld, motion, window4 } from "../state/world";
import { useWorldState } from "../hooks/useAppState";
import { paletteFor } from "../config/palette";
import { glowTexture, planetTexture } from "./lib/textures";

type SceneProps = { sectionId: string; position?: [number, number, number] };

const MOON_ORBITS = [
  { radius: 6.6, speed: 0.34, size: 0.28, tilt: 0.22 },
  { radius: 8.4, speed: -0.21, size: 0.42, tilt: -0.4 },
  { radius: 10.4, speed: 0.14, size: 0.2, tilt: 0.62 },
];

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(uColor, 1.0) * max(intensity, 0.0) * uStrength;
  }
`;

function orbitPositions(radius: number, tilt: number, segments = 128) {
  const values = new Float32Array(segments * 3);
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    values[i * 3] = Math.cos(angle) * radius;
    values[i * 3 + 1] = Math.sin(angle) * radius * Math.sin(tilt);
    values[i * 3 + 2] = Math.sin(angle) * radius * Math.cos(tilt);
  }
  return values;
}

/**
 * Chapter 04 — procedural planet, orbiting moons, orbital paths and a lit
 * horizon. The surface is a canvas-generated texture, so nothing is fetched.
 */
export default function SpaceScene({ sectionId, position = [0, 0, 0] }: SceneProps) {
  const { theme } = useWorldState();

  const group = useRef<THREE.Group>(null);
  const planet = useRef<THREE.Mesh>(null);
  const moons = useRef<(THREE.Mesh | null)[]>([]);
  const carriers = useRef<(THREE.Group | null)[]>([]);
  const atmosphere = useRef<THREE.Mesh>(null);
  const sun = useRef<THREE.Sprite>(null);
  const atmosphereMat = useRef<THREE.ShaderMaterial>(null);
  const planetMat = useRef<THREE.MeshStandardMaterial>(null);
  const orbitMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  const initialPalette = paletteFor(theme);

  const texture = useMemo(
    () =>
      planetTexture(
        theme,
        initialPalette.planet,
        initialPalette.planetNight,
        theme === "dark" ? "#9fb6d8" : "#ffffff",
      ),
    [theme, initialPalette.planet, initialPalette.planetNight],
  );

  const orbitGeometries = useMemo(
    () =>
      MOON_ORBITS.map((orbit) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(orbitPositions(orbit.radius, orbit.tilt), 3));
        return geometry;
      }),
    [],
  );

  useEffect(() => () => orbitGeometries.forEach((geometry) => geometry.dispose()), [orbitGeometries]);

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#2e7bff") },
      uStrength: { value: 1 },
    }),
    [],
  );

  const sunTexture = useMemo(() => glowTexture(), []);
  const scratch = useMemo(() => ({ color: new THREE.Color() }), []);

  useFrame((_, rawDelta) => {
    const world = getWorld();
    const palette = paletteFor(world.theme);
    const delta = world.reduceMotion ? 0 : Math.min(rawDelta, 0.05);
    const time = motion.time;

    const p = motion.progress[sectionId] ?? 0;
    const reveal = window4(p, 0.12, 0.6, 0.28);
    const presence = clamp01(motion.intro) * reveal;

    if (group.current) {
      group.current.visible = presence > 0.01;
      // The system rides a slow ellipse, giving the chapter parallax against
      // the camera instead of sitting pinned to its anchor.
      group.current.position.set(
        position[0] + Math.sin(time * 0.19) * 0.8,
        position[1] + Math.sin(time * 0.27) * 0.55,
        position[2] + Math.cos(time * 0.15) * 0.7,
      );
      group.current.scale.setScalar(
        THREE.MathUtils.lerp(group.current.scale.x, 0.92 + presence * 0.08, damp(delta, 3)),
      );
    }
    if (planet.current) {
      planet.current.rotation.y += delta * 0.13;
      planet.current.rotation.z = 0.1 + Math.sin(time * 0.33) * 0.05;
    }

    if (atmosphere.current) {
      atmosphere.current.rotation.y -= delta * 0.06;
      const swell = 1.14 + Math.sin(time * 0.7) * 0.014;
      atmosphere.current.scale.setScalar(swell);
    }

    // Each moon rides inside its own carrier group, so precessing the carrier
    // moves the orbit line and the moon together.
    MOON_ORBITS.forEach((orbit, index) => {
      const carrier = carriers.current[index];
      if (carrier) {
        carrier.rotation.y = time * (0.06 + index * 0.025);
        carrier.rotation.x = Math.sin(time * 0.24 + index) * 0.07;
      }
      const moon = moons.current[index];
      if (!moon) return;
      const angle = time * orbit.speed + index * 2.1;
      moon.position.set(
        Math.cos(angle) * orbit.radius,
        Math.sin(angle) * orbit.radius * Math.sin(orbit.tilt),
        Math.sin(angle) * orbit.radius * Math.cos(orbit.tilt),
      );
      moon.position.y += Math.sin(time * 0.9 + index) * 0.16;
      moon.rotation.x += delta * 0.5;
      moon.rotation.y += delta * 0.34;
    });

    if (atmosphereMat.current) {
      atmosphereUniforms.uColor.value.lerp(scratch.color.set(palette.accent), damp(delta, 3));
      atmosphereUniforms.uStrength.value = THREE.MathUtils.lerp(
        atmosphereUniforms.uStrength.value,
        world.theme === "dark" ? 1.5 : 0.5,
        damp(delta, 3),
      );
    }
    if (planetMat.current) {
      scratch.color.set(palette.metal);
      planetMat.current.color.lerp(scratch.color, damp(delta, 3));
      planetMat.current.envMapIntensity = THREE.MathUtils.lerp(
        planetMat.current.envMapIntensity,
        palette.envIntensity,
        damp(delta, 3),
      );
    }
    orbitMats.current.forEach((material) => {
      if (!material) return;
      scratch.color.set(palette.particle);
      material.color.lerp(scratch.color, damp(delta, 3));
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0.3 * presence, damp(delta, 4));
    });
    if (sun.current) {
      const material = sun.current.material as THREE.SpriteMaterial;
      scratch.color.set(world.theme === "dark" ? "#cfe0ff" : "#93a6c4");
      material.color.lerp(scratch.color, damp(delta, 3));
      material.opacity = THREE.MathUtils.lerp(
        material.opacity,
        (world.theme === "dark" ? 0.85 : 0.3) * presence,
        damp(delta, 4),
      );
      const swell = 15 * (1 + Math.sin(time * 0.55) * 0.05);
      sun.current.scale.set(swell, swell, 1);
      sun.current.position.set(
        -16 + Math.sin(time * 0.2) * 0.9,
        6 + Math.cos(time * 0.17) * 0.7,
        -22,
      );
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh ref={planet}>
        <sphereGeometry args={[4.2, 48, 32]} />
        <meshStandardMaterial
          ref={planetMat}
          map={texture}
          color="#c8ccd6"
          metalness={0.15}
          roughness={0.85}
          envMapIntensity={0.6}
        />
      </mesh>

      <mesh ref={atmosphere} scale={[1.14, 1.14, 1.14]}>
        <sphereGeometry args={[4.2, 32, 24]} />
        <shaderMaterial
          ref={atmosphereMat}
          args={[
            {
              uniforms: atmosphereUniforms,
              vertexShader: atmosphereVertex,
              fragmentShader: atmosphereFragment,
              side: THREE.BackSide,
              blending: THREE.AdditiveBlending,
              transparent: true,
              depthWrite: false,
            },
          ]}
        />
      </mesh>

      {MOON_ORBITS.map((orbit, index) => (
        <group
          key={`orbit-${index}`}
          ref={(el) => {
            carriers.current[index] = el;
          }}
        >
          <lineLoop geometry={orbitGeometries[index]}>
            <lineBasicMaterial
              ref={(el) => {
                orbitMats.current[index] = el;
              }}
              color="#9fb2d0"
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </lineLoop>

          <mesh
            ref={(el) => {
              moons.current[index] = el;
            }}
          >
            <icosahedronGeometry args={[orbit.size, 0]} />
            <meshStandardMaterial color="#aab2c2" metalness={0.6} roughness={0.5} flatShading />
          </mesh>
        </group>
      ))}

      <sprite ref={sun} position={[-16, 6, -22]} scale={[15, 15, 1]}>
        <spriteMaterial
          map={sunTexture}
          color="#cfe0ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <pointLight position={[-14, 5, -18]} intensity={40} distance={70} decay={1.7} color="#dce8ff" />
    </group>
  );
}
