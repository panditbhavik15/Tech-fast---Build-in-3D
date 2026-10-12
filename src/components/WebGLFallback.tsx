import { Component, type ReactNode } from "react";
import { setWorld } from "../state/world";

/**
 * Static substitute for the WebGL world. The scroll narrative, playground
 * controls and event explorer are DOM content, so nothing important is lost —
 * this panel simply replaces the animated backdrop with a readable surface.
 */
export default function WebGLFallback({ reason }: { reason?: string }) {
  return (
    <div className="world-fallback" role="img" aria-label="Decorative technology backdrop">
      <div className="world-fallback-grid" aria-hidden="true" />
      <div className="world-fallback-core" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="label world-fallback-note">
        {reason ?? "WebGL is unavailable on this device — the 3D world is running in static mode."}
      </p>
    </div>
  );
}

type BoundaryProps = { children: ReactNode; fallbackMessage: string };

/**
 * A scene failure must not take the page down: the canvas is dropped, the
 * static backdrop is shown, and the rest of the site keeps working.
 */
export class SceneErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error("Scene failed to render:", error);
    // Stop re-mounting the canvas: the world switches to static mode for good.
    setWorld({ webglAvailable: false, backgroundPaused: true, sceneReady: true });
  }

  render() {
    if (this.state.failed) {
      return <WebGLFallback reason={this.props.fallbackMessage} />;
    }
    return this.props.children;
  }
}
