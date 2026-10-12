import type { EventVisual } from "../config/events";

type Props = { variant: EventVisual; className?: string };

const TAU = Math.PI * 2;

function pointsOnCircle(count: number, radius: number, cx = 100, cy = 100) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * TAU;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as const;
  });
}

/**
 * Six procedural SVG illustrations. They read as 3D wireframes, stay crisp at
 * any size, and cost nothing to render — the WebGL budget belongs to the world
 * scenes, not to six extra canvases.
 */
export default function EventVisualSvg({ variant, className }: Props) {
  const nodeRing = pointsOnCircle(9, 54);
  const innerRing = pointsOnCircle(6, 26);

  return (
    <svg
      viewBox="0 0 200 200"
      className={`event-visual ${className ?? ""}`}
      role="img"
      aria-label={`${variant.replace("-", " ")} visual`}
      focusable="false"
    >
      {variant === "network" && (
        <g>
          {nodeRing.map(([x, y], index) => (
            <g key={`n-${index}`}>
              <line x1="100" y1="100" x2={x} y2={y} className="visual-stroke" />
              <circle cx={x} cy={y} r="3.5" className="visual-node" />
            </g>
          ))}
          <circle cx="100" cy="100" r="12" className="visual-hub" />
          <g className="visual-spin-slow" style={{ transformOrigin: "100px 100px" }}>
            <ellipse cx="100" cy="100" rx="72" ry="26" className="visual-stroke" />
          </g>
        </g>
      )}

      {variant === "gears" && (
        <g className="visual-spin" style={{ transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="100" r="42" className="visual-stroke" />
          <circle cx="100" cy="100" r="14" className="visual-stroke" />
          {pointsOnCircle(12, 48).map(([x, y], index) => (
            <rect
              key={`t-${index}`}
              x={x - 4}
              y={y - 4}
              width="8"
              height="8"
              className="visual-fill"
              transform={`rotate(${index * 30} ${x} ${y})`}
            />
          ))}
        </g>
      )}

      {variant === "terminal" && (
        <g>
          <rect x="34" y="52" width="132" height="96" className="visual-stroke" />
          <line x1="34" y1="74" x2="166" y2="74" className="visual-stroke" />
          <text x="46" y="98" className="visual-glyph">
            &gt; build
          </text>
          <text x="46" y="118" className="visual-glyph">
            &gt; ship
          </text>
          <rect x="46" y="128" width="54" height="6" className="visual-fill visual-blink" />
        </g>
      )}

      {variant === "orbit" && (
        <g>
          <ellipse
            cx="100"
            cy="100"
            rx="70"
            ry="28"
            className="visual-stroke"
            transform="rotate(-18 100 100)"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="46"
            ry="18"
            className="visual-stroke"
            transform="rotate(24 100 100)"
          />
          <circle cx="100" cy="100" r="20" className="visual-hub" />
          <g className="visual-orbit" style={{ transformOrigin: "100px 100px" }}>
            <circle cx="170" cy="100" r="5" className="visual-node" />
          </g>
        </g>
      )}

      {variant === "circuit" && (
        <g>
          <path
            d="M40 60 H96 V104 H160 M40 140 H74 V96 M120 140 H160 V108"
            className="visual-stroke visual-dash"
          />
          {nodeRing
            .slice(0, 6)
            .map(([x, y], index) => <rect key={`c-${index}`} x={x - 3} y={y - 3} width="6" height="6" className="visual-fill" />)}
          <circle cx="100" cy="100" r="9" className="visual-hub" />
        </g>
      )}

      {variant === "lattice" && (
        <g>
          <path
            d="M40 120 L70 60 L100 120 L130 60 L160 120 M40 120 H160 M70 60 H130"
            className="visual-stroke"
          />
          {innerRing.map(([x, y], index) => (
            <circle key={`l-${index}`} cx={x} cy={y} r="2.5" className="visual-node" />
          ))}
          <path d="M52 148 H148" className="visual-stroke visual-dash" />
        </g>
      )}
    </svg>
  );
}
