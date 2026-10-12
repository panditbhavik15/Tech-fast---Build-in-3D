import { motion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { site } from "../config/site";
import { scrollToSection } from "../animations/scrollAnimations";
import { usePrefersReducedMotion } from "../hooks/useAppState";
import MagneticButton from "../components/MagneticButton";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const reduceMotion = usePrefersReducedMotion();

  const rise: Variants = {
    hidden: { y: "105%" },
    show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
  };
  const fade: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  };
  const animate = "show" as const;
  const initial = reduceMotion ? false : "hidden";

  return (
    <section id="hero" className="hero section-flush" aria-labelledby="hero-title">
      <div className="shell hero-inner">
        <motion.p className="label hero-index" variants={fade} initial={initial} animate={animate}>
          {site.experienceIndex}
        </motion.p>

        <h1 id="hero-title" className="display-xl hero-title">
          {["TECH", "FEST"].map((word, index) => (
            <span key={word} className="reveal-line">
              <motion.span
                variants={rise}
                initial={initial}
                animate={animate}
                transition={{ delay: reduceMotion ? 0 : 0.2 + index * 0.08 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
          <motion.span
            className="hero-sub"
            variants={fade}
            initial={initial}
            animate={animate}
            transition={{ delay: reduceMotion ? 0 : 0.55, duration: 0.8 }}
          >
            {site.statement}
          </motion.span>
        </h1>

        <motion.p
          className="body-lede hero-lede"
          variants={fade}
          initial={initial}
          animate={animate}
          transition={{ delay: reduceMotion ? 0 : 0.72 }}
        >
          {site.lede}
        </motion.p>

        <motion.div
          className="hero-actions"
          variants={fade}
          initial={initial}
          animate={animate}
          transition={{ delay: reduceMotion ? 0 : 0.9 }}
        >
          <MagneticButton
            className="btn-primary"
            onClick={() => scrollToSection("ch01")}
            ariaLabel="Explore the universe: jump to chapter one"
          >
            Explore the universe
          </MagneticButton>
          <MagneticButton
            onClick={() => scrollToSection("about")}
            ariaLabel="Discover Techfest: jump to the about section"
          >
            Discover Techfest
          </MagneticButton>
        </motion.div>

        <motion.p
          className="label hero-note"
          variants={fade}
          initial={initial}
          animate={animate}
          transition={{ delay: reduceMotion ? 0 : 1.1 }}
        >
          {site.editionLabel}
        </motion.p>
      </div>

      <button
        type="button"
        className="scroll-indicator"
        onClick={() => scrollToSection("ch01")}
        aria-label="Scroll to chapter one"
      >
        <span className="label">Scroll</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
