import { Suspense, lazy, useEffect } from "react";
import Navbar from "./components/Navbar";
import ScrollProgress from "./components/ScrollProgress";
import CustomCursor from "./components/CustomCursor";
import LoadingScreen from "./components/LoadingScreen";
import WebGLFallback, { SceneErrorBoundary } from "./components/WebGLFallback";
import WorldCanvas from "./scenes/WorldCanvas";
import Hero from "./sections/Hero";
import Experience from "./sections/Experience";
import Events from "./sections/Events";
import About from "./sections/About";
import FinalCTA from "./sections/FinalCTA";
import Footer from "./sections/Footer";
import { createScrollAnimations } from "./animations/scrollAnimations";
import {
  syncReduceMotion,
  usePrefersReducedMotion,
  useWorldState,
} from "./hooks/useAppState";
import { setWorld } from "./state/world";
import type { Quality } from "./state/world";

/** The playground carries its own canvas, so it is worth splitting out. */
const Playground = lazy(() => import("./sections/Playground"));

/** Device capability decides particle counts, DPR and antialiasing up front. */
function detectQuality(): Quality {
  if (typeof navigator === "undefined") return "high";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (coarse || cores <= 4) return "low";
  if (cores <= 8) return "medium";
  return "high";
}

export default function App() {
  const { webglAvailable } = useWorldState();
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    syncReduceMotion(reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    setWorld({ quality: detectQuality() });
    const handle = createScrollAnimations();
    return () => handle.kill();
  }, []);

  return (
    <>
      <a href="#main" className="sr-only-focusable skip-link">
        Skip to content
      </a>

      <Navbar />
      <ScrollProgress />
      <CustomCursor />
      <LoadingScreen />

      <SceneErrorBoundary
        fallbackMessage="The animated world could not start on this device — static mode is on."
      >
        {webglAvailable ? <WorldCanvas /> : <WebGLFallback />}
      </SceneErrorBoundary>

      <main id="main" className="page">
        <Hero />
        <Experience />
        {/* One wrapper for the DOM-only block: the world pauses while it owns the
            viewport centre, whether or not the lazy section has mounted yet. */}
        <div id="dom-sections">
          <Suspense fallback={<PlaygroundPlaceholder />}>
            <Playground />
          </Suspense>
          <Events />
          <About />
        </div>
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}

/** Keeps the page height stable while the playground chunk is fetched. */
function PlaygroundPlaceholder() {
  return (
    <section className="playground playground--loading section-flush" aria-busy="true">
      <div className="shell">
        <p className="label">Loading the interactive playground…</p>
      </div>
    </section>
  );
}
