import type { Comedian } from "../types";

type Props = {
  comedians: Comedian[];
  showCounts: Record<string, number>;
  totalNights: number;
  today: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onReset: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

function shortDate(today: string) {
  const [y, mo, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function Roster({
  comedians,
  showCounts,
  totalNights,
  today,
  selectedIds,
  onToggle,
  onClear,
  onReset,
  theme,
  onToggleTheme,
}: Props) {
  const filtering = selectedIds.length > 0;
  const busiest = Math.max(1, ...comedians.map((c) => showCounts[c.id] ?? 0));

  return (
    <aside className="rail">
      <header className="masthead">
        <h1>
          Comedian <span>Tracker</span>
        </h1>
        <p className="standfirst">
          Every upcoming night for the comics I follow, from{" "}
          {shortDate(today)} on.
        </p>
        <p className="tally">
          <span className="tally-number">{totalNights}</span> nights booked
        </p>
      </header>

      <nav className="index" aria-labelledby="index-title">
        <div className="index-head">
          <h2 id="index-title">On tour</h2>
          {filtering ? (
            <button type="button" className="text-btn" onClick={onClear}>
              Show everyone
            </button>
          ) : null}
        </div>
        {comedians.length === 0 ? (
          <p className="empty">No one on the list yet.</p>
        ) : (
          <ul className={`index-list${filtering ? " is-filtering" : ""}`}>
            {comedians.map((comedian) => {
              const selected = selectedIds.includes(comedian.id);
              const count = showCounts[comedian.id] ?? 0;
              const countLabel =
                count === 0
                  ? "no upcoming nights"
                  : `${count} upcoming ${count === 1 ? "night" : "nights"}`;
              return (
                <li key={comedian.id}>
                  <button
                    type="button"
                    className={`index-row${selected ? " is-selected" : ""}${count === 0 ? " is-empty" : ""}`}
                    style={{ ["--chip" as string]: comedian.color }}
                    onClick={() => onToggle(comedian.id)}
                    aria-pressed={selected}
                    aria-label={`${comedian.name}, ${countLabel}`}
                  >
                    <span className="index-name">{comedian.name}</span>
                    <span className="index-count" aria-hidden="true">
                      {count === 0 ? "–" : count}
                    </span>
                    <span className="index-bar" aria-hidden="true">
                      <span style={{ width: `${(count / busiest) * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <footer className="rail-foot">
        <button
          type="button"
          className="text-btn"
          onClick={onToggleTheme}
          aria-pressed={theme === "light"}
        >
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" className="text-btn" onClick={onReset}>
          Reset seed
        </button>
      </footer>
    </aside>
  );
}
