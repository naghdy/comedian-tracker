import type { Comedian } from "../types";
import { MicIcon } from "./MicIcon";

type Props = {
  comedians: Comedian[];
  showCounts: Record<string, number>;
  totalNights: number;
  totalCities: number;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

/**
 * The masthead and the lineup. Names run as one line of credits, busiest
 * first, and double as the comedian filter. Anyone with no announced nights
 * sits on a quiet line of their own rather than filtering to an empty list.
 */
export function Roster({
  comedians,
  showCounts,
  totalNights,
  totalCities,
  selectedIds,
  onToggle,
  onClear,
  theme,
  onToggleTheme,
}: Props) {
  const filtering = selectedIds.length > 0;
  // Busiest first; ties keep the curator's order.
  const ordered = comedians
    .map((comedian, index) => ({ comedian, index, count: showCounts[comedian.id] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.index - b.index);
  const touring = ordered.filter((entry) => entry.count > 0 || selectedIds.includes(entry.comedian.id));
  const resting = ordered.filter((entry) => entry.count === 0 && !selectedIds.includes(entry.comedian.id));

  return (
    <header className="top">
      <div className="masthead">
        <h1 className="wordmark">
          <MicIcon className="wordmark-mic" />
          Comedian Tracker
        </h1>
        <div className="masthead-links">
          <a href="#trip">Travelling?</a>
          <button
            type="button"
            className="text-btn"
            onClick={onToggleTheme}
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? "Lights up" : "Lights down"}
          </button>
        </div>
      </div>

      <p className="standfirst">
        Where {touring.length} comics are playing next: {totalNights} nights in {totalCities}{" "}
        {totalCities === 1 ? "city" : "cities"}, taken from their own tour pages and checked
        every week.
      </p>

      <div className="lineup" role="group" aria-labelledby="lineup-title">
        <div className="lineup-head">
          <h2 id="lineup-title">The lineup</h2>
          {filtering ? (
            <button type="button" className="text-btn" onClick={onClear}>
              Show everyone
            </button>
          ) : (
            <p>Pick a name to see just their nights.</p>
          )}
        </div>
        {comedians.length === 0 ? (
          <p className="empty">No one on the list yet.</p>
        ) : (
          <ul className={`cast${filtering ? " is-filtering" : ""}`}>
            {touring.map(({ comedian, count }) => {
              const selected = selectedIds.includes(comedian.id);
              return (
                <li key={comedian.id}>
                  <button
                    type="button"
                    className={`act${selected ? " is-selected" : ""}`}
                    onClick={() => onToggle(comedian.id)}
                    aria-pressed={selected}
                    aria-label={`${comedian.name}, ${count} upcoming ${count === 1 ? "night" : "nights"}`}
                  >
                    <span className="act-name">{comedian.name}</span>
                    <span className="act-count" aria-hidden="true">
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {resting.length ? (
          <p className="resting">
            Not touring right now:{" "}
            {resting.map(({ comedian }, i) => (
              <span key={comedian.id}>
                {i > 0 ? (i === resting.length - 1 ? " and " : ", ") : null}
                <a href={`comedians/${comedian.id}/`}>{comedian.name}</a>
              </span>
            ))}
            .
          </p>
        ) : null}
      </div>
    </header>
  );
}
