import { useEffect, useMemo, useState } from "react";
import { Roster } from "./components/Roster";
import { TripChecker } from "./components/TripChecker";
import { ShowMap } from "./components/ShowMap";
import { Agenda } from "./components/Agenda";
import { ShowForm } from "./components/ShowForm";
import { resetSeed, useTrackerState } from "./lib/storage";
import {
  applyTheme,
  persistTheme,
  readTheme,
  type Theme,
} from "./lib/theme";
import {
  filterShows,
  ROSTER_COLORS,
  slugify,
  sortChronological,
  tripMatches,
} from "./lib/filters";
import type { Show, TripQuery } from "./types";

export default function App() {
  const [state, setState] = useTrackerState();
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "dark" : readTheme(),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [comedianFilter, setComedianFilter] = useState("");
  const [trip, setTrip] = useState<TripQuery | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const showCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const show of state.shows) {
      counts[show.comedianId] = (counts[show.comedianId] ?? 0) + 1;
    }
    return counts;
  }, [state.shows]);

  const visibleShows = useMemo(() => {
    const rosterFilter = selectedIds.length ? selectedIds : undefined;
    const extra = comedianFilter ? [comedianFilter] : rosterFilter;
    const comedianIds =
      rosterFilter && comedianFilter
        ? rosterFilter.filter((id) => id === comedianFilter)
        : extra;
    return sortChronological(
      filterShows(state.shows, {
        comedianIds,
        city: cityFilter || undefined,
      }),
    );
  }, [state.shows, selectedIds, cityFilter, comedianFilter]);

  const tripHits = useMemo(() => {
    if (!trip) return [];
    const rosterFilter = selectedIds.length ? selectedIds : undefined;
    return sortChronological(
      tripMatches(
        filterShows(state.shows, { comedianIds: rosterFilter }),
        trip,
      ),
    );
  }, [state.shows, trip, selectedIds]);

  function toggleComedian(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function addComedian(name: string, tourUrl?: string) {
    const base = slugify(name) || `comedian-${Date.now()}`;
    let id = base;
    let n = 2;
    while (state.comedians.some((c) => c.id === id)) {
      id = `${base}-${n++}`;
    }
    const color = ROSTER_COLORS[state.comedians.length % ROSTER_COLORS.length];
    setState({
      ...state,
      comedians: [...state.comedians, { id, name, color, tourUrl }],
    });
  }

  function removeComedian(id: string) {
    const comedian = state.comedians.find((c) => c.id === id);
    if (
      !window.confirm(
        `Remove ${comedian?.name ?? "this comedian"} and their shows from this browser?`,
      )
    ) {
      return;
    }
    setState({
      comedians: state.comedians.filter((c) => c.id !== id),
      shows: state.shows.filter((s) => s.comedianId !== id),
    });
    setSelectedIds((ids) => ids.filter((x) => x !== id));
    if (comedianFilter === id) setComedianFilter("");
  }

  function addShow(show: Omit<Show, "id">) {
    const id = `${show.comedianId}-${show.date}-${slugify(show.city)}-${Date.now()}`;
    setState({
      ...state,
      shows: [...state.shows, { ...show, id }],
    });
    setFormOpen(false);
  }

  function removeShow(id: string) {
    setState({
      ...state,
      shows: state.shows.filter((s) => s.id !== id),
    });
  }

  return (
    <div className="app">
      <Roster
        comedians={state.comedians}
        showCounts={showCounts}
        selectedIds={selectedIds}
        onToggle={toggleComedian}
        onAdd={addComedian}
        onRemove={removeComedian}
        onReset={() => {
          if (window.confirm("Restore the starter roster and seed shows?")) {
            setState(resetSeed());
            setSelectedIds([]);
            setCityFilter("");
            setComedianFilter("");
            setTrip(null);
          }
        }}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === "dark" ? "light" : "dark";
          persistTheme(next);
          setTheme(next);
        }}
      />
      <main className="main">
        <TripChecker
          comedians={state.comedians}
          matches={tripHits}
          active={trip}
          onSearch={setTrip}
          onClear={() => setTrip(null)}
        />
        <ShowMap shows={visibleShows} comedians={state.comedians} theme={theme} />
        <Agenda
          shows={visibleShows}
          comedians={state.comedians}
          cityFilter={cityFilter}
          comedianFilter={comedianFilter}
          onCityFilter={setCityFilter}
          onComedianFilter={setComedianFilter}
          onAdd={() => setFormOpen(true)}
          onRemove={removeShow}
        />
      </main>
      {formOpen ? (
        <ShowForm
          comedians={state.comedians}
          onClose={() => setFormOpen(false)}
          onSave={addShow}
        />
      ) : null}
    </div>
  );
}
