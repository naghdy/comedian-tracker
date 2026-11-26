import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, MotionConfig } from "motion/react";

const loadMotionFeatures = () =>
  import("./lib/motionFeatures").then((mod) => mod.default);
import { Roster } from "./components/Roster";
import { TripChecker } from "./components/TripChecker";
import { ShowMap } from "./components/ShowMap";
import { Agenda } from "./components/Agenda";
import { ShowForm } from "./components/ShowForm";
import { useTrackerState } from "./lib/storage";
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
import { SEED_COMEDIANS } from "./lib/seedData";
import type { Show, TripQuery } from "./types";

/** `?comedian=<id>` (from a comedian's page) opens the tracker on just them. */
function comedianFromUrl(): string[] {
  if (typeof window === "undefined") return [];
  const id = new URLSearchParams(window.location.search).get("comedian");
  return id && SEED_COMEDIANS.some((c) => c.id === id) ? [id] : [];
}

const PAGED_IDS = new Set(SEED_COMEDIANS.map((c) => c.id));

export default function App() {
  const [state, setState] = useTrackerState();
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "dark" : readTheme(),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(comedianFromUrl);
  const [cityFilter, setCityFilter] = useState("");
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

  const totalCities = useMemo(
    () => new Set(upcoming.map((show) => show.city.trim().toLowerCase())).size,
    [upcoming],
  );

  const comedianIds = selectedIds.length ? selectedIds : undefined;

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

  const tripPool = cityPool;

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

  const filterKey = `${selectedIds.join(",")}|${cityFilter.trim().toLowerCase()}`;
  const filtered = selectedIds.length > 0 || cityFilter.trim() !== "";
  const addedByVisitor = state.shows.some((show) => show.source === "user");

  function clearFilters() {
    setSelectedIds([]);
    setCityFilter("");
  }

  function clearAdded() {
    if (!window.confirm("Take off every night you added in this browser?")) return;
    setState((prev) => ({
      ...prev,
      shows: prev.shows.filter((show) => show.source !== "user"),
    }));
  }

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="app">
          <a className="skip-link" href="#listings">
            Skip to the listings
          </a>
          <Roster
            comedians={state.comedians}
            showCounts={showCounts}
            totalNights={upcoming.length}
            totalCities={totalCities}
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
              onCityFilter={setCityFilter}
              filtered={filtered}
              onClearFilters={clearFilters}
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
            <p className="foot-note">
              Dates come from each comedian’s own tour page or the venue’s listing and are
              checked every week. If a time here disagrees with the venue, trust the venue.
            </p>
            <nav className="foot-links" aria-label="Tour dates by comedian">
              <h2>Tour dates by comedian</h2>
              <ul>
                {state.comedians
                  .filter((c) => PAGED_IDS.has(c.id))
                  .map((c) => (
                    <li key={c.id}>
                      <a href={`comedians/${c.id}/`}>{c.name}</a>
                    </li>
                  ))}
              </ul>
            </nav>
            <p className="foot-tools">
              <button type="button" className="text-btn" onClick={() => setFormOpen(true)}>
                Add a night you know about
              </button>
              {addedByVisitor ? (
                <>
                  {" · "}
                  <button type="button" className="text-btn" onClick={clearAdded}>
                    Clear nights you added
                  </button>
                </>
              ) : null}
            </p>
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
