import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  Boxes,
  Expand,
  Grid3X3,
  Pause,
  Play,
  RefreshCw,
  Shrink,
  Sparkles,
} from "lucide-react";
import PlaygroundScene from "../scenes/PlaygroundScene";
import {
  PLAYGROUND_PARTS,
  type PartId,
  type PlaygroundMaterial,
} from "../config/playground";
import { paletteFor, qualityTiers } from "../config/palette";
import { useWorldState } from "../hooks/useAppState";

const MATERIALS: { id: PlaygroundMaterial; label: string }[] = [
  { id: "metal", label: "Polished metal" },
  { id: "glass", label: "Transmissive glass" },
  { id: "emissive", label: "Emissive core" },
  { id: "matte", label: "Matte composite" },
];

const DISTANCE = { min: 6.5, max: 15, step: 1.2, initial: 10 };

/**
 * The playground owns a second, contained canvas: the narrative world is paused
 * while this is on screen, so only one full-screen 3D scene renders at a time.
 * The canvas mounts on first view and its render loop stops when it scrolls away.
 */
export default function Playground() {
  const { theme, quality, reduceMotion } = useWorldState();
  const palette = paletteFor(theme);
  const tiers = qualityTiers[quality];

  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

  const [material, setMaterial] = useState<PlaygroundMaterial>("metal");
  const [wireframe, setWireframe] = useState(false);
  const [paused, setPaused] = useState(reduceMotion);
  const [autoSpin, setAutoSpin] = useState(!reduceMotion);
  const [distance, setDistance] = useState(DISTANCE.initial);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [hovered, setHovered] = useState<PartId | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  // Rotation keystrokes are written to a ref and consumed inside the render loop,
  // so holding an arrow key never re-renders React.
  const nudge = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) setMounted(true);
        setInView(visible);
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const resetView = () => {
    setResetSignal((value) => value + 1);
    setSelected(null);
    setDistance(DISTANCE.initial);
  };

  const zoom = (direction: -1 | 1) => {
    setDistance((value) =>
      Math.min(DISTANCE.max, Math.max(DISTANCE.min, value + direction * DISTANCE.step)),
    );
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = 0.18;
    switch (event.key) {
      case "ArrowLeft":
        nudge.current.x -= step;
        break;
      case "ArrowRight":
        nudge.current.x += step;
        break;
      case "ArrowUp":
        nudge.current.y -= step;
        break;
      case "ArrowDown":
        nudge.current.y += step;
        break;
      case "+":
      case "=":
        zoom(-1);
        break;
      case "-":
      case "_":
        zoom(1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const focusId = hovered ?? selected;
  const focusedPart = PLAYGROUND_PARTS.find((part) => part.id === focusId);

  return (
    <section id="playground" ref={sectionRef} className="playground section-flush" aria-labelledby="playground-title">
      <div className="shell playground-inner">
        <header className="playground-head">
          <p className="label">
            <span className="label-accent">LIVE CONTROLS</span> / direct manipulation
          </p>
          <h2 id="playground-title" className="display-l">
            Don&apos;t just observe. <span className="accent-text">Interact.</span>
          </h2>
          <p className="body-lede">
            Every control below writes to the rendered scene, not to a picture of it. Drag to
            rotate, pick a material, break the geometry down to wireframe, or stop time entirely.
          </p>
        </header>

        <div className="playground-grid">
          <div
            className="playground-stage panel"
            tabIndex={0}
            role="group"
            aria-label="3D object viewport. Use arrow keys to rotate, plus and minus to zoom."
            onKeyDown={onKeyDown}
            data-cursor="grow"
          >
            {mounted ? (
              <Canvas
                dpr={tiers.dpr}
                frameloop={inView ? "always" : "never"}
                camera={{ position: [0, 0.4, DISTANCE.initial], fov: 45 }}
                gl={{ antialias: quality !== "low", alpha: true }}
              >
                <PlaygroundScene
                  material={material}
                  wireframe={wireframe}
                  paused={paused}
                  distance={distance}
                  autoSpin={autoSpin}
                  selected={selected}
                  hovered={hovered}
                  resetSignal={resetSignal}
                  nudge={nudge}
                  onSelect={(id) => setSelected((current) => (current === id ? null : id))}
                  onHover={setHovered}
                />
                <Environment key={theme} resolution={quality === "low" ? 64 : 128} frames={1}>
                  <Lightformer
                    form="rect"
                    intensity={theme === "dark" ? 1.3 : 0.7}
                    color={palette.keyLight}
                    position={[0, 5, 7]}
                    scale={[10, 5, 1]}
                  />
                  <Lightformer
                    form="rect"
                    intensity={theme === "dark" ? 0.9 : 0.35}
                    color={palette.accent}
                    position={[-7, -1, -5]}
                    rotation={[0, Math.PI / 3, 0]}
                    scale={[8, 6, 1]}
                  />
                  <Lightformer
                    form="ring"
                    intensity={theme === "dark" ? 1.2 : 0.4}
                    color={palette.violet}
                    position={[6, -5, -8]}
                    scale={3.4}
                  />
                </Environment>
              </Canvas>
            ) : (
              <p className="label playground-placeholder">Loading 3D viewport…</p>
            )}

            <p className="label playground-hint" aria-hidden="true">
              Drag to orbit · arrow keys to rotate · + / − to frame
            </p>
          </div>

          <div className="playground-controls">
            <fieldset className="control-group">
              <legend className="label">Material</legend>
              <div className="control-row">
                {MATERIALS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`chip ${material === option.id ? "is-on" : ""}`}
                    aria-pressed={material === option.id}
                    onClick={() => setMaterial(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="control-group">
              <p className="label">Camera distance</p>
              <div className="control-row control-row-slider">
                <Shrink size={14} aria-hidden="true" />
                <input
                  type="range"
                  min={DISTANCE.min}
                  max={DISTANCE.max}
                  step={0.1}
                  value={distance}
                  onChange={(event) => setDistance(Number(event.target.value))}
                  aria-label="Camera distance"
                />
                <Expand size={14} aria-hidden="true" />
              </div>
            </div>

            <div className="control-group">
              <p className="label">Render</p>
              <div className="control-row">
                <button
                  type="button"
                  className={`chip ${wireframe ? "is-on" : ""}`}
                  aria-pressed={wireframe}
                  onClick={() => setWireframe((value) => !value)}
                >
                  <Grid3X3 size={14} aria-hidden="true" />
                  Wireframe
                </button>
                <button
                  type="button"
                  className={`chip ${paused ? "" : "is-on"}`}
                  aria-pressed={!paused}
                  onClick={() => setPaused((value) => !value)}
                >
                  {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
                  {paused ? "Resume motion" : "Pause motion"}
                </button>
                <button
                  type="button"
                  className={`chip ${autoSpin ? "is-on" : ""}`}
                  aria-pressed={autoSpin}
                  onClick={() => setAutoSpin((value) => !value)}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  Auto-orbit
                </button>
                <button type="button" className="chip" onClick={resetView}>
                  <RefreshCw size={14} aria-hidden="true" />
                  Reset view
                </button>
              </div>
            </div>

            <div className="control-group">
              <p className="label">Inspect components</p>
              <div className="part-list">
                {PLAYGROUND_PARTS.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    className={`part-button ${selected === part.id ? "is-selected" : ""}`}
                    aria-pressed={selected === part.id}
                    onMouseEnter={() => setHovered(part.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected((current) => (current === part.id ? null : part.id))}
                  >
                    <Boxes size={14} aria-hidden="true" />
                    {part.name}
                  </button>
                ))}
              </div>
              <p className="part-detail" aria-live="polite">
                {focusedPart
                  ? focusedPart.spec
                  : "Hover or select a component to highlight it in the scene and read its spec."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
