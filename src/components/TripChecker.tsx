import { useState, type FormEvent } from "react";
import type { Comedian, Show, TripQuery } from "../types";
import { formatShowDate, tripHeadline } from "../lib/filters";

type Props = {
  comedians: Comedian[];
  matches: Show[];
  onSearch: (trip: TripQuery) => void;
  onClear: () => void;
  active: TripQuery | null;
};

export function TripChecker({
  comedians,
  matches,
  onSearch,
  onClear,
  active,
}: Props) {
  const [city, setCity] = useState("Houston");
  const [start, setStart] = useState("2026-09-17");
  const [end, setEnd] = useState("2026-09-20");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!city.trim() || !start || !end) return;
    onSearch({ city: city.trim(), start, end });
  }

  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));

  return (
    <section className="trip">
      <div>
        <h2>Trip checker</h2>
        <p className="lede">
          City + dates, case-insensitive partial match. Try “Houston” or “Manch”.
        </p>
        <form className="trip-fields" onSubmit={submit}>
          <label className="field">
            <span>City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Seattle"
            />
          </label>
          <label className="field">
            <span>Start</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="field">
            <span>End</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <div className="row-actions">
            <button className="btn" type="submit">
              Check
            </button>
            {active ? (
              <button className="btn ghost" type="button" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>
        </form>
      </div>
      <div className="trip-results">
        <h2>{tripHeadline(active?.city ?? city)}</h2>
        {matches.length === 0 ? (
          <p className="trip-empty">
            {active
              ? "Nobody on the roster is playing that city in this window."
              : "Run a check to see who is in town."}
          </p>
        ) : (
          <div className="hit-list">
            {matches.map((show) => {
              const comedian = byId[show.comedianId];
              return (
                <div key={show.id} className="hit">
                  <span
                    className="swatch"
                    style={{ ["--chip" as string]: comedian?.color ?? "#888" }}
                  />
                  <div>
                    <b>{comedian?.name ?? "Unknown"}</b>
                    <div>
                      <span>
                        {show.venue} · {formatShowDate(show.date, show.time)}
                      </span>
                      {show.sample ? (
                        <>
                          {" "}
                          <span className="badge">Sample</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
