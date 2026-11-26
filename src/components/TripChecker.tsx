import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { Comedian, Show, TripQuery } from "../types";
import { findCity } from "../lib/geo";
import { addDays, dayParts, formatRange, groupByDay } from "../lib/display";
import { inDateRange } from "../lib/filters";
import { CityCombobox } from "./CityCombobox";
import { ShowRow } from "./ShowRow";

type Props = {
  comedians: Comedian[];
  /** Upcoming nights (roster filter applied) the city suggestions come from. */
  pool: Show[];
  matches: Show[];
  today: string;
  onSearch: (trip: TripQuery) => void;
  onClear: () => void;
  active: TripQuery | null;
};

export function TripChecker({
  comedians,
  pool,
  matches,
  today,
  onSearch,
  onClear,
  active,
}: Props) {
  const [city, setCity] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(() => addDays(today, 7));
  const [from, to] = start <= end ? [start, end] : [end, start];
  // Suggest only places with someone playing in the chosen dates.
  const inDates = useMemo(
    () => pool.filter((show) => inDateRange(show.date, from, to)),
    [pool, from, to],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!city.trim() || !start || !end) return;
    onSearch({ city: city.trim(), start: from, end: to });
  }

  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));
  const cityName = active ? (findCity(active.city)?.city ?? active.city) : "";
  const range = active ? formatRange(active.start, active.end) : "";

  return (
    <section className="section trip" id="trip" aria-labelledby="trip-title">
      <header className="section-head">
        <h2 id="trip-title">Going somewhere?</h2>
      </header>
      <p className="section-lede">
        Pick a city and the days you’ll be there, and you’ll see who’s on.
      </p>

      <form className="trip-form" onSubmit={submit}>
        <CityCombobox
          className="field trip-city"
          shows={inDates}
          comedians={comedians}
          value={city}
          onChange={setCity}
          label="City"
          placeholder="Houston"
        />
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
                ? `Nobody on the list is in ${cityName}, ${range}. Try a few days either side.`
                : `${matches.length} ${matches.length === 1 ? "night" : "nights"} in ${cityName}, ${range}`}
            </h3>
            {groupByDay(matches).map((day) => {
              const { day: num, weekday, month } = dayParts(day.date);
              return (
                <div key={day.date} className="day">
                  <p className="day-date">
                    <span className="day-weekday">
                      {weekday} {month}
                    </span>
                    <span className="day-num">{num}</span>
                  </p>
                  <ol className="rows">
                    {day.shows.map((show) => (
                      <ShowRow key={show.id} show={show} comedian={byId[show.comedianId]} />
                    ))}
                  </ol>
                </div>
              );
            })}
          </m.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
