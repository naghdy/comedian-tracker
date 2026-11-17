import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig } from "motion/react";

const loadMotionFeatures = () =>
  import("./lib/motionFeatures").then((mod) => mod.default);
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
  todayISO,
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
  const today = todayISO();
  const upcoming = useMemo(
    () => upcomingShows(state.shows, today),
    [state.shows, today],
  );

  const showCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const show of upcoming) {
      counts[show.comedianId] = (counts[show.comedianId] ?? 0) + 1;
    }
    return counts;
  }, [upcoming]);

  const comedianIds = useMemo(() => {
    const rosterFilter = selectedIds.length ? selectedIds : undefined;
    if (rosterFilter && comedianFilter) {
      return rosterFilter.filter((id) => id === comedianFilter);
    }
    return comedianFilter ? [comedianFilter] : rosterFilter;
  }, [selectedIds, comedianFilter]);

  // What the dates' city box suggests from: every filter but the city itself.
  const cityPool = useMemo(
    () => filterShows(upcoming, { comedianIds }),
    [upcoming, comedianIds],
  );

  const visibleShows = useMemo(
    () =>
      sortChronological(filterShows(cityPool, { city: cityFilter || undefined })),
    [cityPool, cityFilter],
  );

  const tripPool = useMemo(
    () =>
      filterShows(upcoming, {
        comedianIds: selectedIds.length ? selectedIds : undefined,
      }),
    [upcoming, selectedIds],
  );

  const tripHits = useMemo(() => {
    if (!trip) return [];
    return sortChronological(tripMatches(tripPool, trip));
  }, [tripPool, trip]);

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

  const filterKey = `${selectedIds.join(",")}|${cityFilter.trim().toLowerCase()}|${comedianFilter}`;

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="app">
          <Roster
            comedians={state.comedians}
            showCounts={showCounts}
            totalNights={upcoming.length}
            selectedIds={selectedIds}
            onToggle={toggleComedian}
            onClear={() => setSelectedIds([])}
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
              cityPool={cityPool}
              comedians={state.comedians}
              today={today}
              cityFilter={cityFilter}
              comedianFilter={comedianFilter}
              onCityFilter={setCityFilter}
              onComedianFilter={setComedianFilter}
              onAdd={() => setFormOpen(true)}
              onRemove={removeShow}
              filterKey={filterKey}
            />
            <TripChecker
              comedians={state.comedians}
              pool={tripPool}
              matches={tripHits}
              today={today}
              active={trip}
              onSearch={setTrip}
              onClear={() => setTrip(null)}
            />
          </main>
          <footer className="foot">
            <p>Dates come from official tour pages and venue listings, checked weekly.</p>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                if (window.confirm("Restore the starter roster and seed shows?")) {
                  setState(resetSeed());
                  setSelectedIds([]);
                  setCityFilter("");
                  setComedianFilter("");
                  setTrip(null);
                }
              }}
            >
              Reset seed
            </button>
          </footer>
          <AnimatePresence>
            {formOpen ? (
              <ShowForm
                key="add-show"
                comedians={state.comedians}
                onClose={() => setFormOpen(false)}
                onSave={addShow}
              />
            ) : null}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
