import { useState, type FormEvent } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { Comedian, Show, TripQuery } from "../types";
import { findCity } from "../lib/geo";
import { addDays, formatRange } from "../lib/display";
import { ShowRow } from "./ShowRow";

type Props = {
  comedians: Comedian[];
  matches: Show[];
  today: string;
  onSearch: (trip: TripQuery) => void;
  onClear: () => void;
  active: TripQuery | null;
};

export function TripChecker({
  comedians,
  matches,
  today,
  onSearch,
  onClear,
  active,
}: Props) {
  const [city, setCity] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(() => addDays(today, 7));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!city.trim() || !start || !end) return;
    const [from, to] = start <= end ? [start, end] : [end, start];
    onSearch({ city: city.trim(), start: from, end: to });
  }

  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));
  const cityName = active ? (findCity(active.city)?.city ?? active.city) : "";
  const range = active ? formatRange(active.start, active.end) : "";

  return (
    <section className="section trip" aria-labelledby="trip-title">
      <header className="section-head">
        <h2 id="trip-title">Who’s in town?</h2>
      </header>
      <p className="section-lede">
        Going somewhere? Pick the city and your dates to see who’s playing while
        you’re there.
      </p>

      <form className="trip-form" onSubmit={submit}>
        <label className="field">
          <span>City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Houston"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>From</span>
          <input
            type="date"
            value={start}
            min={today}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="field">
          <span>To</span>
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <div className="trip-actions">
          <button className="btn" type="submit">
            Check
          </button>
          {active ? (
            <button className="btn btn-quiet" type="button" onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
      </form>

      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <m.div
            key={`${active.city}|${active.start}|${active.end}`}
            className="trip-results"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            aria-live="polite"
          >
            <h3 className="trip-headline">
              {matches.length === 0
                ? `Nobody on the list is in ${cityName}, ${range}.`
                : `${matches.length} ${matches.length === 1 ? "night" : "nights"} in ${cityName}, ${range}`}
            </h3>
            {matches.length > 0 ? (
              <ol className="rows">
                {matches.map((show) => (
                  <ShowRow
                    key={show.id}
                    show={show}
                    comedian={byId[show.comedianId]}
                    today={today}
                  />
                ))}
              </ol>
            ) : null}
          </m.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
