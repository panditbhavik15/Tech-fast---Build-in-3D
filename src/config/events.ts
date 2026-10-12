/**
 * Interactive Event Explorer content.
 *
 * SAMPLE DATA: formats, tracks and prizes here are illustrative placeholders so
 * the explorer can be demonstrated. Replace with confirmed official Techfest
 * details before publishing — nothing below is presented as verified.
 */

export type EventVisual = "network" | "gears" | "terminal" | "orbit" | "circuit" | "lattice";

export type EventCategory = {
  id: string;
  index: string;
  title: string;
  blurb: string;
  detail: string;
  visual: EventVisual;
  /** Accent rotation keeps six cards coherent but individually identifiable. */
  tone: "accent" | "violet" | "silver";
  format: string;
  duration: string;
  tracks: string[];
  outcomes: string[];
};

export const eventCategories: EventCategory[] = [
  {
    id: "ai-ml",
    index: "01",
    title: "Artificial Intelligence & Machine Learning",
    blurb: "Models, agents and the question of what a machine should be trusted to decide.",
    detail:
      "An idea-to-prototype lane for applied intelligence: dataset building, model evaluation, and interfaces that make a model legible to a human operator.",
    visual: "network",
    tone: "accent",
    format: "Team build + reviewed demo",
    duration: "Sample: 36 hours",
    tracks: ["Applied vision", "Retrieval & agents", "Responsible AI"],
    outcomes: ["Working prototype", "Model card", "Live evaluation"],
  },
  {
    id: "robotics",
    index: "02",
    title: "Robotics & Automation",
    blurb: "Mechanisms, control loops, and machines that have to survive contact with reality.",
    detail:
      "Hardware-first challenge track. Teams design a mechanism, close the control loop, and run an obstacle course under time pressure.",
    visual: "gears",
    tone: "silver",
    format: "Arena rounds",
    duration: "Sample: 2 days",
    tracks: ["Autonomous navigation", "Manipulator design", "Line & maze bots"],
    outcomes: ["Fabricated build", "Arena run sheet", "Control-loop telemetry"],
  },
  {
    id: "coding",
    index: "03",
    title: "Coding & Hackathons",
    blurb: "Twelve hours, one prompt, and a product that has to actually run on stage.",
    detail:
      "The competitive core of the festival: open-source tooling, web and mobile builds, and a judged final demo with live code review.",
    visual: "terminal",
    tone: "accent",
    format: "Hackathon sprint",
    duration: "Sample: 12 hours",
    tracks: ["Web & product", "Developer tooling", "Open source"],
    outcomes: ["Deployed build", "Repository review", "Stage demo"],
  },
  {
    id: "space",
    index: "04",
    title: "Space & Aerospace Technology",
    blurb: "Orbits, payloads, and engineering for environments that offer no second chances.",
    detail:
      "Systems track covering launch dynamics, payload design, and mission planning, culminating in a design review board.",
    visual: "orbit",
    tone: "violet",
    format: "Mission design review",
    duration: "Sample: 1 day",
    tracks: ["Orbital mechanics", "Payload & avionics", "Mission planning"],
    outcomes: ["Mission brief", "Mass budget", "Review board verdict"],
  },
  {
    id: "electronics",
    index: "05",
    title: "Electronics & Innovation",
    blurb: "Silicon, sensors and signal paths — invention you can hold.",
    detail:
      "Embedded systems and product-innovation track: schematic to breadboard to enclosure, judged on originality and build quality.",
    visual: "circuit",
    tone: "silver",
    format: "Expo booth + judging circuit",
    duration: "Sample: 2 days",
    tracks: ["Embedded & IoT", "Sensor design", "Product prototyping"],
    outcomes: ["Working circuit", "Enclosure prototype", "Booth pitch"],
  },
  {
    id: "gaming",
    index: "06",
    title: "Gaming & Esports",
    blurb: "Real-time systems, game feel, and competition under pressure.",
    detail:
      "Split into a game-jam build lane and a team-esports arena, sharing one stage and one audience.",
    visual: "lattice",
    tone: "violet",
    format: "Game jam + bracket",
    duration: "Sample: 48 hours",
    tracks: ["Game jam", "Team arena", "Live casting"],
    outcomes: ["Playable build", "Bracket result", "Replay review"],
  },
];
