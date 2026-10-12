import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { motion } from "../state/world";
import { useWorldState } from "../hooks/useAppState";

/**
 * Fades from black and drives the timed object reveal. Scroll never blocks on
 * this: the intro only decorates a scene that is already interactive, and the
 * overlay removes itself after a short grace period even if init stalls.
 */
export default function LoadingScreen() {
  const { sceneReady, webglAvailable } = useWorldState();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 4000);
    return () => window.clearTimeout(timeout);
  }, []);

  // Never hold the page for the scene: init success or the 4s grace period clears it.
  const dismissed = timedOut || sceneReady || !webglAvailable;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      motion.intro = 1;
      return;
    }
    const tween = gsap.to(motion, { intro: 1, duration: 2.4, ease: "power2.out", delay: 0.15 });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className={`loading-screen ${dismissed ? "is-hidden" : ""}`} aria-hidden="true">
      <div className="loading-inner">
        <span className="label">Techfest / Beyond Dimensions</span>
        <span className="loading-bar">
          <span />
        </span>
      </div>
    </div>
  );
}
