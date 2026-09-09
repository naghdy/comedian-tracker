import type { Show } from "../types";
import { slugify } from "./filters";

export type LookupStatus = "ok" | "no-key" | "empty" | "error";

export type LookupResult = {
  status: LookupStatus;
  shows: Show[];
  provider?: "ticketmaster" | "seatgeek" | "ticketmaster+seatgeek";
  detail?: string;
};

export type LookupQuery = {
  comedianId: string;
  name: string;
  aliases?: string[];
};

const TM_ROOT = "https://app.ticketmaster.com/discovery/v2";
const SG_ROOT = "https://api.seatgeek.com/2/events";
const MAX_PAGES = 4;
const PAGE_SIZE = "200";

type Json = Record<string, unknown>;

function readViteEnv(name: "VITE_TICKETMASTER_API_KEY" | "VITE_SEATGEEK_CLIENT_ID") {
  const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
  return env?.[name]?.trim() || "";
}

export function ticketmasterKey() {
  return readViteEnv("VITE_TICKETMASTER_API_KEY");
}

export function seatgeekClientId() {
  return readViteEnv("VITE_SEATGEEK_CLIENT_ID");
}

export function hasShowLookupKey() {
  return Boolean(ticketmasterKey() || seatgeekClientId());
}

export function normalizePersonName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function namesMatch(comedianName: string, candidate: string) {
  const comedian = normalizePersonName(comedianName);
  const other = normalizePersonName(candidate);
  if (!comedian || !other) return false;
  if (comedian === other) return true;
  if (other.startsWith(`${comedian} `) || other.includes(` ${comedian} `)) {
    return true;
  }
  const comedianParts = comedian.split(" ");
  const otherParts = other.split(" ");
  if (comedianParts.length >= 2) {
    const first = comedianParts[0];
    const last = comedianParts[comedianParts.length - 1];
    if (otherParts.includes(first) && otherParts.includes(last)) return true;
  }
  return false;
}

export function showDedupeKey(show: Pick<Show, "comedianId" | "date" | "venue" | "city">) {
  return [
    show.comedianId,
    show.date,
    normalizePersonName(show.venue),
    normalizePersonName(show.city),
  ].join("|");
}

export function mergeShows(existing: Show[], incoming: Show[]) {
  const seen = new Set(existing.map(showDedupeKey));
  const extra: Show[] = [];
  for (const show of incoming) {
    const key = showDedupeKey(show);
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push(show);
  }
  return extra.length ? [...existing, ...extra] : existing;
}

