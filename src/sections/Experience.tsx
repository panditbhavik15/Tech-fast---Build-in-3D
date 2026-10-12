import { useState } from "react";
import { gsap } from "gsap";
import { ScanEye, RotateCw } from "lucide-react";
import { chapters } from "../config/site";
import { motion } from "../state/world";
import { scrollToSection } from "../animations/scrollAnimations";

const INSPECT_LABELS: Record<string, { title: string; items: string[] }> = {
  ch02: {
    title: "Inspect the network",
    items: ["Layer 01 — input", "Layer 02 — hidden", "Layer 03 — hidden", "Layer 04 — output"],
  },
  ch03: {
    title: "Inspect the assembly",
    items: ["Primary drive gear", "Pinion & idler", "Linear actuator", "Chassis frame"],
  },
};

/**
 * Chapters 01-05. Each section is taller than the viewport: the fixed 3D world
 * moves between anchors while the copy enters, holds and leaves with the same
 * scroll trigger, so text and camera belong to one gesture.
 */
export default function Experience() {
  return (
    <div id="experience" className="experience">
      {chapters.map((chapter, index) => (
        <section
          key={chapter.id}
          id={chapter.id}
          className={`chapter chapter--${index % 2 === 0 ? "left" : "right"}`}
          aria-labelledby={`${chapter.id}-title`}
        >
          <div
            className={`chapter-copy chapter-copy--${index % 2 === 0 ? "left" : "right"}`}
            data-chapter-copy
          >
            <p className="label chapter-kicker">
              <span className="label-accent">{chapter.index}</span> / {chapter.kicker}
            </p>
            <h2 id={`${chapter.id}-title`} className="display-l chapter-heading">
              {chapter.heading}
            </h2>
            <p className="body-lede">{chapter.body}</p>

            {chapter.id === "ch01" && (
              <div className="chapter-extra">
                <p className="label">Pointer moves the core. Scroll moves the camera.</p>
              </div>
            )}

            {(chapter.id === "ch02" || chapter.id === "ch03") && <InspectControl id={chapter.id} />}

            {chapter.id === "ch04" && (
              <div className="chapter-extra">
                <p className="label">
                  Wide orbit to low pass — the dolly is driven by this section&apos;s scroll position.
                </p>
              </div>
            )}

            {chapter.id === "ch05" && (
              <div className="chapter-extra">
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => scrollToSection("playground")}
                >
                  <RotateCw size={14} aria-hidden="true" />
                  Keep going: playground
                </button>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function InspectControl({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const labels = INSPECT_LABELS[id];
  const target = id === "ch02" ? "ai" : "robotics";

  const toggle = () => {
    const next = !open;
    setOpen(next);
    gsap.to(motion.inspect, {
      [target]: next ? 1 : 0,
      duration: 0.9,
      ease: "power2.out",
      overwrite: true,
    });
  };

  return (
    <div className="chapter-extra">
      <button
        type="button"
        className="btn btn-small"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`${id}-inspect`}
      >
        <ScanEye size={14} aria-hidden="true" />
        {open ? "Release view" : labels.title}
      </button>
      <ul id={`${id}-inspect`} className="inspect-list" hidden={!open}>
        {labels.items.map((item) => (
          <li key={item} className="label">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
