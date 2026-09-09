import { useEffect, useState } from "react";
import type { Comedian, Show, StoredState } from "../types";
import comedianSeed from "../../data/comedians.json";
import showSeed from "../../data/shows.json";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";
import { mergeShows } from "./lookupShows";
import { namesMatch } from "./names";

const KEY = "comedian-tracker:v7";
const LEGACY_KEYS = ["comedian-tracker:v6", "comedian-tracker:v5", "comedian-tracker:v4"];
const STALE_TOUR_URLS = [
  "https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710",
  "https://www.jeffarcuri.com",
  "https://www.jeffarcuri.com/shows",
  "https://theandrewschulz.com",
];

const seed: StoredState = {
  comedians: comedianSeed.comedians as Comedian[],
  shows: [...(showSeed.shows as Show[]), ...(jeffArcuriShows.shows as Show[])],
};

function matchRoster(state: StoredState, seedComedian: Comedian) {
  return state.comedians.find(
    (item) =>
      item.id === seedComedian.id || namesMatch(item.name, seedComedian.name),
  );
}

function pickTourUrl(existing: string | undefined, seedUrl: string | undefined) {
  if (!existing) return seedUrl;
  const normalized = existing.replace(/\/$/, "");
  if (STALE_TOUR_URLS.includes(normalized)) return seedUrl;
  return existing;
}

export function hydrateSeedShows(state: StoredState): StoredState {
  let comedians = [...state.comedians];
  let shows = [...state.shows];

  for (const seedComedian of seed.comedians) {
    const existing = matchRoster({ comedians, shows }, seedComedian);
    const seedRows = seed.shows.filter((show) => show.comedianId === seedComedian.id);
    if (!existing) {
      if (seedComedian.id !== "jeff-arcuri") continue;
      comedians = [...comedians, seedComedian];
      shows = [...shows, ...seedRows];
      continue;
    }

    const remapped = seedRows.map((show) => ({
      ...show,
      comedianId: existing.id,
      id:
        existing.id === seedComedian.id
          ? show.id
          : show.id.replaceAll(seedComedian.id, existing.id),
    }));
    const kept = shows.filter((show) => {
      if (show.comedianId !== existing.id) return true;
      return show.source === "user" || show.source === "lookup";
    });
    shows = mergeShows(kept, remapped);
    comedians = comedians.map((item) =>
      item.id === existing.id
        ? {
            ...item,
            tourUrl: pickTourUrl(item.tourUrl, seedComedian.tourUrl),
            notes: item.notes || seedComedian.notes,
            aliases: item.aliases?.length ? item.aliases : seedComedian.aliases,
          }
        : item,
    );
  }

  return { comedians, shows };
}

/** @deprecated Use hydrateSeedShows */
export const hydrateJeffSeed = hydrateSeedShows;

function parseState(raw: string | null): StoredState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!Array.isArray(parsed.comedians) || !Array.isArray(parsed.shows)) {
      return null;
    }
    return {
      comedians: parsed.comedians,
      shows: parsed.shows,
    };
  } catch {
    return null;
  }
}

function load(): StoredState {
  const current = parseState(localStorage.getItem(KEY));
  if (current) return current;
  for (const legacyKey of LEGACY_KEYS) {
    const legacy = parseState(localStorage.getItem(legacyKey));
    if (legacy) return hydrateSeedShows(legacy);
  }
  return structuredClone(seed);
}

export function useTrackerState() {
  const [state, setState] = useState<StoredState>(() =>
    typeof window === "undefined" ? seed : load(),
  );

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}

export function resetSeed(): StoredState {
  const next = structuredClone(seed);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
