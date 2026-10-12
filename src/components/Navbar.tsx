import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navItems, site } from "../config/site";
import { scrollToSection } from "../animations/scrollAnimations";
import { useWorldState } from "../hooks/useAppState";
import ThemeToggle from "./ThemeToggle";

const SECTION_TO_NAV: Record<string, string> = {
  hero: "experience",
  ch01: "experience",
  ch02: "experience",
  ch03: "experience",
  ch04: "experience",
  ch05: "experience",
  playground: "playground",
  events: "events",
  about: "about",
  finale: "about",
};

export default function Navbar() {
  const { activeSection, theme } = useWorldState();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const activeNav = SECTION_TO_NAV[activeSection] ?? "";

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 40);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // Let the hamburger handle its own clicks, or the two handlers cancel out.
      if (toggleRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled || open
          ? "border-b bg-[color-mix(in_srgb,var(--c-void)_82%,transparent)] backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-6">
        <button
          type="button"
          className="group flex items-baseline gap-2 text-left"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={`${site.name} — back to top`}
        >
          <span className="font-display text-lg font-bold tracking-[-0.04em] uppercase">
            {site.name}
          </span>
          <span className="label hidden sm:inline">{site.tagline}</span>
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-link label ${activeNav === item.id ? "is-active" : ""}`}
              aria-current={activeNav === item.id ? "true" : undefined}
              onClick={(event) => {
                event.preventDefault();
                go(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="icon-button md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            ref={panelRef}
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t md:hidden"
          >
            <nav aria-label="Mobile" className="shell flex flex-col py-4">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`mobile-link label ${activeNav === item.id ? "is-active" : ""}`}
                  onClick={(event) => {
                    event.preventDefault();
                    go(item.id);
                  }}
                >
                  {item.label}
                </a>
              ))}
              <p className="label mt-3 opacity-70">
                {theme === "dark" ? "Dark palette active" : "Light palette active"}
              </p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
