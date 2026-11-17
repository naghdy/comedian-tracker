import type { CityCoord, Show } from "../types";
import cities from "../../data/cities.json";

const table = cities as CityCoord[];

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "");
}

/**
 * The place `q` (already normalized) names exactly. A place's own name wins
 * over another place's alias, so "phoenix" is Phoenix even though Mesa lists
 * "phoenix" as an alias.
 */
function findExact(q: string): CityCoord | undefined {
  return (
    table.find((c) => norm(c.city) === q) ??
    table.find((c) => c.aliases?.some((alias) => norm(alias) === q))
  );
}

/** True when `needle` appears in `hay` as whole words ("la" is not in "england"). */
function containsWords(hay: string, needle: string) {
  if (!needle) return false;
  const at = (from: number): boolean => {
    const i = hay.indexOf(needle, from);
    if (i < 0) return false;
    const before = i === 0 ? "" : hay[i - 1];
    const after = hay[i + needle.length] ?? "";
    const boundary = (ch: string) => ch === "" || !/[\p{L}\p{N}]/u.test(ch);
    return (boundary(before) && boundary(after)) || at(i + 1);
  };
  return at(0);
}

export function findCity(query: string): CityCoord | undefined {
  const q = norm(query);
  if (!q) return undefined;

  const exact = findExact(q);
  if (exact) return exact;

  return table.find((c) =>
    [c.city, ...(c.aliases ?? [])].some((name) => {
      const n = norm(name);
      return containsWords(n, q) || containsWords(q, n);
    }),
  );
}

/**
 * The `cities.json` place a show is pinned to on the map, or undefined when
 * no row matches. "Newcastle" + "NSW" must hit the "newcastle, nsw" alias
 * exactly. A fuzzy match on the joined string is not used: it once let short
 * aliases such as "la" catch "Sheffield, England" and "Portland, ME, ME"
 * (pinned in LA). The map, the city filter and the city suggestions all go
 * through this, so they always agree on where a show is.
 */
export function placeForShow(
  show: Pick<Show, "city" | "region">,
): CityCoord | undefined {
  const qualified = [show.city, show.region].filter(Boolean).join(", ");
  return (
    (show.region ? findExact(norm(qualified)) : undefined) ?? findCity(show.city)
  );
}

/** "Birmingham" + "AL", or the bare city when there is no region. */
function rawLabel(show: Pick<Show, "city" | "region">) {
  return [show.city, show.region].filter(Boolean).join(", ");
}

function namesOf(place: CityCoord) {
  return [place.city, ...(place.aliases ?? [])].map(norm);
}

/** Every name a show answers to: its map place's name and aliases, then its own text. */
function namesForShow(show: Pick<Show, "city" | "region">) {
  const place = placeForShow(show);
  return [...(place ? namesOf(place) : []), norm(show.city), norm(rawLabel(show))];
}

/** True when `needle` starts a word in `hay` ("hou" starts "houston", "la" doesn't start a word in "portland"). */
function startsWord(hay: string, needle: string) {
  if (!needle) return false;
  let i = hay.indexOf(needle);
  while (i >= 0) {
    if (i === 0 || !/[\p{L}\p{N}]/u.test(hay[i - 1])) return true;
    i = hay.indexOf(needle, i + 1);
  }
  return false;
}

/**
 * Does a show belong under the city text `query`? Uses the map's own
 * resolution: text that names a place exactly ("LA", "Birmingham, AL",
 * "Phoenix") keeps only shows the map pins to that place. Anything else is
 * read as the start of a word in a place's name or alias, so "hou" finds
 * Houston and "new" finds New York and Newcastle, but "la" is never found
 * inside Atlanta or Portland.
 */
export function cityMatches(show: Pick<Show, "city" | "region">, query: string) {
  // Same lookup the map uses for a typed place, so "LA" means Los Angeles.
  const q = norm(query);
  if (!q) return true;
  const named = findExact(q);
  if (named) {
    const place = placeForShow(show);
    if (place) return place === named;
    return norm(show.city) === q || norm(rawLabel(show)) === q;
  }
  return namesForShow(show).some((name) => startsWord(name, q));
}

export type CitySuggestion = {
  /** What goes in the box when picked: the place's name as the map knows it. */
  label: string;
  /** Region or country, to tell "Portland" from "Portland, ME" at a glance. */
  detail?: string;
  nights: number;
  /** Comedians playing there, busiest first. */
  comedianIds: string[];
};

/**
 * Places to offer as the visitor types into a city box, built from `shows`
 * so every suggestion has at least one night behind it. Shows are grouped by
 * the place the map pins them to, and matched with the same rules as
 * `cityMatches`, so picking a suggestion never shows a different set of
 * nights than the map does for that place. With an empty query the busiest
 * places come first.
 */
export function citySuggestions(
  shows: Pick<Show, "city" | "region" | "country" | "comedianId">[],
  query: string,
  limit = 8,
): CitySuggestion[] {
  const q = norm(query);
  type Group = {
    label: string;
    names: string[];
    details: Map<string, number>;
    nights: number;
    comedians: Map<string, number>;
  };
  const groups = new Map<string, Group>();
  for (const show of shows) {
    const place = placeForShow(show);
    const label = place?.city ?? rawLabel(show);
    const key = norm(label);
    let group = groups.get(key);
    if (!group) {
      group = {
        label,
        names: place ? namesOf(place) : [norm(show.city), norm(rawLabel(show))],
        details: new Map(),
        nights: 0,
        comedians: new Map(),
      };
      groups.set(key, group);
    }
    group.nights += 1;
    group.comedians.set(show.comedianId, (group.comedians.get(show.comedianId) ?? 0) + 1);
    const detail = show.region || show.country;
    if (detail) group.details.set(detail, (group.details.get(detail) ?? 0) + 1);
  }

  const rank = (group: Group) => {
    if (!q) return 0;
    const [name, ...aliases] = group.names;
    if (group.names.includes(q)) return 0;
    if (name.startsWith(q)) return 1;
    if (aliases.some((alias) => alias.startsWith(q))) return 2;
    if (group.names.some((n) => startsWord(n, q))) return 3;
    return -1;
  };

  const top = (counts: Map<string, number>) =>
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return [...groups.values()]
    .map((group) => ({ group, score: rank(group) }))
    .filter((entry) => entry.score >= 0)
    .sort(
      (a, b) =>
        a.score - b.score ||
        b.group.nights - a.group.nights ||
        a.group.label.localeCompare(b.group.label),
    )
    .slice(0, limit)
    .map(({ group }) => {
      const detail = top(group.details)[0]?.[0];
      return {
        label: group.label,
        detail:
          detail && !group.label.includes(",") && norm(detail) !== norm(group.label)
            ? detail
            : undefined,
        nights: group.nights,
        comedianIds: top(group.comedians).map(([id]) => id),
      };
    });
}

export function coordsForShow(show: Show): { lat: number; lng: number } | null {
  if (
    typeof show.lat === "number" &&
    typeof show.lng === "number" &&
    Number.isFinite(show.lat) &&
    Number.isFinite(show.lng)
  ) {
    return { lat: show.lat, lng: show.lng };
  }
  const match = placeForShow(show);
  if (!match) return null;
  return { lat: match.lat, lng: match.lng };
}

export function knownCities() {
  return table.map((c) => c.city).sort((a, b) => a.localeCompare(b));
}
