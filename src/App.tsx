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
import {
  applyRefreshedShows,
  lookupMessage,
  lookupUpcomingShows,
  mergeShows,
  type LookupResult,
} from "./lib/lookupShows";
import type { Comedian, Show, TripQuery } from "./types";

type LookupBanner = {
  tone: "info" | "ok" | "warn" | "error";
  text: string;
};

function toneFor(result: LookupResult): LookupBanner["tone"] {
  if (result.status === "ok") return "ok";
  if (result.status === "error") return "error";
  return "warn";
}

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
  const [lookupBusy, setLookupBusy] = useState<string | "all" | null>(null);
  const [lookupBanner, setLookupBanner] = useState<LookupBanner | null>(null);

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

  async function addComedian(name: string, tourUrl?: string) {
    const base = slugify(name) || `comedian-${Date.now()}`;
    let id = base;
    let n = 2;
    const taken = new Set(state.comedians.map((c) => c.id));
    while (taken.has(id)) {
      id = `${base}-${n++}`;
    }
    const color = ROSTER_COLORS[state.comedians.length % ROSTER_COLORS.length];
    const comedian: Comedian = { id, name, color, tourUrl };
    setState((prev) => ({
      ...prev,
      comedians: [...prev.comedians, comedian],
    }));
    setLookupBusy(id);
    setLookupBanner({
      tone: "info",
      text: `Looking up upcoming shows for ${name}…`,
    });
    try {
      const result = await lookupUpcomingShows({
        comedianId: id,
        name,
        tourUrl,
      });
      if (result.shows.length) {
        setState((prev) => ({
          ...prev,
          shows: mergeShows(prev.shows, result.shows),
        }));
      }
      setLookupBanner({
        tone: toneFor(result),
        text: lookupMessage(result, { action: "add", name }),
      });
    } catch {
      setLookupBanner({
        tone: "error",
        text: `${name} is on the roster. Show lookup failed. Try Refresh later or add dates manually.`,
      });
    } finally {
      setLookupBusy(null);
    }
  }

  async function refreshShows(comedianId?: string) {
    const targets = comedianId
      ? state.comedians.filter((c) => c.id === comedianId)
      : state.comedians;
    if (!targets.length) return;

    setLookupBusy(comedianId ?? "all");
    const names = targets.map((c) => c.name).join(", ");
    setLookupBanner({
      tone: "info",
      text:
        targets.length === 1
          ? `Refreshing shows for ${names}…`
          : `Refreshing upcoming shows for ${targets.length} comedians…`,
    });

    let found = 0;
    let failures = 0;
    let empties = 0;
    try {
      for (const comedian of targets) {
        const result = await lookupUpcomingShows({
          comedianId: comedian.id,
          name: comedian.name,
          aliases: comedian.aliases,
          tourUrl: comedian.tourUrl,
        });
        if (result.status !== "error") {
          setState((prev) => ({
            ...prev,
            shows: applyRefreshedShows(prev.shows, comedian.id, result.shows),
          }));
        }
        if (result.status === "ok") found += result.shows.length;
        else if (result.status === "error") failures += 1;
        else empties += 1;
      }
      if (targets.length === 1) {
        const only = targets[0];
        const result: LookupResult = found
          ? { status: "ok", shows: [] }
          : failures
            ? { status: "error", shows: [] }
            : { status: "empty", shows: [] };
        setLookupBanner({
          tone: toneFor(result),
          text: lookupMessage(result, {
            action: "refresh",
            name: only.name,
            count: found,
          }),
        });
      } else {
        setLookupBanner({
          tone: failures && !found ? "error" : found ? "ok" : "warn",
          text: `Refresh finished. ${found} lookup ${found === 1 ? "show" : "shows"} saved.${
            empties ? ` ${empties} with no matches.` : ""
          }${failures ? ` ${failures} failed.` : ""} Listed and manually added dates were kept.`,
        });
      }
    } catch {
      setLookupBanner({
        tone: "error",
        text: "Show refresh failed. Listed dates were left as-is. Try again later.",
      });
    } finally {
      setLookupBusy(null);
    }
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
        onAdd={addComedian}
        onRemove={removeComedian}
        onRefresh={(id) => void refreshShows(id)}
        onRefreshAll={() => void refreshShows()}
        lookupBusy={lookupBusy}
        lookupBanner={lookupBanner}
        onReset={() => {
          if (window.confirm("Restore the starter roster and seed shows?")) {
            setState(resetSeed());
            setSelectedIds([]);
            setCityFilter("");
            setComedianFilter("");
            setTrip(null);
            setLookupBanner(null);
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
