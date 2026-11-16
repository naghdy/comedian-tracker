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

/** One night, set like a line on a tour poster: date, who, where, when. */
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
        <p className={`row-date${isToday ? " is-today" : ""}`}>
          <span className="row-weekday">{isToday ? "Tonight" : weekday}</span>
          <span className="row-day">{day}</span>
        </p>
        <div className="row-who">
          <p className="row-name">{name}</p>
          {tour || show.sample ? (
            <p className="row-tour">
              {tour}
              {show.sample ? <span className="tag">Sample</span> : null}
            </p>
          ) : null}
        </div>
        <div className="row-where">
          <p className="row-venue">{show.venue}</p>
          <p className="row-place">
            {placeLabel(show)}
            {time ? <span className="row-time-inline"> · {time}</span> : null}
          </p>
        </div>
        <p className="row-time">{time ?? ""}</p>
        <div className="row-actions">
          {show.ticketUrl ? (
            <a
              className="tickets"
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
