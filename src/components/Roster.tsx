import { useState } from "react";
import type { Comedian } from "../types";
import { MicIcon } from "./MicIcon";

type Props = {
  comedians: Comedian[];
  showCounts: Record<string, number>;
  totalNights: number;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

/** Past this many names the lineup folds to the busiest ones, with a toggle. */
const FOLD_AT = 18;
const FOLDED = 15;

export function Roster({
  comedians,
  showCounts,
  totalNights,
  selectedIds,
  onToggle,
  onClear,
  theme,
  onToggleTheme,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const filtering = selectedIds.length > 0;
  const busiest = Math.max(1, ...comedians.map((c) => showCounts[c.id] ?? 0));
  // Busiest first; ties keep the curator's order.
  const ordered = comedians
    .map((comedian, index) => ({ comedian, index, count: showCounts[comedian.id] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.index - b.index);

  const folds = ordered.length > FOLD_AT;
  const visible =
    folds && !expanded
      ? ordered.filter(
          (entry, i) => i < FOLDED || selectedIds.includes(entry.comedian.id),
        )
      : ordered;

  return (
    <header className="top">
      <div className="topbar">
        <h1 className="wordmark">
          <MicIcon className="wordmark-mic" />
          Comedian <span>Tracker</span>
        </h1>
        <div className="topbar-end">
          <span className="topbar-count">
            <strong>{totalNights}</strong> upcoming nights
          </span>
          <button
            type="button"
            className="text-btn"
            onClick={onToggleTheme}
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>

      <nav className="lineup" aria-labelledby="lineup-title">
        <div className="lineup-head">
          <h2 id="lineup-title">
            On tour <span>{comedians.length}</span>
          </h2>
          <p>
            {filtering ? (
              <button type="button" className="text-btn" onClick={onClear}>
                Show everyone
              </button>
            ) : (
              "Tap a name to see only their dates."
            )}
          </p>
        </div>
        {comedians.length === 0 ? (
          <p className="empty">No one on the list yet.</p>
        ) : (
          <ul className={`lineup-list${filtering ? " is-filtering" : ""}`}>
            {visible.map(({ comedian, count }) => {
              const selected = selectedIds.includes(comedian.id);
              const countLabel =
                count === 0
                  ? "no upcoming nights"
                  : `${count} upcoming ${count === 1 ? "night" : "nights"}`;
              return (
                <li key={comedian.id}>
                  <button
                    type="button"
                    className={`act${count === 0 ? " is-empty" : ""}${selected ? " is-selected" : ""}`}
                    style={{
                      ["--chip" as string]: comedian.color,
                      ["--share" as string]: `${(count / busiest) * 100}%`,
                    }}
                    onClick={() => onToggle(comedian.id)}
                    aria-pressed={selected}
                    aria-label={`${comedian.name}, ${countLabel}`}
                  >
                    <span className="act-name">{comedian.name}</span>
                    <span className="act-count" aria-hidden="true">
                      {count === 0 ? "–" : count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {folds ? (
          <button
            type="button"
            className="text-btn lineup-more"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Show fewer" : `Show all ${ordered.length}`}
          </button>
        ) : null}
      </nav>
    </header>
  );
}
