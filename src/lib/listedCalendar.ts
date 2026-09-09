import type { Show } from "../types";
import { namesMatch } from "./names";
import { SEED_COMEDIANS, SEED_SHOWS } from "./seedData";

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
  return SEED_COMEDIANS.find((comedian) => {
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
  const ids = new Set<string>([opts.comedianId]);
  if (match) ids.add(match.id);
  const today = todayISO();
  return SEED_SHOWS.filter(
    (show) => ids.has(show.comedianId) && show.date >= today,
  ).map((show) => ({
    ...show,
    comedianId: opts.comedianId,
    source: "listed" as const,
  }));
}
