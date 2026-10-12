/**
 * Scroll/world state shared between the DOM (GSAP ScrollTrigger) and the WebGL
 * scene graph.
 *
 * Continuous values (camera targets, per-section progress, pointer) live in a
 * plain mutable object read inside `useFrame`, so scroll never triggers React
 * renders. Discrete values (theme, quality, active scene) go through a tiny
 * external store that React subscribes to.
 */

export type Quality = "high" | "medium" | "low";
export type ThemeName = "dark" | "light";

type Discrete = {
  theme: ThemeName;
  quality: Quality;
  reduceMotion: boolean;
  /** True while neither the narrative nor the finale is on screen. */
  backgroundPaused: boolean;
  /** Set once the first frame has rendered, used by the loading screen. */
  sceneReady: boolean;
  webglAvailable: boolean;
  activeSection: string;
};

/** Camera + animation state consumed every frame by the render loop. */
export const motion = {
  /** Local 0..1 scroll progress keyed by narrative section id. */
  progress: {} as Record<string, number>,
  cameraTarget: [0, 0.6, 16] as [number, number, number],
  lookTarget: [0, 0, 0] as [number, number, number],
  pointer: { x: 0, y: 0 },
  pointerSmoothed: { x: 0, y: 0 },
  /** Elapsed scene time; frozen when an animation is paused. */
  time: 0,
  /** 0..1 timed opening reveal, independent of scroll. */
  intro: 0,
  /** Inspection targets raised by DOM controls; scenes damp toward these. */
  inspect: { ai: 0, robotics: 0 },
  playgroundActive: false,
};

const listeners = new Set<() => void>();

let state: Discrete = {
  theme:
    typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark",
  quality: "high",
  reduceMotion: false,
  backgroundPaused: false,
  sceneReady: false,
  webglAvailable: true,
  activeSection: "hero",
};

export function getWorld(): Discrete {
  return state;
}

export function setWorld(patch: Partial<Discrete>): void {
  let changed = false;
  for (const key of Object.keys(patch) as (keyof Discrete)[]) {
    if (state[key] !== patch[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeWorld(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function sectionProgress(id: string): number {
  return motion.progress[id] ?? 0;
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Eases a 0..1 progress through a plateau: fade in, hold, fade out. */
export function window4(p: number, fadeIn = 0.15, hold = 0.55, fadeOut = 0.3): number {
  if (p < fadeIn) return clamp01(p / fadeIn);
  if (p < fadeIn + hold) return 1;
  return clamp01(1 - (p - fadeIn - hold) / Math.max(fadeOut, 0.0001));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Frame-rate independent damping factor for `lerp`. */
export function damp(delta: number, lambda: number): number {
  return 1 - Math.exp(-lambda * delta);
}
