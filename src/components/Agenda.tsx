import type { Comedian, Show } from "../types";
import { formatShowDate } from "../lib/filters";

type Props = {
  shows: Show[];
  comedians: Comedian[];
  cityFilter: string;
  comedianFilter: string;
  onCityFilter: (value: string) => void;
  onComedianFilter: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function Agenda({
  shows,
  comedians,
  cityFilter,
  comedianFilter,
  onCityFilter,
  onComedianFilter,
  onAdd,
  onRemove,
}: Props) {
  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));

  return (
    <section className="panel agenda">
      <h2>Agenda</h2>
      <p className="lede">Chronological list of tracked shows. Filters stack with the roster chips.</p>
      <div className="agenda-toolbar">
        <input
          value={cityFilter}
          onChange={(e) => onCityFilter(e.target.value)}
          placeholder="Filter by city"
        />
        <select
          value={comedianFilter}
          onChange={(e) => onComedianFilter(e.target.value)}
        >
          <option value="">All comedians</option>
          {comedians.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn" type="button" onClick={onAdd}>
          Add show
        </button>
      </div>
      {shows.length === 0 ? (
        <div className="empty">
          No shows match this filter. Loosen the city/comedian filters or add a
          date.
        </div>
      ) : (
        <div className="agenda-list">
          {shows.map((show) => {
            const comedian = byId[show.comedianId];
            return (
              <article
                key={show.id}
                className="card"
                style={{ ["--chip" as string]: comedian?.color ?? "#888" }}
              >
                <div className="card-bar" />
                <div>
                  <strong>
                    {comedian?.name ?? "Unknown"} — {show.title}{" "}
                    {show.sample ? <span className="badge">Sample</span> : null}
                  </strong>
                  <div className="chip-meta">
                    {formatShowDate(show.date, show.time)} · {show.venue} ·{" "}
                    {show.city}
                    {show.region ? `, ${show.region}` : ""}
                    {show.country ? ` (${show.country})` : ""}
                  </div>
                </div>
                <div className="row-actions">
                  {show.ticketUrl ? (
                    <a
                      className="btn ghost"
                      href={show.ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tickets
                    </a>
                  ) : null}
                  <button
                    className="btn danger"
                    type="button"
                    onClick={() => onRemove(show.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
