# TECHFEST — BEYOND DIMENSIONS

**Engineer the Impossible.** An immersive, scroll-driven 3D web experience built for the
Techfest *Build in 3D* challenge.

Technology is not something visitors read about here — it is a world they enter, move
through, and manipulate. One continuous WebGL scene runs behind the entire page while the
camera travels between five chapters, and a separate playground lets visitors take direct
control of a live 3D object.

> **Status: independent concept build.** All event names, dates, venues, formats, tracks and
> channels in this repository are **editable sample content**, clearly labelled as such in the
> UI. Nothing is presented as verified official Techfest information, and no institutional
> affiliation, statistic or sponsor is claimed. See [Editing the content](#editing-the-content).

---

## Live demo

_Not deployed at the time of writing._ Deploy instructions are in
[Deployment](#deployment); replace this line with the live URL once it is published and
verified.

---

## The experience

| Section | What happens |
| --- | --- |
| **Hero** | Full-screen procedural energy core: faceted metal shell, emissive inner octahedron, three independently orbiting rings, particles bound to ring paths. Timed reveal from black, cursor-responsive tilt, off-centre editorial framing on wide screens. |
| **01 Enter the dimension** | The camera closes on the same core; rings separate as scroll advances. |
| **02 Artificial intelligence** | The core gives way to a 3D neural lattice — nodes, forming connections, travelling signals. An *Inspect the network* control pulls the camera into layer detail. |
| **03 Robotics & engineering** | A procedural mechanical assembly (extruded gears, pinion, actuator, chassis). Hover a component to isolate it; click a 3D hotspot to read its role; drag to rotate the assembly. |
| **04 Space exploration** | A banded procedural planet with atmosphere rim, moons on inclined orbits, and a lit horizon; the camera moves from wide orbit to a low pass. |
| **05 The innovation core** | Neural, mechanical and orbital elements converge into one composition — the visual climax. |
| **Playground** | A dedicated, self-contained canvas: drag/keyboard rotation, camera-distance slider, four real material paths, wireframe, motion pause, auto-orbit, reset view, hover highlighting and click-to-inspect parts. |
| **Events** | Six editorial categories with distinct procedural visuals, tilt-on-pointer depth, and an accessible detail dialog. |
| **About** | Interactive principle diagram over a technical grid, plus editable official-information fields. |
| **Finale** | The completed core, a quiet background, and the call to action. |

---

## Tech stack

- **React 19 + TypeScript 5.9 + Vite 8** — application shell and build.
- **Tailwind CSS 4** (`@tailwindcss/vite`, `@theme` tokens) — utilities and design tokens.
- **Three.js 0.186 + @react-three/fiber 9 + @react-three/drei 10** — all real 3D rendering.
  Every mesh, texture and material is procedural; **no model, HDRI or texture file is
  downloaded**. Orbiting in the playground is drei's `OrbitControls` rather than custom math.
- **@react-three/postprocessing + postprocessing** — the cinematic grade: bloom, film grain,
  vignette and an explicit neutral tone-map, in one composer chain.
- **GSAP 3.15 + ScrollTrigger** — scroll progress, camera choreography, chapter copy
  timelines, scroll-progress rail, and `quickTo` for the cursor-follow ring.
- **Framer Motion 14** — interface-level transitions only (hero reveal, modal, magnetic
  buttons). It never animates the same property GSAP owns.
- **lucide-react** — icons.

No state-management library: see the next section for the two-tier state model that replaces it.

---

## How it is built

### One world, one camera

`src/scenes/WorldCanvas.tsx` renders a **single fixed full-screen canvas** shared by the hero,
all five chapters and the finale. Each narrative section has a *shot* (camera position, look-at
target, dolly distance). A damped `CameraRig` interpolates between shots, so changing sections
reads as one continuous camera move rather than a set of cuts. Off-screen chapter groups are
hidden by their own presence curve, and the render loop stops entirely
(`frameloop="never"`) while the DOM-only sections are on screen.

The playground is the only other canvas, and it is contained rather than full-screen, so no
more than one large 3D surface ever renders at a time.

### Scroll never re-renders React

`src/state/world.ts` splits state in two:

- `motion` — a plain mutable object (per-section progress, pointer, camera targets, intro
  timer, inspect targets). ScrollTrigger writes into it; scenes read it inside `useFrame`.
  Zero React renders per scroll or pointer tick.
- A tiny external store (`getWorld` / `setWorld` / `subscribeWorld`) consumed through
  `useSyncExternalStore` for discrete facts only: theme, quality tier, active section,
  pause, WebGL availability.

### Theme without rebuilding the scene

Toggling black/white does **not** reconstruct materials or lights. Each frame lerps colours
and intensities toward the target palette (`paletteFor(theme)` mirrors the CSS custom
properties in `src/styles/globals.css`), so the switch is a smooth cross-fade. Only the
locally-rendered reflection environment remounts, which is a single cheap pass.

### Nothing ever freezes

Every object in the narrative world carries its own idle motion on top of the scroll
choreography, so a paused reader still sees a live scene rather than a still frame:

- the hero core's rings wobble on their radius, its shell precesses and its particle orbits flow;
- the AI lattice breathes — nodes float, and the edges and travelling signals are rebuilt from
  the same live positions each frame;
- the machine hums: parts micro-vibrate once assembled, gears mesh, the hub spins;
- the planetary system rides a slow ellipse, moons precess inside carrier groups that hold both
  the moon and its orbit line, and the sun sprite swells;
- the finale's shards keep tumbling after they lock into formation.

All of it is driven by one shared clock (`motion.time`) and one damped pointer, and every term
collapses to zero under `prefers-reduced-motion` or the playground's pause control.

### The background is a layer of its own

`src/scenes/AmbientBackdrop.tsx` sits behind the narrative objects and keeps the empty space
alive, so no chapter ever reads as geometry floating on a flat fill:

- **drifting motes** — a points cloud (110/200/340 by device tier) that rotates slowly, rides a
  lateral current and inhales on a scale curve, with its own size and opacity pulse. The
  current matters: the field sits far downrange, so a purely angular crawl never crosses a
  perceptible pixel delta and the hero background measures as still. Every mote is placed
  *behind* the near plane (`z <= -12`) because one passing through it would flash a
  screen-filling blob;
- **breathing haze** — three large sprites parked at different depths down the corridor, so at
  least one is always in frame. Each wanders a lazy ellipse and swells on its own phase offset,
  and position and scale run on different clocks, so the bands never pulse in lockstep.

Both are fog-exempt with `depthWrite={false}`, so they read as atmosphere rather than geometry,
and both lerp to the opposite palette values in light mode (normal blending, lower opacity)
instead of re-mounting. The star field breathes the same way — combined rotation drift plus a
slow whole-field zoom.

### Performance

- Adaptive DPR and particle/geometry budgets per device tier (`qualityTiers` in
  `src/config/palette.ts`), chosen from pointer type and core count at startup.
- Instanced meshes for satellites, moons and particle clouds; shared procedural geometries
  and canvas textures; no real-time shadow maps.
- The post-processing grade is a single composer on the high and medium tiers and is switched
  off entirely on `low`. It carries an explicit tone-map effect because three skips a material's
  tone mapping whenever it renders into a target instead of the screen.
- The playground chunk (and therefore its canvas) is code-split and mounts on first view.
- GPU resources are disposed on unmount; GSAP timelines, observers and listeners are killed
  on teardown.

### Accessibility

- Semantic landmarks, one `h1`, ordered headings, every control labelled.
- Keyboard: skip link, focus-visible rings, full nav, chapter inspect controls, playground
  arrow-key rotation and `+`/`-` zoom, Escape-closing modal with focus trapped and restored.
- `prefers-reduced-motion` is honoured throughout: the intro resolves instantly, camera
  damping becomes near-instant, drift and auto-orbit stop, custom cursor and card tilt are
  disabled, and the copy is shown instead of animated.
- All narrative, event and control text is DOM content and stays readable with the 3D world
  absent. `?static=1` forces the no-WebGL fallback path so it can be reviewed on any machine.

---

## Getting started

**Prerequisites:** Node.js 20+ and npm 10+. A WebGL2-capable browser for the 3D world
(WebGL1 also works; without either, the static fallback is used).

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR. |
| `npm run build` | `tsc -b` type-check, then production bundle into `dist/`. |
| `npm run preview` | Serve the built bundle locally. |
| `npm run lint` | ESLint (flat config, typescript-eslint, react-hooks, react-refresh). |
| `npm run typecheck` | `tsc -b --noEmit`. |

---

## Project structure

```
src/
  animations/scrollAnimations.ts   ScrollTrigger wiring: progress, active section, copy timelines
  components/                      Navbar, ThemeToggle, Modal, EventCard, EventVisualSvg,
                                   MagneticButton, CustomCursor, ScrollProgress,
                                   LoadingScreen, WebGLFallback (+ SceneErrorBoundary)
  config/                          site.ts (copy + chapter anchors), events.ts, playground.ts,
                                   palette.ts (3D mirror of the CSS tokens + quality tiers)
  hooks/useAppState.ts             theme, media queries, WebGL probe, store access
  scenes/                          WorldCanvas + Hero/AI/Robotics/Space/Innovation/Playground
                                   + AmbientBackdrop (dust + haze) + Effects (post grade)
  scenes/lib/textures.ts           procedural glow sprite, planet bands, gear geometry
  sections/                        Hero, Experience, Playground, Events, About, FinalCTA, Footer
  state/world.ts                   mutable motion state + discrete external store
  styles/globals.css               design tokens, component classes, layout
```

---

## Editing the content

Everything user-facing is data, not JSX:

| File | Contains |
| --- | --- |
| `src/config/site.ts` | Wordmark, tagline, hero copy, nav items, chapter headings and their 3D camera anchors, About facts and principles, final CTA, social links, footer note. |
| `src/config/events.ts` | The six event categories: title, blurb, detail, format, duration, tracks, outcomes, visual variant, accent tone. |
| `src/config/playground.ts` | Playground material list and the inspectable component specs. |
| `src/config/palette.ts` | The dark and light 3D palettes and per-tier quality budgets. |

Before publishing an official edition, replace the placeholder values in `site.ts`
(`editionLabel`, `about.facts`) and `events.ts`, and fill in `socialLinks` — entries with an
empty `href` are rendered as "not configured" rather than as dead links.

---

## Deployment

The build output in `dist/` is fully static.

**Vercel / Netlify:** framework *Vite*, build `npm run build`, output `dist`.
**GitHub Pages:** set Vite `base` to the repository sub-path, build, and publish `dist`.

```bash
npm run build && npm run preview   # verify the production bundle before deploying
```

---

## Verification status

Verified in real headless Chrome (SwiftShader WebGL) against the dev server, with
screenshots captured at 1440x900 and 390x844 in both themes:

- `tsc -b`, ESLint and `vite build` all run clean.
- Twenty screenshots reviewed by eye: hero, all four later chapters, six playground states
  (default, wireframe, emissive, inspected part, max distance, paused), the event grid, an
  open modal, About, the finale, the light-theme trio, and four mobile views.
- Theme toggle switches `data-theme`, writes `localStorage`, updates the `theme-color` meta
  and every 3D material, survives a reload, and never re-creates the canvas.
- Event modal opens from a card and closes on Escape; both states confirmed in the DOM.
- Playground controls write to the live scene: wireframe, emissive material, part inspection
  and the distance slider all visibly change the rendered frame.
- **Continuous motion audit**: every visible object in all five narrative chapters was
  sampled twice, 800 ms apart, with the page idle. Every drawable object changed its world
  matrix (32-42 objects per chapter); the only static entries are the four fixed rig lights.
- Mobile: `scrollWidth === clientWidth === 390`, so no horizontal overflow.
- Console and network: no errors and no failed requests (the `/favicon.ico` 404 found in an
  earlier pass is fixed with an original `public/favicon.svg`).
- **Ambient background audit**: two frames 1.6 s apart, page idle, diffed per pixel in
  SwiftShader. With motion allowed, 83.5% of the full hero-to-space frame changes in chapter 4
  and 19.5% in the hero (35.4% across the background column beside the core). Under
  `prefers-reduced-motion` the same comparison falls to 0.4% and then 0.1% on a second sample,
  i.e. a genuine still frame.
- **Reframe timing after a jump**: returning to the top from the finale by instant jump, smooth
  scroll and a logo click each bring the hero core back into frame within ~1.5-2.5 s, measured
  by region luminance every 800 ms. It always recovers; nothing stays missing.


---

## Known limitations

- Reflections come from a locally rendered light environment, not an HDRI, so metals read as
  stylised rather than photoreal.
- The robotics assembly is procedural and intentionally abstract; it is not a mechanical
  model of a real machine.
- The AI chapter is an artistic representation of connected systems and says so — no model is
  trained, inferred or claimed.
- Drag-to-rotate on the background world is desktop-only; on touch devices the canvas ignores
  pointer events so vertical scrolling is never captured, and the playground provides
  touch-friendly rotation instead.
- The camera damps between section poses instead of cutting, so an extreme programmatic jump
  (or a theme switch taken far down the page and then a jump to the top) leaves the hero
  re-framing for a second or two. It settles on its own and is most visible under software
  WebGL, where the reflection environment also takes longer to regenerate.
- No audio: ambient sound was left out deliberately rather than shipping a half-finished
  autoplay-prone feature.
- Content is sample data (see the notice at the top).

---

## Licence

This is a concept build for the Techfest *Build in 3D* challenge. It is not affiliated with or
endorsed by any institution, and no licence is granted over the "Techfest" name or marks.
Replace this section before publishing if you hold the rights to do so.
