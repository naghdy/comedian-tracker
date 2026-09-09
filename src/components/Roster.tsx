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

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 3.25a.75.75 0 0 0 0 1.5h3.19L4.22 10.22a.75.75 0 1 0 1.06 1.06l5.47-5.47v3.19a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-.75-.75h-5Z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 2.5a5.5 5.5 0 1 0 5.13 7.47.75.75 0 1 1 1.4.54A7 7 0 1 1 13.3 4.2V2.75a.75.75 0 0 1 1.5 0V6a.75.75 0 0 1-.75.75h-3.25a.75.75 0 0 1 0-1.5h1.64A5.48 5.48 0 0 0 8 2.5Z"
      />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

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
              const count = showCounts[comedian.id] ?? 0;
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
                    <span className="chip-name">{comedian.name}</span>
                  </button>
                  <p className="chip-meta">
                    {count} {count === 1 ? "show" : "shows"}
                  </p>
                  <div className="chip-actions">
                    {comedian.tourUrl ? (
                      <a
                        className="chip-action-btn"
                        href={comedian.tourUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open tour / site for ${comedian.name}`}
                        aria-label={`Open tour / site for ${comedian.name}`}
                      >
                        <ExternalLinkIcon />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className={`chip-action-btn ${refreshing ? "busy" : ""}`}
                      aria-label={`Refresh shows for ${comedian.name}`}
                      title={`Refresh shows for ${comedian.name}`}
                      disabled={Boolean(lookupBusy)}
                      onClick={() => onRefresh(comedian.id)}
                    >
                      <RefreshIcon />
                    </button>
                    <button
                      type="button"
                      className="chip-action-btn danger"
                      aria-label={`Remove ${comedian.name}`}
                      title={`Remove ${comedian.name}`}
                      onClick={() => onRemove(comedian.id)}
                    >
                      <RemoveIcon />
                    </button>
                  </div>
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