export function replaceLookupShows(existing: Show[], comedianId: string, incoming: Show[]) {
  const kept = existing.filter(
    (show) => show.comedianId !== comedianId || show.source !== "lookup",
  );
  return mergeShows(kept, incoming);
}

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function asRecord(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nestedName(value: unknown) {
  return str(asRecord(value)?.name);
}

function parseCoord(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function hhmm(localTime: string) {
  const match = localTime.match(/^(\d{2}:\d{2})/);
  return match?.[1];
}

function lookupShowId(show: Omit<Show, "id">) {
  return [
    "lookup",
    show.comedianId,
    show.date,
    slugify(show.city) || "city",
    slugify(show.venue) || "venue",
  ].join("-");
}

function collapseByNight(shows: Show[]) {
  const best = new Map<string, Show>();
  for (const show of shows) {
    const key = showDedupeKey(show);
    const prev = best.get(key);
    if (!prev) {
      best.set(key, show);
      continue;
    }
    const prevTime = prev.time ?? "99:99";
    const nextTime = show.time ?? "99:99";
    if (nextTime < prevTime) best.set(key, show);
    else if (nextTime === prevTime && !prev.ticketUrl && show.ticketUrl) {
      best.set(key, show);
    }
  }
  return [...best.values()];
}

function queryNames(query: LookupQuery) {
  return [query.name, ...(query.aliases ?? [])].filter(Boolean);
}

function matchesComedian(query: LookupQuery, candidate: string) {
  return queryNames(query).some((name) => namesMatch(name, candidate));
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }
  return (await response.json()) as unknown;
}

function tmUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TM_ROOT}/${path}`);
  url.searchParams.set("apikey", ticketmasterKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function ticketmasterAttractionId(query: LookupQuery) {
  const json = asRecord(
    await fetchJson(
      tmUrl("attractions.json", {
        keyword: query.name,
        size: "10",
      }),
    ),
  );
  const attractions = asArray(asRecord(json?._embedded)?.attractions);
  const matches = attractions.flatMap((item) => {
    const rec = asRecord(item);
    if (!rec) return [];
    const name = str(rec.name);
    if (!matchesComedian(query, name)) return [];
    return [{ id: str(rec.id), name }];
  });
  const exact = matches.find(
    (item) => normalizePersonName(item.name) === normalizePersonName(query.name),
  );
  return (exact ?? matches[0])?.id || "";
}

function tmEventToShow(query: LookupQuery, event: Json): Show | null {
  const dates = asRecord(event.dates);
  const start = asRecord(dates?.start);
  const status = str(asRecord(dates?.status)?.code);
  if (status.toLowerCase() === "cancelled") return null;
  if (start?.dateTBA === true) return null;
  const date = str(start?.localDate);
  if (!date || date < todayISO()) return null;

  const attractions = asArray(asRecord(event._embedded)?.attractions);
  const attractionNames = attractions.map((item) => nestedName(item)).filter(Boolean);
  const eventName = str(event.name);
  const matched =
    attractionNames.some((name) => matchesComedian(query, name)) ||
    matchesComedian(query, eventName);
  if (!matched) return null;

  const venue = asRecord(asArray(asRecord(event._embedded)?.venues)[0]);
  if (!venue) return null;
  const city = nestedName(venue.city) || str(venue.city);
  const venueName = str(venue.name);
  if (!city || !venueName) return null;

  const location = asRecord(venue.location);
  const lat = parseCoord(location?.latitude);
  const lng = parseCoord(location?.longitude);
  const region = str(asRecord(venue.state)?.stateCode) || nestedName(venue.state);
  const country =
    str(asRecord(venue.country)?.countryCode) || nestedName(venue.country);
  const time = hhmm(str(start?.localTime));
  const show: Omit<Show, "id"> = {
    comedianId: query.comedianId,
    title: eventName || query.name,
    venue: venueName,
    city,
    region: region || undefined,
    country: country || undefined,
    date,
    time,
    ticketUrl: str(event.url) || undefined,
    source: "lookup",
    lat,
    lng,
  };
  return { ...show, id: lookupShowId(show) };
}

async function lookupTicketmaster(query: LookupQuery): Promise<Show[]> {
  const attractionId = await ticketmasterAttractionId(query).catch(() => "");
  const events: Json[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params: Record<string, string> = {
      size: PAGE_SIZE,
      page: String(page),
      sort: "date,asc",
      startDateTime: `${todayISO()}T00:00:00Z`,
    };
    if (attractionId) params.attractionId = attractionId;
    else {
      params.keyword = query.name;
      params.classificationName = "Comedy";
    }
    const json = asRecord(await fetchJson(tmUrl("events.json", params)));
    const batch = asArray(asRecord(json?._embedded)?.events)
      .map(asRecord)
      .filter((item): item is Json => Boolean(item));
    events.push(...batch);
    const totalPages = Number(asRecord(json?.page)?.totalPages ?? 1);
    if (page + 1 >= totalPages || batch.length === 0) break;
  }
  return collapseByNight(
    events.flatMap((event) => {
      const show = tmEventToShow(query, event);
      return show ? [show] : [];
    }),
  );
}

function seatgeekEventToShow(query: LookupQuery, event: Json): Show | null {
  const performers = asArray(event.performers);
  const performerNames = performers.map((item) => nestedName(item)).filter(Boolean);
  const title = str(event.title) || str(event.short_title);
  const matched =
    performerNames.some((name) => matchesComedian(query, name)) ||
    matchesComedian(query, title);
  if (!matched) return null;

  const datetimeLocal = str(event.datetime_local);
  const date = datetimeLocal.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayISO()) return null;
  const time = hhmm(datetimeLocal.slice(11));
  const venue = asRecord(event.venue);
  if (!venue) return null;
  const city = str(venue.city);
  const venueName = str(venue.name);
  if (!city || !venueName) return null;
  const loc = asRecord(venue.location);
  const show: Omit<Show, "id"> = {
    comedianId: query.comedianId,
    title: title || query.name,
    venue: venueName,
    city,
    region: str(venue.state) || undefined,
    country: str(venue.country) || undefined,
    date,
    time,
    ticketUrl: str(event.url) || undefined,
    source: "lookup",
    lat: parseCoord(loc?.lat),
    lng: parseCoord(loc?.lon),
  };
  return { ...show, id: lookupShowId(show) };
}

async function lookupSeatgeek(query: LookupQuery): Promise<Show[]> {
  const url = new URL(SG_ROOT);
  url.searchParams.set("client_id", seatgeekClientId());
  url.searchParams.set("q", query.name);
  url.searchParams.set("per_page", "50");
  url.searchParams.set("datetime_utc.gte", `${todayISO()}T00:00:00`);
  const json = asRecord(await fetchJson(url.toString()));
  const events = asArray(json?.events)
    .map(asRecord)
    .filter((item): item is Json => Boolean(item));
  return collapseByNight(
    events.flatMap((event) => {
      const show = seatgeekEventToShow(query, event);
      return show ? [show] : [];
    }),
  );
}

export async function lookupUpcomingShows(query: LookupQuery): Promise<LookupResult> {
  const tm = ticketmasterKey();
  const sg = seatgeekClientId();
  if (!tm && !sg) {
    return { status: "no-key", shows: [] };
  }

  const collected: Show[] = [];
  const providers: Array<"ticketmaster" | "seatgeek"> = [];
  const errors: string[] = [];

  if (tm) {
    try {
      const shows = await lookupTicketmaster(query);
      collected.push(...shows);
      if (shows.length) providers.push("ticketmaster");
    } catch (error) {
      errors.push(`Ticketmaster: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  if (sg) {
    try {
      const shows = await lookupSeatgeek(query);
      const before = collected.length;
      const merged = mergeShows(collected, shows);
      collected.length = 0;
      collected.push(...merged);
      if (collected.length > before) providers.push("seatgeek");
    } catch (error) {
      errors.push(`SeatGeek: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  const shows = collapseByNight(collected);
  if (shows.length) {
    const provider =
      providers.length === 2
        ? "ticketmaster+seatgeek"
        : providers[0];
    return { status: "ok", shows, provider, detail: errors[0] };
  }
  if (errors.length && !tm && sg) {
    return { status: "error", shows: [], detail: errors.join(" ") };
  }
  if (errors.length && collected.length === 0) {
    return { status: "error", shows: [], detail: errors.join(" ") };
  }
  return { status: "empty", shows: [], detail: errors[0] };
}

export function lookupMessage(
  result: LookupResult,
  opts: { action: "add" | "refresh"; name: string; count?: number },
) {
  const { action, name } = opts;
  const added = action === "add" ? `${name} is on the roster. ` : "";
  if (result.status === "ok") {
    const n = opts.count ?? result.shows.length;
    const src =
      result.provider === "seatgeek"
        ? "SeatGeek"
        : result.provider === "ticketmaster+seatgeek"
          ? "Ticketmaster and SeatGeek"
          : "Ticketmaster";
    return `${added}Found ${n} upcoming ${n === 1 ? "show" : "shows"} on ${src}.`;
  }
  if (result.status === "no-key") {
    if (action === "add") {
      return `${name} is on the roster. Live date lookup needs a Ticketmaster Discovery API key (see README). Use Refresh shows after the key is set, or add dates manually.`;
    }
    return `Could not refresh ${name}. Live date lookup needs a Ticketmaster Discovery API key (see README).`;
  }
  if (result.status === "empty") {
    return `${added}No upcoming Ticketmaster dates matched “${name}”. The roster entry was kept — add shows manually or try Refresh later.`;
  }
  return `${added}Show lookup failed${result.detail ? ` (${result.detail})` : ""}. The roster entry was kept — try Refresh later or add dates manually.`;
}
