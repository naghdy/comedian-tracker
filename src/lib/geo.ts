import type { CityCoord, Show } from "../types";
import cities from "../../data/cities.json";

const table = cities as CityCoord[];

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "");
}

export function findCity(query: string): CityCoord | undefined {
  const q = norm(query);
  if (!q) return undefined;

  const exact = table.find(
    (c) =>
      norm(c.city) === q ||
      c.aliases?.some((alias) => norm(alias) === q),
  );
  if (exact) return exact;

  return table.find(
    (c) =>
      norm(c.city).includes(q) ||
      q.includes(norm(c.city)) ||
      c.aliases?.some((alias) => norm(alias).includes(q) || q.includes(norm(alias))),
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
  const match = findCity(show.city);
  if (!match) return null;
  return { lat: match.lat, lng: match.lng };
}

export function knownCities() {
  return table.map((c) => c.city).sort((a, b) => a.localeCompare(b));
}
