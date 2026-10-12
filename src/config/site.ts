/**
 * Every user-facing string and piece of event information lives here so the
 * site can be re-branded for an official Techfest edition by editing one file.
 *
 * SAMPLE CONTENT NOTICE: dates, venues, tracks and prizes below are editable
 * placeholders, not verified official event details.
 */

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export const site = {
  name: "TECHFEST",
  tagline: "Beyond Dimensions",
  statement: "Engineer the Impossible.",
  lede: "Enter a world of intelligent machines, ambitious ideas, and technology without boundaries.",
  editionLabel: "SAMPLE EDITION / CONTENT IS EDITABLE",
  year: "2026",
  experienceIndex: "INTERACTIVE TECHNOLOGY EXPERIENCE / 01",
} as const;

export const navItems: NavItem[] = [
  { id: "experience", label: "Experience", href: "#experience" },
  { id: "playground", label: "Playground", href: "#playground" },
  { id: "events", label: "Events", href: "#events" },
  { id: "about", label: "About", href: "#about" },
];

export type Chapter = {
  id: string;
  index: string;
  kicker: string;
  heading: string;
  body: string;
  /** Anchor position of this chapter's scene inside the shared 3D world. */
  anchor: [number, number, number];
  /** Camera offset used while the chapter is in focus. */
  cameraOffset: [number, number, number];
  lookOffset: [number, number, number];
};

export const chapters: Chapter[] = [
  {
    id: "ch01",
    index: "01",
    kicker: "Enter the dimension",
    heading: "Welcome to the next dimension.",
    body: "A single procedural core anchors the experience. As you scroll, the camera travels through a connected world rather than jumping between pages.",
    anchor: [0, 0, 0],
    cameraOffset: [0, 0.4, 9.5],
    lookOffset: [0, 0, 0],
  },
  {
    id: "ch02",
    index: "02",
    kicker: "Artificial intelligence",
    heading: "Intelligence, reimagined.",
    body: "Nodes link, signal and reorganise. An artistic representation of connected intelligence, not a trained model.",
    anchor: [26, -4, -8],
    cameraOffset: [0, 2.5, 15],
    lookOffset: [0, 0, 0],
  },
  {
    id: "ch03",
    index: "03",
    kicker: "Robotics & engineering",
    heading: "Built by imagination. Engineered for reality.",
    body: "A procedural mechanical assembly: gears, frame, actuator. Hover a component to isolate it, click a hotspot to read its role.",
    anchor: [-26, -12, -10],
    cameraOffset: [7, 3, 14],
    lookOffset: [0, 0, 0],
  },
  {
    id: "ch04",
    index: "04",
    kicker: "Space exploration",
    heading: "Beyond the known.",
    body: "The camera leaves the workshop for orbit: a procedural planet, its moons, and a lit horizon in deep space.",
    anchor: [4, -34, -18],
    cameraOffset: [0, 4, 22],
    lookOffset: [0, 1, 0],
  },
  {
    id: "ch05",
    index: "05",
    kicker: "The innovation core",
    heading: "Every breakthrough starts with a question.",
    body: "Neural structure, mechanics and orbit converge into one composition — the visual climax of the journey.",
    anchor: [-18, -54, -6],
    cameraOffset: [2, 3, 17],
    lookOffset: [0, 0, 0],
  },
];

export const about = {
  heading: "Where ideas become reality.",
  body: "Techfest celebrates curiosity, engineering, creativity, and the pursuit of new possibilities. It is a space for exploring emerging technologies, challenging assumptions, and transforming ambitious ideas into experiences.",
  /**
   * EDITABLE OFFICIAL FIELDS — replace with confirmed institution data before
   * publishing. Values are intentionally neutral placeholders.
   */
  facts: [
    { label: "Edition", value: "Sample edition — edit in src/config/site.ts" },
    { label: "Dates", value: "To be confirmed" },
    { label: "Venue", value: "To be confirmed" },
    { label: "Organised by", value: "To be confirmed" },
  ],
  principles: [
    {
      title: "Curiosity first",
      text: "Questions drive the build. Every track starts from something unexplained.",
    },
    {
      title: "Engineered, not staged",
      text: "Prototypes are judged on working systems, not renders or decks.",
    },
    {
      title: "Open to experiment",
      text: "Failure is data. The experience keeps what works and iterates the rest.",
    },
  ],
};

export const finalCta = {
  heading: "The future is waiting.",
  body: "Your next idea could change everything. Step forward and explore what is possible.",
};

/**
 * Social links are configuration, not claims. Left unresolved on purpose so no
 * fabricated official account is implied; add real URLs before deployment.
 */
export const socialLinks: { label: string; href: string }[] = [
  { label: "Instagram", href: "" },
  { label: "LinkedIn", href: "" },
  { label: "GitHub", href: "" },
];

export const footer = {
  note: "Independent fan-made concept experience. Sample content is illustrative and editable; no official affiliation is implied.",
  builtWith: "React · Three.js · React Three Fiber · GSAP ScrollTrigger · Tailwind CSS",
};
