import { useState } from "react";
import { eventCategories, type EventCategory } from "../config/events";
import EventCard from "../components/EventCard";
import Modal from "../components/Modal";

/** Layout spans are deliberate: six cards, three shapes, one design system. */
const SPANS: ("wide" | "tall" | "normal")[] = [
  "wide",
  "normal",
  "tall",
  "normal",
  "normal",
  "wide",
];

export default function Events() {
  const [open, setOpen] = useState<EventCategory | null>(null);

  return (
    <section id="events" className="events section-flush" aria-labelledby="events-title">
      <div className="shell">
        <header className="events-head">
          <p className="label">
            <span className="label-accent">06 DISCIPLINES</span> / explore the frontiers
          </p>
          <h2 id="events-title" className="display-l">
            Explore the frontiers
          </h2>
          <p className="body-lede">
            Discover the disciplines, ideas, and challenges pushing technology forward.
          </p>
          <p className="label events-disclaimer">
            Sample programme — formats, durations and tracks are editable placeholders in
            src/config/events.ts, not confirmed official details.
          </p>
        </header>

        <div className="event-grid">
          {eventCategories.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              span={SPANS[index] ?? "normal"}
              onOpen={setOpen}
            />
          ))}
        </div>
      </div>

      <Modal
        open={open !== null}
        title={open?.title ?? ""}
        onClose={() => setOpen(null)}
        footer={
          <p className="label">
            Illustrative content · edit <code>src/config/events.ts</code> for the official edition
          </p>
        }
      >
        {open && (
          <div className="event-detail">
            <p className="event-detail-blurb">{open.blurb}</p>
            <p>{open.detail}</p>

            <dl className="event-meta">
              <div>
                <dt className="label">Format</dt>
                <dd>{open.format}</dd>
              </div>
              <div>
                <dt className="label">Duration</dt>
                <dd>{open.duration}</dd>
              </div>
            </dl>

            <div className="event-columns">
              <div>
                <p className="label">Sample tracks</p>
                <ul className="tick-list">
                  {open.tracks.map((track) => (
                    <li key={track}>{track}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label">What a team leaves with</p>
                <ul className="tick-list">
                  {open.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
