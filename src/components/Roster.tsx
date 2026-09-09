import type { FormEvent } from "react";
import type { Comedian } from "../types";

type LookupBanner = {
  tone: "info" | "ok" | "warn" | "error";
  text: string;
};

type Props = {
  comedians: Comedian[];
  showCounts: Record<string, number>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAdd: (name: string, tourUrl?: string) => void;
  onRemove: (id: string) => void;
  onRefresh: (id: string) => void;
  onRefreshAll: () => void;
  lookupBusy: string | "all" | null;
  lookupBanner: LookupBanner | null;
  onReset: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export function Roster({
  comedians,
  showCounts,
  selectedIds,
  onToggle,
  onAdd,
  onRemove,
  onRefresh,
  onRefreshAll,
  lookupBusy,
  lookupBanner,
  onReset,
  theme,
  onToggleTheme,
}: Props) {
  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const tourUrl = String(data.get("tourUrl") ?? "").trim();
    if (!name) return;
    onAdd(name, tourUrl || undefined);
    form.reset();
  }

  const refreshingAll = lookupBusy === "all";

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

      <div>
        <p className="section-label">Roster</p>
        <div className="roster">
          {comedians.length === 0 ? (
            <div className="empty">Roster is empty. Add a comedian to get started.</div>
          ) : (
            comedians.map((comedian) => {
            const active =
              selectedIds.length === 0 || selectedIds.includes(comedian.id);
            const refreshing = refreshingAll || lookupBusy === comedian.id;
            return (
              <div
                key={comedian.id}
                className={`chip ${active && selectedIds.length ? "active" : ""}`}
                style={{ ["--chip" as string]: comedian.color }}
              >
                <button
                  type="button"
                  className="chip-select"
                  onClick={() => onToggle(comedian.id)}
                  aria-pressed={selectedIds.includes(comedian.id)}
                >
                  <span className="swatch" />
                  <span className="chip-body">
                    <span className="chip-name">{comedian.name}</span>
                    <span className="chip-meta">
                      {showCounts[comedian.id] ?? 0} shows
                      {comedian.aliases?.length
                        ? ` · aka ${comedian.aliases[0]}`
                        : ""}
                    </span>
                  </span>
                </button>
                {comedian.tourUrl ? (
                  <a
                    className="muted-link"
                    href={comedian.tourUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Tour / site"
                  >
                    ↗
                  </a>
                ) : null}
                <button
                  type="button"
                  className="icon-btn quiet"
                  aria-label={`Refresh shows for ${comedian.name}`}
                  title={`Refresh shows for ${comedian.name}`}
                  disabled={Boolean(lookupBusy)}
                  onClick={() => onRefresh(comedian.id)}
                >
                  {refreshing ? "…" : "Refresh"}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove ${comedian.name}`}
                  title={`Remove ${comedian.name}`}
                  onClick={() => onRemove(comedian.id)}
                >
                  Remove
                </button>
              </div>
            );
          })
          )}
        </div>
        {comedians.length > 0 ? (
          <button
            type="button"
            className="reset"
            style={{ marginTop: 8 }}
            disabled={Boolean(lookupBusy)}
            onClick={onRefreshAll}
          >
            {refreshingAll ? "Refreshing all shows…" : "Refresh all shows"}
          </button>
        ) : null}
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

      <form className="add-form" onSubmit={handleAdd}>
        <p className="section-label">Add comedian</p>
        <p className="lede add-hint">
          We’ll look up upcoming Ticketmaster dates and drop them on the map
          and agenda. The comedian stays on the roster even if nothing is found.
        </p>
        <label className="field">
          <span>Name</span>
          <input name="name" placeholder="e.g. Ali Wong" required />
        </label>
        <label className="field">
          <span>Tour / site URL (optional)</span>
          <input name="tourUrl" type="url" placeholder="https://" />
        </label>
        {lookupBanner ? (
          <p className={`lookup-status ${lookupBanner.tone}`} role="status">
            {lookupBanner.text}
          </p>
        ) : null}
        <div className="row-actions">
          <button className="btn" type="submit">
            Add to roster
          </button>
          <button className="btn ghost" type="button" onClick={onReset}>
            Reset seed
          </button>
        </div>
      </form>
    </aside>
  );
}
