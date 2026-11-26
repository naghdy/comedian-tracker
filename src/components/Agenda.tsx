import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { Comedian, Show } from "../types";
import { dayParts, foldIndex, groupByDay, groupByMonth } from "../lib/display";
import { ShowRow } from "./ShowRow";
import { CityCombobox } from "./CityCombobox";

type Props = {
  shows: Show[];
  /** Nights the city suggestions come from: the comedian filter, but not the city one. */
  cityPool: Show[];
  comedians: Comedian[];
  today: string;
  cityFilter: string;
  onCityFilter: (value: string) => void;
  /** True when a comedian or city is picked: a short list shows in full. */
  filtered: boolean;
  onClearFilters: () => void;
  onRemove: (id: string) => void;
  /** Changes whenever the visible set is re-filtered, so the list can ease in. */
  filterKey: string;
};

/** Unfiltered, the list opens on this many nights (rounded up to a whole day). */
const FIRST_FOLD = 40;

export function Agenda({
  shows,
  cityPool,
  comedians,
  today,
  cityFilter,
  onCityFilter,
  filtered,
  onClearFilters,
  onRemove,
  filterKey,
}: Props) {
  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));
  const [expanded, setExpanded] = useState(false);
  const cut = filtered || expanded ? shows.length : foldIndex(shows, FIRST_FOLD);
  const listed = shows.slice(0, cut);
  const hidden = shows.length - cut;
  const months = groupByMonth(listed);
  // The first paint shows the list as-is; only later filter changes ease in,
  // so the page never waits on the animation code to become readable.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <section className="section listings" id="listings" aria-labelledby="listings-title">
      <header className="section-head">
        <h2 id="listings-title">Listings</h2>
        <CityCombobox
          className="field city-filter"
          shows={cityPool}
          comedians={comedians}
          value={cityFilter}
          onChange={onCityFilter}
          label="Filter by city"
          hideLabel
          type="search"
          placeholder="Filter by city"
        />
      </header>
      <p className="section-meta" aria-live="polite">
        {shows.length} {shows.length === 1 ? "night" : "nights"}
        {filtered ? (
          <>
            {" "}
            ·{" "}
            <button type="button" className="text-btn" onClick={onClearFilters}>
              clear filters
            </button>
          </>
        ) : null}
      </p>

      <m.div
        key={filterKey}
        initial={mounted.current ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {months.length === 0 ? (
          <p className="empty">
            {cityFilter.trim()
              ? `Nobody on the list is playing ${cityFilter.trim()} yet.`
              : "Nothing matches those filters."}{" "}
            <button type="button" className="text-btn" onClick={onClearFilters}>
              Clear filters
            </button>
          </p>
        ) : (
          months.map((month) => (
            <div key={month.key} className="month">
              <h3 className="month-label">
                {month.label.replace(/ \d{4}$/, "")} <span>{month.label.slice(-4)}</span>
              </h3>
              {groupByDay(month.shows).map((day) => {
                const { day: num, weekday } = dayParts(day.date);
                const isToday = day.date === today;
                return (
                  <div key={day.date} className={`day${isToday ? " is-today" : ""}`}>
                    <p className="day-date">
                      <span className="day-weekday">{isToday ? "Tonight" : weekday}</span>
                      <span className="day-num">{num}</span>
                    </p>
                    <ol className="rows">
                      <AnimatePresence initial={false}>
                        {day.shows.map((show) => (
                          <ShowRow
                            key={show.id}
                            show={show}
                            comedian={byId[show.comedianId]}
                            onRemove={onRemove}
                          />
                        ))}
                      </AnimatePresence>
                    </ol>
                  </div>
                );
              })}
            </div>
          ))
        )}
        {hidden > 0 ? (
          <p className="more">
            <button type="button" className="btn btn-quiet" onClick={() => setExpanded(true)}>
              Show the other {hidden} nights
            </button>
          </p>
        ) : null}
      </m.div>
    </section>
  );
}
