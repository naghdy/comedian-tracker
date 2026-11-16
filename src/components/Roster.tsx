import type { Comedian } from "../types";

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

/**
 * Billing size, the way a festival poster sets its lineup: the more upcoming
 * nights a comedian has, the bigger their name.
 */
function billing(count: number, busiest: number) {
  if (count === 0) return "bill-off";
  const share = count / busiest;
  if (share >= 0.55) return "bill-top";
  if (share >= 0.25) return "bill-mid";
  return "bill-low";
}

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
  const filtering = selectedIds.length > 0;
  const busiest = Math.max(1, ...comedians.map((c) => showCounts[c.id] ?? 0));
  // Headliners first, like a bill; ties keep the curator's order.
  const ordered = comedians
    .map((comedian, index) => ({ comedian, index, count: showCounts[comedian.id] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.index - b.index);

  return (
    <header className="top">
      <div className="topbar">
        <span>
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

      <h1 className="title">
        Comedian <span>Tracker</span>
      </h1>

      <nav className="lineup" aria-labelledby="lineup-title">
        <div className="lineup-head">
          <h2 id="lineup-title">On tour</h2>
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
            {ordered.map(({ comedian, count }) => {
              const selected = selectedIds.includes(comedian.id);
              const countLabel =
                count === 0
                  ? "no upcoming nights"
                  : `${count} upcoming ${count === 1 ? "night" : "nights"}`;
              return (
                <li key={comedian.id}>
                  <button
                    type="button"
                    className={`act ${billing(count, busiest)}${selected ? " is-selected" : ""}`}
                    style={{ ["--chip" as string]: comedian.color }}
                    onClick={() => onToggle(comedian.id)}
                    aria-pressed={selected}
                    aria-label={`${comedian.name}, ${countLabel}`}
                  >
                    <span className="act-name">{comedian.name}</span>
                    <span className="act-count" aria-hidden="true">
                      {count === 0 ? "no dates" : count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </header>
  );
}
