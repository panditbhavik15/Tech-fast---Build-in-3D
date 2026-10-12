import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useAppState";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="icon-button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={toggle}
    >
      <span className="icon-button-track" aria-hidden="true">
        <span className="icon-button-thumb" data-side={isDark ? "left" : "right"}>
          {isDark ? <Moon size={13} /> : <Sun size={13} />}
        </span>
      </span>
    </button>
  );
}
