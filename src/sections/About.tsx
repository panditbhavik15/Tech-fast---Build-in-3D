import { useState } from "react";
import { about } from "../config/site";

/** The diagram nodes map to the principle list so one interaction drives both. */
const NODES = [
  { id: 0, x: 50, y: 18, label: "Curiosity" },
  { id: 1, x: 20, y: 66, label: "Build" },
  { id: 2, x: 80, y: 66, label: "Iterate" },
];

export default function About() {
  const [active, setActive] = useState(0);
  const principle = about.principles[active] ?? about.principles[0];

  return (
    <section id="about" className="about section-flush" aria-labelledby="about-title">
      <div className="shell about-grid">
        <div className="about-copy">
          <p className="label">
            <span className="label-accent">ABOUT</span> / the idea behind the experience
          </p>
          <h2 id="about-title" className="display-l" data-parallax="24">
            Where ideas become reality.
          </h2>
          <p className="body-lede">{about.body}</p>

          <dl className="about-facts">
            {about.facts.map((fact) => (
              <div className="about-fact" key={fact.label}>
                <dt className="label">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <p className="label about-edit-note">
            Official edition details are editable in src/config/site.ts — nothing here claims an
            institution, date or statistic as verified.
          </p>
        </div>

        <div className="about-visual">
          <div className="about-diagram grid-backdrop">
            <svg viewBox="0 0 100 84" role="img" aria-labelledby="about-diagram-title">
              <title id="about-diagram-title">
                Three-stage loop diagram: curiosity, build and iterate
              </title>
              <g className="diagram-web" fill="none" stroke="currentColor" strokeWidth="0.4">
                <circle cx="50" cy="46" r="30" className="diagram-ring" />
                <circle cx="50" cy="46" r="19" className="diagram-ring diagram-ring--inner" />
                {NODES.map((node) => (
                  <line
                    key={`line-${node.id}`}
                    x1="50"
                    y1="46"
                    x2={node.x}
                    y2={node.y}
                    className={active === node.id ? "is-active" : ""}
                  />
                ))}
                <polygon points={NODES.map((n) => `${n.x},${n.y}`).join(" ")} className="diagram-face" />
              </g>
              {NODES.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={active === node.id ? 3.4 : 2.2}
                    className={`diagram-node ${active === node.id ? "is-active" : ""}`}
                    onMouseEnter={() => setActive(node.id)}
                    onClick={() => setActive(node.id)}
                  />
                  <text x={node.x} y={node.y - 5} className="diagram-label" textAnchor="middle">
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="about-principle" aria-live="polite">
            <p className="label">
              <span className="label-accent">{String(active + 1).padStart(2, "0")}</span> / principle
            </p>
            <h3 className="about-principle-title">{principle.title}</h3>
            <p className="about-principle-text">{principle.text}</p>
          </div>

          <ul className="about-tabs" role="list">
            {about.principles.map((item, index) => (
              <li key={item.title}>
                <button
                  type="button"
                  className={`chip ${active === index ? "is-on" : ""}`}
                  aria-pressed={active === index}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
