import { useEffect, useState } from "react";
import type { Comedian, Show, StoredState } from "../types";
import comedianSeed from "../../data/comedians.json";
import showSeed from "../../data/shows.json";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";
import { mergeShows } from "./lookupShows";

const KEY = "comedian-tracker:v6";
const LEGACY_KEYS = ["comedian-tracker:v5", "comedian-tracker:v4"];
const STALE_JEFF_TOUR_URLS = [
  "https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710",
  "https://www.jeffarcuri.com/",
  "https://www.jeffarcuri.com/shows",
];

const seed: StoredState = {
  comedians: comedianSeed.comedians as Comedian[],
  shows: [...(showSeed.shows as Show[]), ...(jeffArcuriShows.shows as Show[])],
};

function isJeff(comedian: Comedian) {
  return (
    comedian.id === "jeff-arcuri" ||
    comedian.name.trim().toLowerCase() === "jeff arcuri"
  );
}

function jeffFromSeed() {
  const comedian = seed.comedians.find((item) => item.id === "jeff-arcuri");
  const shows = seed.shows.filter((item) => item.comedianId === "jeff-arcuri");
  return { comedian, shows };
}

function pickJeffTourUrl(existing: string | undefined, seedUrl: string | undefined) {
  if (!existing || STALE_JEFF_TOUR_URLS.includes(existing)) return seedUrl;
  return existing;
}

export function hydrateJeffSeed(state: StoredState): StoredState {
  const { comedian, shows } = jeffFromSeed();
  if (!comedian) return state;

  const existing = state.comedians.find(isJeff);
  const jeffId = existing?.id ?? comedian.id;
  const remapped = shows.map((show) => ({
    ...show,
    comedianId: jeffId,
    id: jeffId === "jeff-arcuri" ? show.id : show.id.replaceAll("jeff-arcuri", jeffId),
  }));

  const kept = state.shows.filter((show) => {
    if (show.comedianId !== jeffId) return true;
    return show.source === "user" || show.source === "lookup";
  });

  const comedians = existing
    ? state.comedians.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              tourUrl: pickJeffTourUrl(item.tourUrl, comedian.tourUrl),
              notes: item.notes || comedian.notes,
            }
          : item,
      )
    : [...state.comedians, comedian];

  return {
    comedians,
    shows: mergeShows(kept, remapped),
  };
}

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
    if (legacy) return hydrateJeffSeed(legacy);
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
