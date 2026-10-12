import { finalCta, site } from "../config/site";
import { scrollToSection } from "../animations/scrollAnimations";
import MagneticButton from "../components/MagneticButton";

/**
 * The conclusion shares the finale anchor in the world canvas: the camera keeps
 * moving while this copy scrolls in, so the last scene lands as a reveal.
 */
export default function FinalCTA() {
  return (
    <section id="finale" className="finale section-flush" aria-labelledby="finale-title">
      <div className="shell finale-inner">
        <p className="label">
          <span className="label-accent">END OF TRANSMISSION</span> / {site.name} {site.year}
        </p>
        <h2 id="finale-title" className="display-xl finale-title">
          The future is waiting.
        </h2>
        <p className="body-lede finale-lede">{finalCta.body}</p>
        <div className="finale-actions">
          <MagneticButton
            className="btn-primary"
            onClick={() => scrollToSection("events")}
            ariaLabel="Explore events"
          >
            Explore events
          </MagneticButton>
          <MagneticButton
            onClick={() => scrollToSection("hero")}
            ariaLabel="Back to top of the page"
          >
            Back to top
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
