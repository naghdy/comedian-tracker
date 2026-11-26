import type { Show } from "../types";

/**
 * Seed titles often repeat the comedian's name ("Ricky Gervais: Legend",
 * "Mo Amer"). The listing already shows the name, so keep only the tour part.
 * Returns null when nothing is left beyond the name itself.
 */
export function tourTitle(comedianName: string, title: string): string | null {
  const name = comedianName.trim();
  let rest = title.trim();
  if (!rest) return null;
  if (rest.toLowerCase() === name.toLowerCase()) return null;
  if (rest.toLowerCase().startsWith(name.toLowerCase())) {
    const after = rest.slice(name.length);
    const stripped = after.replace(/^\s*[:\-–—|]\s*/, "");
    if (stripped !== after) rest = stripped.trim();
  }
  return rest && rest.toLowerCase() !== name.toLowerCase() ? rest : null;
}

export type MonthGroup = {
  key: string;
  label: string;
  shows: Show[];
};

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Groups chronologically sorted shows by calendar month, keeping order. */
export function groupByMonth(shows: Show[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const show of shows) {
    const key = show.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: utcDate(show.date).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
        shows: [],
      };
      groups.push(group);
    }
    group.shows.push(show);
  }
  return groups;
}

/** "16" and "Mon" for the date column of a listing row. */
export function dayParts(iso: string) {
  const dt = utcDate(iso);
  return {
    day: String(dt.getUTCDate()),
    weekday: dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    month: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
}

/** "7:30 PM" from "19:30", or null. */
export function formatTime(time?: string) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const IMPLIED_BY_REGION = new Set(["US", "USA", "UK"]);

/**
 * "Denver, CO" / "Brighton, England" / "Sydney, NSW, Australia".
 * The country is dropped where the region already says it (US states, UK nations).
 */
export function placeLabel(show: Pick<Show, "city" | "region" | "country">) {
  const parts = [cityAndRegion(show)];
  if (show.country && !(show.region && IMPLIED_BY_REGION.has(show.country))) {
    parts.push(show.country);
  }
  return parts.join(", ");
}

function sameText(a: string, b: string) {
  return a.trim().toLowerCase().replace(/\./g, "") === b.trim().toLowerCase().replace(/\./g, "");
}

/**
 * The city without a trailing region it already carries. Some seed rows keep
 * the state in the city ("Birmingham, AL" with region "AL") so the map can
 * tell them from Birmingham, UK; this gives back "Birmingham".
 */
export function bareCity(show: Pick<Show, "city" | "region">) {
  const city = show.city.trim();
  if (!show.region) return city;
  const comma = city.lastIndexOf(",");
  if (comma < 0) return city;
  return sameText(city.slice(comma + 1), show.region) ? city.slice(0, comma).trim() : city;
}

/** "Birmingham, AL": the city and its region once, even when the city already ends with it. */
export function cityAndRegion(show: Pick<Show, "city" | "region">) {
  const city = bareCity(show);
  return show.region ? `${city}, ${show.region}` : city;
}

/** "18 – 25 Nov" style range for the trip checker headline. */
export function formatRange(start: string, end: string) {
  const a = utcDate(start);
  const b = utcDate(end);
  const opts = { day: "numeric", month: "short", timeZone: "UTC" } as const;
  if (start === end) return a.toLocaleDateString("en-GB", opts);
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${a.getUTCDate()}–${b.toLocaleDateString("en-GB", opts)}`;
  }
  return `${a.toLocaleDateString("en-GB", opts)} – ${b.toLocaleDateString("en-GB", opts)}`;
}

/** ISO date `days` after `iso`. */
export function addDays(iso: string, days: number) {
  const dt = utcDate(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
