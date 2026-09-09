import type { Comedian, Show } from "../types";
import comedianSeed from "../../data/comedians.json";
import showSeed from "../../data/shows.json";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";
import { namesMatch } from "./names";

const comedians = comedianSeed.comedians as Comedian[];
const listed = [...(showSeed.shows as Show[]), ...(jeffArcuriShows.shows as Show[])];

function todayISO() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function matchSeedComedian(opts: {
  comedianId?: string;
  name: string;
  aliases?: string[];
}) {
  const names = [opts.name, ...(opts.aliases ?? [])];
  return comedians.find((comedian) => {
    if (opts.comedianId && comedian.id === opts.comedianId) return true;
    if (names.some((name) => namesMatch(comedian.name, name))) return true;
    return comedian.aliases?.some((alias) =>
      names.some((name) => namesMatch(alias, name)),
    );
  });
}

export function seedListedShows(opts: {
  comedianId: string;
  name: string;
  aliases?: string[];
}): Show[] {
  const match = matchSeedComedian(opts);
  if (!match) return [];
  const today = todayISO();
  return listed
    .filter((show) => show.comedianId === match.id && show.date >= today)
    .map((show) => ({
      ...show,
      comedianId: opts.comedianId,
      source: "listed" as const,
    }));
}
