/**
 * Scroll progress rail. Driven by the `--scroll-progress` custom property that
 * GSAP ScrollTrigger writes, so it costs no React renders per scroll tick.
 */
export default function ScrollProgress() {
  return (
    <div className="scroll-progress" aria-hidden="true">
      <span className="scroll-progress-fill" />
    </div>
  );
}
