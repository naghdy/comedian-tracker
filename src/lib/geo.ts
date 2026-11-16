import type { CityCoord, Show } from "../types";
import cities from "../../data/cities.json";

const table = cities as CityCoord[];

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "");
}

function findExact(q: string): CityCoord | undefined {
  return table.find(
    (c) =>
      norm(c.city) === q ||
      c.aliases?.some((alias) => norm(alias) === q),
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

export function cityMatches(showCity: string, query: string) {
  const q = norm(query);
  if (!q) return true;
  const city = findCity(showCity);
  const haystacks = [
    showCity,
    city?.city,
    ...(city?.aliases ?? []),
  ].filter(Boolean) as string[];
  return haystacks.some((h) => {
    const n = norm(h);
    return n.includes(q) || q.includes(n);
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
  // "Newcastle" + "NSW" must hit the "newcastle, nsw" alias exactly. A fuzzy
  // match on the joined string is not used: it once let short aliases such as
  // "la" catch "Sheffield, England" and "Portland, ME, ME" (pinned in LA).
  const qualified = [show.city, show.region].filter(Boolean).join(", ");
  const match =
    (show.region ? findExact(norm(qualified)) : undefined) ?? findCity(show.city);
  if (!match) return null;
  return { lat: match.lat, lng: match.lng };
}

export function knownCities() {
  return table.map((c) => c.city).sort((a, b) => a.localeCompare(b));
}
