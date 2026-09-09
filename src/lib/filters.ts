import type { Show, TripQuery } from "../types";
import { cityMatches, findCity } from "./geo";

export function inDateRange(date: string, start?: string, end?: string) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function filterShows(
  shows: Show[],
  opts: {
    comedianIds?: string[];
    city?: string;
    start?: string;
    end?: string;
  },
) {
  return shows.filter((show) => {
    if (opts.comedianIds?.length && !opts.comedianIds.includes(show.comedianId)) {
      return false;
    }
    if (opts.city && !cityMatches(show.city, opts.city)) return false;
    if (!inDateRange(show.date, opts.start, opts.end)) return false;
    return true;
  });
}

export function tripMatches(shows: Show[], trip: TripQuery) {
  return filterShows(shows, {
    city: trip.city,
    start: trip.start,
    end: trip.end,
  });
}

export function sortChronological(shows: Show[]) {
  return [...shows].sort((a, b) => {
    const date = a.date.localeCompare(b.date);
    if (date !== 0) return date;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatShowDate(date: string, time?: string) {
  const [year, month, day] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  const label = dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (!time) return label;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${label} · ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function tripHeadline(city: string) {
  const match = findCity(city);
  const trimmed = (match?.city ?? city).trim();
  if (!trimmed) return "In town these days…";
  return `In ${trimmed} these days…`;
}

export const ROSTER_COLORS = [
  "#f5c542",
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#c084fc",
  "#22d3ee",
  "#f87171",
];
