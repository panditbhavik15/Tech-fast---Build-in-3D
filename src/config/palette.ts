import type { ThemeName } from "../state/world";

/**
 * 3D-side mirror of the CSS design tokens. DOM colours come from
 * `src/styles/globals.css`; these values keep the WebGL materials, lights and
 * fog in lockstep with the same palette.
 */
export type WorldPalette = {
  background: string;
  fog: string;
  fogDensity: number;
  metal: string;
  metalDark: string;
  glass: string;
  emissive: string;
  accent: string;
  violet: string;
  particle: string;
  star: string;
  keyLight: string;
  fillLight: string;
  rimLight: string;
  ambient: number;
  envIntensity: number;
  emissiveBoost: number;
  ring: string;
  planet: string;
  planetNight: string;
};

export const palettes: Record<ThemeName, WorldPalette> = {
  dark: {
    background: "#050507",
    fog: "#050507",
    fogDensity: 0.012,
    metal: "#c8ccd6",
    metalDark: "#3a3f4b",
    glass: "#8fa4c8",
    emissive: "#2e7bff",
    accent: "#2e7bff",
    violet: "#7c5cff",
    particle: "#9fb2d0",
    star: "#dfe6f2",
    keyLight: "#dce8ff",
    fillLight: "#4a6ba8",
    rimLight: "#2e7bff",
    ambient: 0.35,
    envIntensity: 0.9,
    emissiveBoost: 1.6,
    ring: "#aab2c2",
    planet: "#5d6b86",
    planetNight: "#0a1020",
  },
  light: {
    background: "#f7f7f8",
    fog: "#f2f3f6",
    fogDensity: 0.014,
    metal: "#8f95a3",
    metalDark: "#c9ced8",
    glass: "#6b7c96",
    emissive: "#1552c9",
    accent: "#1552c9",
    violet: "#5936d3",
    particle: "#8b93a3",
    star: "#6f7683",
    keyLight: "#ffffff",
    fillLight: "#c7cede",
    rimLight: "#1552c9",
    ambient: 0.85,
    envIntensity: 0.7,
    emissiveBoost: 0.7,
    ring: "#6c7482",
    planet: "#aeb6c4",
    planetNight: "#d9dde4",
  },
};

export function paletteFor(theme: ThemeName): WorldPalette {
  return palettes[theme];
}

/** Particle counts, geometry detail and render grade per quality tier. */
export const qualityTiers = {
  high: {
    dpr: [1, 2] as [number, number],
    stars: 2600,
    dust: 340,
    nodes: 46,
    signals: 26,
    gearTeeth: 16,
    effects: true,
    multisampling: 4,
  },
  medium: {
    dpr: [1, 1.6] as [number, number],
    stars: 1500,
    dust: 200,
    nodes: 30,
    signals: 16,
    gearTeeth: 12,
    effects: true,
    multisampling: 2,
  },
  low: {
    dpr: [1, 1.25] as [number, number],
    stars: 800,
    dust: 110,
    nodes: 20,
    signals: 10,
    gearTeeth: 10,
    /** Integrated graphics and older phones render the raw scene instead. */
    effects: false,
    multisampling: 0,
  },
};

export type QualityTier = (typeof qualityTiers)[QualityTierName];
export type QualityTierName = keyof typeof qualityTiers;
