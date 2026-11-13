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
  slugify,
  sortChronological,
  tripMatches,
  upcomingShows,
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

  // Past nights stay in storage but are hidden everywhere: map, agenda,
  // trip checker and roster counts all start from today.
  const upcoming = useMemo(() => upcomingShows(state.shows), [state.shows]);

  const showCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const show of upcoming) {
      counts[show.comedianId] = (counts[show.comedianId] ?? 0) + 1;
    }
    return counts;
  }, [upcoming]);

  const visibleShows = useMemo(() => {
    const rosterFilter = selectedIds.length ? selectedIds : undefined;
    const extra = comedianFilter ? [comedianFilter] : rosterFilter;
    const comedianIds =
      rosterFilter && comedianFilter
        ? rosterFilter.filter((id) => id === comedianFilter)
        : extra;
    return sortChronological(
      filterShows(upcoming, {
        comedianIds,
        city: cityFilter || undefined,
      }),
    );
  }, [upcoming, selectedIds, cityFilter, comedianFilter]);

  const tripHits = useMemo(() => {
    if (!trip) return [];
    const rosterFilter = selectedIds.length ? selectedIds : undefined;
    return sortChronological(
      tripMatches(
        filterShows(upcoming, { comedianIds: rosterFilter }),
        trip,
      ),
    );
  }, [upcoming, trip, selectedIds]);

  function toggleComedian(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function addShow(show: Omit<Show, "id">) {
    const id = `${show.comedianId}-${show.date}-${slugify(show.city)}-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      shows: [...prev.shows, { ...show, id }],
    }));
    setFormOpen(false);
  }

  function removeShow(id: string) {
    setState((prev) => ({
      ...prev,
      shows: prev.shows.filter((s) => s.id !== id),
    }));
  }

  return (
    <div className="app">
      <Roster
        comedians={state.comedians}
        showCounts={showCounts}
        selectedIds={selectedIds}
        onToggle={toggleComedian}
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
        <TripChecker
          comedians={state.comedians}
          matches={tripHits}
          active={trip}
          onSearch={setTrip}
          onClear={() => setTrip(null)}
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
