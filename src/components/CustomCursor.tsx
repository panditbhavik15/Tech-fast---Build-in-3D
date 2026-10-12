import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motion } from "../state/world";
import { useCoarsePointer, usePrefersReducedMotion } from "../hooks/useAppState";

/**
 * Desktop-only cursor: a hairline ring that grows over interactive elements and
 * feeds smoothed pointer parallax into the 3D scene. Never enabled on touch.
 * Follow lag is GSAP's `quickTo` rather than a hand-written rAF loop, so the
 * tweens live on GSAP's shared ticker and die with the component.
 */
export default function CustomCursor() {
  const coarse = useCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ringEl = ring.current;
    const dotEl = dot.current;
    if (coarse || reduceMotion || !ringEl || !dotEl) {
      document.body.classList.remove("has-custom-cursor");
      return;
    }
    document.body.classList.add("has-custom-cursor");

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    gsap.set([ringEl, dotEl], { x: startX, y: startY });

    const followX = gsap.quickTo(ringEl, "x", { duration: 0.42, ease: "power3" });
    const followY = gsap.quickTo(ringEl, "y", { duration: 0.42, ease: "power3" });
    const grow = gsap.quickTo(ringEl, "scale", { duration: 0.28, ease: "power2.out" });
    const fade = gsap.quickTo(ringEl, "opacity", { duration: 0.3, ease: "power1.out" });
    const dotX = gsap.quickTo(dotEl, "x", { duration: 0.06, ease: "power1.out" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: 0.06, ease: "power1.out" });

    const onMove = (event: PointerEvent) => {
      const { clientX: x, clientY: y } = event;
      const target = event.target instanceof Element ? event.target : null;
      const hovering = Boolean(
        target?.closest("a, button, input, select, [data-cursor='grow'], canvas"),
      );
      followX(x);
      followY(y);
      dotX(x);
      dotY(y);
      grow(hovering ? 1.9 : 1);
      fade(hovering ? 0.9 : 0.5);
      // Normalised pointer feeds scene parallax.
      motion.pointer.x = (x / window.innerWidth) * 2 - 1;
      motion.pointer.y = -((y / window.innerHeight) * 2 - 1);
    };

    const onLeave = () => {
      motion.pointer.x = 0;
      motion.pointer.y = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onLeave);
      window.removeEventListener("blur", onLeave);
      gsap.killTweensOf([ringEl, dotEl]);
    };
  }, [coarse, reduceMotion]);

  if (coarse || reduceMotion) return null;

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
