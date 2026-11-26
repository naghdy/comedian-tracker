import * as m from "motion/react-m";
import type { Comedian, Show } from "../types";
import { formatShowDate } from "../lib/filters";
import { formatTime, placeLabel, tourTitle } from "../lib/display";

type Props = {
  show: Show;
  comedian?: Comedian;
  onRemove?: (id: string) => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** One night in the listings: who, the tour, where, when, and the ticket link. */
export function ShowRow({ show, comedian, onRemove }: Props) {
  const name = comedian?.name ?? "Unknown";
  const tour = tourTitle(name, show.title);
  const time = formatTime(show.time);
  // Only nights this visitor added can be taken off; the published ones stay put.
  const removable = onRemove && show.source === "user";

  return (
    <m.li
      className="row"
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <p className="row-who">
        <span className="row-name">{name}</span>
        {tour ? <span className="row-tour">{tour}</span> : null}
        {show.sample ? <span className="tag">Sample</span> : null}
        {show.source === "user" ? <span className="tag">Added by you</span> : null}
      </p>
      <p className="row-where">
        <span className="row-venue">{show.venue}</span>
        <span className="row-place">{placeLabel(show)}</span>
      </p>
      <p className="row-time">{time ?? <span className="row-tba">Time TBA</span>}</p>
      <p className="row-actions">
        {show.ticketUrl ? (
          <a className="tickets" href={show.ticketUrl} target="_blank" rel="noreferrer">
            Tickets
            <span className="visually-hidden">
              {" "}
              for {name} at {show.venue}, {formatShowDate(show.date)} (opens in a new tab)
            </span>
          </a>
        ) : (
          <span className="no-tickets">No link yet</span>
        )}
        {removable ? (
          <button
            type="button"
            className="remove"
            onClick={() => onRemove(show.id)}
            aria-label={`Remove ${name}, ${show.venue}, ${show.date}`}
            title="Remove this night"
          >
            Remove
          </button>
        ) : null}
      </p>
    </m.li>
  );
}
