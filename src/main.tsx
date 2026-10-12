import { createRoot } from "react-dom/client";
import App from "./App";
import { detectWebgl } from "./hooks/useAppState";
import { setWorld } from "./state/world";
import "./styles/globals.css";

// Probed before the first render so no canvas is ever attempted on a device
// that cannot provide a WebGL context. `?static=1` forces the same path, which
// is how the static fallback is reviewed without a GPU-less device.
const forcedStatic = new URLSearchParams(window.location.search).has("static");
setWorld({ webglAvailable: forcedStatic ? false : detectWebgl() });

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(<App />);
