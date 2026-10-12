import { useCallback, useSyncExternalStore } from "react";
import { getWorld, setWorld, subscribeWorld } from "../state/world";
import type { Quality, ThemeName } from "../state/world";

const STORAGE_KEY = "techfest-theme";

export function useWorldState() {
  return useSyncExternalStore(subscribeWorld, getWorld, getWorld);
}

/** Theme is a single source of truth for both the DOM palette and 3D materials. */
export function useTheme() {
  const { theme } = useWorldState();

  const apply = useCallback((next: ThemeName) => {
    setWorld({ theme: next });
    document.documentElement.dataset.theme = next;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#f7f7f8" : "#050507");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode: theme simply will not persist */
    }
  }, []);

  const toggle = useCallback(() => {
    apply(getWorld().theme === "dark" ? "light" : "dark");
  }, [apply]);

  return { theme, setTheme: apply, toggle };
}

function useMediaQuery(query: string, onChange?: (matches: boolean) => void) {
  const get = useCallback(() => window.matchMedia(query).matches, [query]);
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      const handler = (event: MediaQueryListEvent) => {
        onChange?.(event.matches);
        onStoreChange();
      };
      list.addEventListener("change", handler);
      return () => list.removeEventListener("change", handler);
    },
    [query, onChange],
  );
  return useSyncExternalStore(subscribe, get, () => false);
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 820px), (pointer: coarse) and (max-width: 1100px)");
}

export function useCoarsePointer() {
  return useMediaQuery("(pointer: coarse)");
}

export function setQuality(quality: Quality) {
  setWorld({ quality });
}

export function syncReduceMotion(reduce: boolean) {
  setWorld({ reduceMotion: reduce });
}

/**
 * Probes for a usable WebGL context once, before React mounts the canvas.
 * A blocked or software-only context falls back to the static experience.
 */
export function detectWebgl(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    const lose = gl instanceof WebGLRenderingContext ? gl.getExtension("WEBGL_lose_context") : null;
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}
