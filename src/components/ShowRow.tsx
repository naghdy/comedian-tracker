import * as m from "motion/react-m";
import type { Comedian, Show } from "../types";
import { dayParts, formatTime, placeLabel, tourTitle } from "../lib/display";

type Props = {
  show: Show;
  comedian?: Comedian;
  today: string;
  onRemove?: (id: string) => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function ShowRow({ show, comedian, today, onRemove }: Props) {
  const name = comedian?.name ?? "Unknown";
  const tour = tourTitle(name, show.title);
  const { day, weekday } = dayParts(show.date);
  const time = formatTime(show.time);
  const isToday = show.date === today;

  return (
    <m.li
      className="row"
      style={{ ["--chip" as string]: comedian?.color ?? "#888" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
    >
      <div className="row-inner">
        <div className={`row-date${isToday ? " is-today" : ""}`}>
          <span className="row-day">{day}</span>
          <span className="row-weekday">{isToday ? "Tonight" : weekday}</span>
        </div>
        <div className="row-body">
          <p className="row-title">
            <span className="dot" aria-hidden="true" />
            <span className="row-name">{name}</span>
            {tour ? <span className="row-tour">{tour}</span> : null}
            {show.sample ? <span className="tag">Sample</span> : null}
          </p>
          <p className="row-meta">
            {show.venue}
            <span className="sep" aria-hidden="true">
              ·
            </span>
            {placeLabel(show)}
            {time ? (
              <>
                <span className="sep" aria-hidden="true">
                  ·
                </span>
                {time}
              </>
            ) : null}
          </p>
        </div>
        <div className="row-actions">
          {show.ticketUrl ? (
            <a
              className="text-link"
              href={show.ticketUrl}
              target="_blank"
              rel="noreferrer"
            >
              Tickets<span aria-hidden="true"> ↗</span>
            </a>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="remove"
              onClick={() => onRemove(show.id)}
              aria-label={`Remove ${name}, ${show.venue}, ${show.date}`}
              title="Remove from this browser"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </m.li>
  );
}
