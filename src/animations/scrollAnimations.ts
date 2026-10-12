import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, setWorld } from "../state/world";

gsap.registerPlugin(ScrollTrigger);

/** Sections that drive the shared 3D camera. */
export const NARRATIVE_SECTIONS = ["hero", "ch01", "ch02", "ch03", "ch04", "ch05", "finale"];

export type ScrollAnimationHandle = { kill: () => void };

export function createScrollAnimations(): ScrollAnimationHandle {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const triggers: ScrollTrigger[] = [];

  /* 1. Per-section scroll progress -> world state (no React renders). */
  NARRATIVE_SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    motion.progress[id] = 0;
    triggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          motion.progress[id] = self.progress;
        },
        onRefresh: (self) => {
          motion.progress[id] = self.progress;
        },
      }),
    );
  });

  /* 2. Which section owns the camera + navigation state. */
  const owned = NARRATIVE_SECTIONS.map((id) => document.getElementById(id)).filter(
    (el): el is HTMLElement => el !== null,
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).id;
          setWorld({ activeSection: id, backgroundPaused: false });
        }
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  owned.forEach((el) => observer.observe(el));

  /* 3. The DOM-only block (playground, events, about) pauses the world. It is
        one wrapper element so a lazily mounted section cannot be missed. The
        narrative observer below re-enables rendering on the way out. */
  const quietGroup = document.getElementById("dom-sections");
  const quietObserver = new IntersectionObserver(
    (entries) => {
      const centred = entries.some((entry) => entry.isIntersecting);
      setWorld({ backgroundPaused: centred });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
  );
  if (quietGroup) quietObserver.observe(quietGroup);

  /* 4. Chapter copy choreography: enter, hold, leave. */
  const animations: gsap.core.Timeline[] = [];
  if (!reduceMotion) {
    gsap.utils.toArray<HTMLElement>("[data-chapter-copy]").forEach((el) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el.closest("section") ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(
        el,
        { autoAlpha: 0, y: 72 },
        { autoAlpha: 1, y: 0, ease: "none", duration: 0.35 },
        0,
      )
        .to(el, { autoAlpha: 1, y: 0, ease: "none", duration: 0.3 }, 0.35)
        .to(el, { autoAlpha: 0, y: -56, ease: "none", duration: 0.35 }, 0.65);
      animations.push(tl);
    });

    gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
      const distance = Number(el.dataset.parallax ?? 40);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el.closest("section") ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      tl.fromTo(el, { y: distance }, { y: -distance, ease: "none" });
      animations.push(tl);
    });
  }

  /* 5. Scroll progress indicator. */
  triggers.push(
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        document.documentElement.style.setProperty("--scroll-progress", String(self.progress));
      },
    }),
  );

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  // Fonts settle after first paint, which changes section heights.
  const fontTimer = window.setTimeout(refresh, 600);

  return {
    kill: () => {
      window.clearTimeout(fontTimer);
      window.removeEventListener("load", refresh);
      animations.forEach((tl) => tl.scrollTrigger?.kill());
      animations.forEach((tl) => tl.kill());
      triggers.forEach((t) => t.kill());
      observer.disconnect();
      quietObserver.disconnect();
      gsap.killTweensOf("[data-chapter-copy]");
    },
  };
}

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = id === "hero" ? 0 : el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
}
