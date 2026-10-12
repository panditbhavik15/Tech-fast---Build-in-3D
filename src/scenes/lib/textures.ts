import * as THREE from "three";

/** Runtime-generated textures keep the project free of external assets. */

let glow: THREE.Texture | null = null;

export function glowTexture(): THREE.Texture {
  if (glow) return glow;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  glow = texture;
  return texture;
}

const planetCache = new Map<string, THREE.Texture>();

/** Procedural banded surface used by the space chapter, cached per palette key. */
export function planetTexture(key: string, base: string, dark: string, light: string) {
  const cached = planetCache.get(key);
  if (cached) return cached;

  const width = 512;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    // Horizontal bands with sinusoidal distortion read as atmosphere.
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const band = Math.sin(t * 26) * 0.5 + Math.sin(t * 9.3 + 1.2) * 0.35;
      const alpha = 0.06 + Math.abs(band) * 0.14;
      ctx.fillStyle = band > 0 ? withAlpha(light, alpha) : withAlpha(dark, alpha + 0.06);
      ctx.fillRect(0, y, width, 1);
    }

    // Sparse impact craters.
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 1 + Math.random() * 7;
      ctx.fillStyle = withAlpha(dark, 0.1 + Math.random() * 0.16);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  planetCache.set(key, texture);
  return texture;
}

function withAlpha(hex: string, alpha: number) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
}

/** Gear profile built procedurally so the robotics chapter needs no models. */
export function gearGeometry(teeth: number, radius: number, toothDepth: number, thickness: number) {
  const shape = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const phase = i % 4;
    const r =
      radius +
      (phase === 1 || phase === 2 ? toothDepth : phase === 3 ? toothDepth * 0.35 : 0) -
      (phase === 0 ? 0 : 0);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, radius * 0.28, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 1,
    curveSegments: 6,
  });
  geometry.center();
  return geometry;
}
