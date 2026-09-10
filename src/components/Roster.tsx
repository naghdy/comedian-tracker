import type { Comedian } from "../types";

type Props = {
  comedians: Comedian[];
  showCounts: Record<string, number>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export function Roster({
  comedians,
  showCounts,
  selectedIds,
  onToggle,
  onReset,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 6c-2.8 0-5 2.1-5 4.8v6.4c0 2.7 2.2 4.8 5 4.8s5-2.1 5-4.8V10.8C21 8.1 18.8 6 16 6Z"
                fill="currentColor"
                style={{ color: "var(--accent)" }}
              />
              <path
                d="M8.5 16.2c0 4.1 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5M16 23.7v3.2M12.2 26.9h7.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1>Comedian Tracker</h1>
            <p>Personal live-show dashboard</p>
          </div>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={theme === "light"}
          title="Switch color theme"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <div className="roster-block">
        <p className="section-label">Roster</p>
        <div className="roster">
          {comedians.length === 0 ? (
            <div className="empty">Roster is empty.</div>
          ) : (
            comedians.map((comedian) => {
              const active =
                selectedIds.length === 0 || selectedIds.includes(comedian.id);
              const count = showCounts[comedian.id] ?? 0;
              const countLabel = `${count} ${count === 1 ? "show" : "shows"}`;
              return (
                <button
                  key={comedian.id}
                  type="button"
                  className={`chip ${active && selectedIds.length ? "active" : ""}`}
                  style={{ ["--chip" as string]: comedian.color }}
                  onClick={() => onToggle(comedian.id)}
                  aria-pressed={selectedIds.includes(comedian.id)}
                  aria-label={`${comedian.name}, ${countLabel}`}
                >
                  <span className="swatch" />
                  <span className="chip-name">{comedian.name}</span>
                  <span className="chip-count" title={countLabel}>
                    {count}
                  </span>
                </button>
              );
            })
          )}
        </div>
        {selectedIds.length > 0 ? (
          <button
            type="button"
            className="reset"
            style={{ marginTop: 8 }}
            onClick={() => selectedIds.forEach(onToggle)}
          >
            Clear roster filter
          </button>
        ) : null}
      </div>

      <button
        className="reset roster-reset"
        type="button"
        onClick={onReset}
      >
        Reset seed
      </button>
    </aside>
  );
}
