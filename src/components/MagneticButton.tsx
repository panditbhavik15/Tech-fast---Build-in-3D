import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useCoarsePointer, usePrefersReducedMotion } from "../hooks/useAppState";

type Props = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  strength?: number;
};

/**
 * Magnetic pull toward the cursor, kept small so a button still behaves like a
 * button. Disabled for touch and reduced-motion users.
 */
export default function MagneticButton({
  children,
  className,
  href,
  onClick,
  ariaLabel,
  strength = 14,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const coarse = useCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 220, damping: 18, mass: 0.4 });
  const springY = useSpring(pointerY, { stiffness: 220, damping: 18, mass: 0.4 });
  const x = useTransform(springX, (value) => (coarse || reduceMotion ? 0 : value));
  const y = useTransform(springY, (value) => (coarse || reduceMotion ? 0 : value));

  const onMove = (event: ReactPointerEvent) => {
    if (coarse || reduceMotion || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    pointerX.set(((event.clientX - box.left) / box.width - 0.5) * strength * 2);
    pointerY.set(((event.clientY - box.top) / box.height - 0.5) * strength);
  };

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const content = (
    <span
      ref={ref}
      className={`btn ${className ?? ""}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerUp={reset}
    >
      {children}
    </span>
  );

  const motionWrapper = { style: { x, y }, whileTap: { scale: 0.985 } as const };

  if (href) {
    return (
      <motion.a
        href={href}
        aria-label={ariaLabel}
        onClick={(event) => {
          if (onClick) {
            event.preventDefault();
            onClick();
          }
        }}
        {...motionWrapper}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      {...motionWrapper}
      style={{ ...motionWrapper.style, background: "transparent", border: 0, padding: 0 }}
    >
      {content}
    </motion.button>
  );
}
