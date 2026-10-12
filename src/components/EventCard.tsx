import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import type { EventCategory } from "../config/events";
import { useCoarsePointer, usePrefersReducedMotion } from "../hooks/useAppState";
import EventVisualSvg from "./EventVisualSvg";

type Props = {
  event: EventCategory;
  span: "wide" | "tall" | "normal";
  onOpen: (event: EventCategory) => void;
};

export default function EventCard({ event, span, onOpen }: Props) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const coarse = useCoarsePointer();
  const reduceMotion = usePrefersReducedMotion();

  const onMove = (pointer: ReactPointerEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card || coarse || reduceMotion) return;
    const box = card.getBoundingClientRect();
    const px = (pointer.clientX - box.left) / box.width - 0.5;
    const py = (pointer.clientY - box.top) / box.height - 0.5;
    card.style.setProperty("--tilt-x", `${py * -4}deg`);
    card.style.setProperty("--tilt-y", `${px * 5}deg`);
    card.style.setProperty("--lift", "1");
  };

  const reset = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--lift", "0");
  };

  return (
    <button
      type="button"
      ref={cardRef}
      data-cursor="grow"
      className={`event-card event-card--${span} tone-${event.tone}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onFocus={() => cardRef.current?.style.setProperty("--lift", "1")}
      onBlur={reset}
      onClick={() => onOpen(event)}
      aria-haspopup="dialog"
    >
      <span className="event-card-visual">
        <EventVisualSvg variant={event.visual} />
      </span>

      <span className="event-card-index label label-accent">{event.index}</span>
      <span className="event-card-title">{event.title}</span>
      <span className="event-card-blurb">{event.blurb}</span>

      <span className="event-card-action">
        <span className="label">Discover</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </span>

      <span className="sr-only">Open details for {event.title}</span>
    </button>
  );
}
