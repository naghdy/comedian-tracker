import type { Show } from "../types";
import { slugify } from "./filters";
import { namesMatch, normalizePersonName } from "./names";
import { seedListedShows } from "./listedCalendar";
import { isClubVenueUrl, parseVenueNights } from "./parseVenueHtml";
import { parseLayloDrop } from "./parseLaylo";
import venuePages from "../../data/venue-pages.json";
import layloDrops from "../../data/laylo-drops.json";

export type LookupStatus = "ok" | "no-key" | "empty" | "error";

export type LookupProvider =
  | "ticketmaster"
  | "seatgeek"
  | "seed"
  | "venue"
  | "laylo"
  | "ticketmaster+seatgeek"
  | "ticketmaster+seed"
  | "seatgeek+seed"
  | "mixed";

export type LookupResult = {
  status: LookupStatus;
  shows: Show[];
  provider?: LookupProvider;
  detail?: string;
};

export type LookupQuery = {
  comedianId: string;
  name: string;
  aliases?: string[];
  tourUrl?: string;
};

export { namesMatch, normalizePersonName } from "./names";

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

/** Refresh keeps user-added rows; reapplies seed listed nights and API/venue lookup. */
export function applyRefreshedShows(
  existing: Show[],
  comedianId: string,
  incoming: Show[],
) {
  const kept = existing.filter(
    (show) => show.comedianId !== comedianId || show.source === "user",
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

type VenuePage = {
  comedianId: string;
  url: string;
  title: string;
  venue: string;
  city: string;
  region: string;
  country: string;
};

function venuePagesFor(query: LookupQuery): VenuePage[] {
  const pages = venuePages as VenuePage[];
  const urls = new Set<string>();
  const matched = pages.filter((page) => {
    if (page.comedianId === query.comedianId) return true;
    return namesMatch(query.name, page.title);
  });
  if (query.tourUrl && isClubVenueUrl(query.tourUrl)) {
    matched.push({
      comedianId: query.comedianId,
      url: query.tourUrl,
      title: query.name,
      venue: "",
      city: "",
      region: "",
      country: "US",
    });
  }
  return matched.filter((page) => {
    if (urls.has(page.url)) return false;
    urls.add(page.url);
    return true;
  });
}

async function fetchHtml(url: string) {
  const response = await fetch(url, { headers: { Accept: "text/html" } });
  if (!response.ok) throw new Error(`${response.status}`);
  return response.text();
}

async function lookupVenuePages(query: LookupQuery): Promise<Show[]> {
  const pages = venuePagesFor(query);
  const collected: Show[] = [];
  for (const page of pages) {
    try {
      const html = await fetchHtml(page.url);
      const nights = parseVenueNights(html);
      for (const night of nights) {
        if (night.date < todayISO()) continue;
        const city = night.city || page.city;
        const venue = night.venue || page.venue;
        if (!city || !venue) continue;
        const show: Omit<Show, "id"> = {
          comedianId: query.comedianId,
          title: page.title || query.name,
          venue,
          city,
          region: night.region || page.region || undefined,
          country: page.country || undefined,
          date: night.date,
          time: night.time,
          ticketUrl: page.url,
          source: "lookup",
        };
        collected.push({ ...show, id: lookupShowId(show) });
      }
    } catch {
      // Club sites often block browser CORS; npm run refresh-tours still works.
    }
  }
  return collapseByNight(collected);
}

type LayloDrop = {
  comedianId: string;
  name: string;
  dropId: string;
  url: string;
};

async function lookupLaylo(query: LookupQuery): Promise<Show[]> {
  const drops = (layloDrops as LayloDrop[]).filter(
    (drop) =>
      drop.comedianId === query.comedianId || namesMatch(query.name, drop.name),
  );
  const collected: Show[] = [];
  for (const drop of drops) {
    const json = await fetchJson(drop.url);
    for (const night of parseLayloDrop(json)) {
      if (night.date < todayISO()) continue;
      const show: Omit<Show, "id"> = {
        comedianId: query.comedianId,
        title: night.title || query.name,
        venue: night.venue,
        city: night.city,
        region: night.region,
        country: night.country,
        date: night.date,
        ticketUrl: night.ticketUrl,
        source: "lookup",
        lat: night.lat,
        lng: night.lng,
      };
      collected.push({ ...show, id: lookupShowId(show) });
    }
  }
  return collapseByNight(collected);
}

function hasLayloDrop(query: LookupQuery) {
  return (layloDrops as LayloDrop[]).some(
    (drop) =>
      drop.comedianId === query.comedianId || namesMatch(query.name, drop.name),
  );
}

function describeProviders(providers: string[]): LookupProvider {
  const unique = [...new Set(providers)];
  if (unique.length === 1) return unique[0] as LookupProvider;
  if (unique.length === 2) {
    const key = unique.sort().join("+");
    if (key === "laylo+seed") return "laylo";
    if (key === "seatgeek+ticketmaster") return "ticketmaster+seatgeek";
    if (key === "seed+ticketmaster") return "ticketmaster+seed";
    if (key === "seatgeek+seed") return "seatgeek+seed";
  }
  return "mixed";
}

export async function lookupUpcomingShows(query: LookupQuery): Promise<LookupResult> {
  const tm = ticketmasterKey();
  const sg = seatgeekClientId();
  const collected: Show[] = [];
  const providers: string[] = [];
  const errors: string[] = [];

  const seedShows = seedListedShows(query);
  if (seedShows.length) {
    collected.push(...seedShows);
    providers.push("seed");
  }

  if (tm) {
    try {
      const shows = await lookupTicketmaster(query);
      const before = collected.length;
      const merged = mergeShows(collected, shows);
      collected.length = 0;
      collected.push(...merged);
      if (collected.length > before) providers.push("ticketmaster");
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

  try {
    const shows = await lookupLaylo(query);
    const merged = mergeShows(collected, shows);
    collected.length = 0;
    collected.push(...merged);
    if (shows.length) providers.push("laylo");
  } catch (error) {
    errors.push(`Laylo: ${error instanceof Error ? error.message : "request failed"}`);
  }

  try {
    const shows = await lookupVenuePages(query);
    const before = collected.length;
    const merged = mergeShows(collected, shows);
    collected.length = 0;
    collected.push(...merged);
    if (collected.length > before) providers.push("venue");
  } catch (error) {
    errors.push(`Venue pages: ${error instanceof Error ? error.message : "request failed"}`);
  }

  const shows = collapseByNight(collected);
  if (shows.length) {
    return {
      status: "ok",
      shows,
      provider: describeProviders(providers),
      detail: errors[0],
    };
  }
  if (errors.length && collected.length === 0) {
    return { status: "error", shows: [], detail: errors.join(" ") };
  }
  if (
    !hasShowLookupKey() &&
    !seedShows.length &&
    !hasLayloDrop(query) &&
    !venuePagesFor(query).length
  ) {
    return { status: "no-key", shows: [], detail: errors[0] };
  }
  return { status: "empty", shows: [], detail: errors[0] };
}

function providerLabel(provider?: LookupProvider) {
  switch (provider) {
    case "seatgeek":
      return "SeatGeek";
    case "seed":
      return "the roster club calendar";
    case "venue":
      return "official venue pages";
    case "laylo":
      return "the official Laylo calendar";
    case "mixed":
      return "Ticketmaster, Laylo, and club calendars";
    default:
      if (provider?.includes("laylo")) return "the official Laylo calendar plus other sources";
      if (provider?.includes("seed")) return "the roster club calendar plus live listings";
      return "Ticketmaster";
  }
}

export function lookupMessage(
  result: LookupResult,
  opts: { action: "add" | "refresh"; name: string; count?: number },
) {
  const { action, name } = opts;
  const added = action === "add" ? `${name} is on the roster. ` : "";
  if (result.status === "ok") {
    const n = opts.count ?? result.shows.length;
    return `${added}Found ${n} upcoming ${n === 1 ? "show" : "shows"} from ${providerLabel(result.provider)}.`;
  }
  if (result.status === "no-key") {
    if (action === "add") {
      return `${name} is on the roster. Ticketmaster lookup needs a Discovery API key (see README). Official Laylo calendars and seed club dates still load without it.`;
    }
    return `Could not refresh ${name}. Ticketmaster lookup needs a Discovery API key (see README). Official Laylo calendars and seed club dates still load without it.`;
  }
  if (result.status === "empty") {
    return `${added}No upcoming Ticketmaster, Laylo, or club-calendar dates matched “${name}”. The roster entry was kept — add shows manually or try Refresh later.`;
  }
  return `${added}Show lookup failed${result.detail ? ` (${result.detail})` : ""}. The roster entry was kept — try Refresh later or add dates manually.`;
}
