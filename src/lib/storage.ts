import { useEffect, useState } from "react";
import type { Comedian, Show, StoredState } from "../types";
import comedianSeed from "../../data/comedians.json";
import showSeed from "../../data/shows.json";

const KEY = "comedian-tracker:v4";

const seed: StoredState = {
  comedians: comedianSeed.comedians as Comedian[],
  shows: showSeed.shows as Show[],
};

function load(): StoredState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!Array.isArray(parsed.comedians) || !Array.isArray(parsed.shows)) {
      return structuredClone(seed);
    }
    return {
      comedians: parsed.comedians,
      shows: parsed.shows,
    };
  } catch {
    return structuredClone(seed);
  }
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
