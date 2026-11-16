import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { Comedian, Show } from "../types";
import { groupByMonth } from "../lib/display";
import { ShowRow } from "./ShowRow";

type Props = {
  shows: Show[];
  comedians: Comedian[];
  today: string;
  cityFilter: string;
  comedianFilter: string;
  onCityFilter: (value: string) => void;
  onComedianFilter: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  /** Changes whenever the visible set is re-filtered, so the list can ease in. */
  filterKey: string;
};

export function Agenda({
  shows,
  comedians,
  today,
  cityFilter,
  comedianFilter,
  onCityFilter,
  onComedianFilter,
  onAdd,
  onRemove,
  filterKey,
}: Props) {
  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));
  const groups = groupByMonth(shows);
  // The first paint shows the list as-is; only later filter changes ease in,
  // so the page never waits on the animation code to become readable.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <section className="section listings" aria-labelledby="listings-title">
      <header className="section-head">
        <h2 id="listings-title">Dates</h2>
        <p className="section-meta">
          {shows.length} {shows.length === 1 ? "night" : "nights"}
        </p>
      </header>

      <div className="toolbar">
        <label className="field field-inline">
          <span className="visually-hidden">City</span>
          <input
            type="search"
            value={cityFilter}
            onChange={(e) => onCityFilter(e.target.value)}
            placeholder="Any city"
          />
        </label>
        <label className="field field-inline">
          <span className="visually-hidden">Comedian</span>
          <select
            value={comedianFilter}
            onChange={(e) => onComedianFilter(e.target.value)}
          >
            <option value="">Everyone</option>
            {comedians.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-quiet" type="button" onClick={onAdd}>
          Add a show
        </button>
      </div>

      <m.div
        key={filterKey}
        initial={mounted.current ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {groups.length === 0 ? (
          <p className="empty">
            Nothing matches. Try another city or clear the filters.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="month">
              <h3 className="month-label">
                {group.label.replace(/ \d{4}$/, "")}{" "}
                <span>{group.label.slice(-4)}</span>
              </h3>
              <ol className="rows">
                <AnimatePresence initial={false}>
                  {group.shows.map((show) => (
                    <ShowRow
                      key={show.id}
                      show={show}
                      comedian={byId[show.comedianId]}
                      today={today}
                      onRemove={onRemove}
                    />
                  ))}
                </AnimatePresence>
              </ol>
            </div>
          ))
        )}
      </m.div>
    </section>
  );
}
