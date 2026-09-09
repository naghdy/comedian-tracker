/**
 * Refresh committed seed dates from official Helium / Improv / SeatEngine
 * club pages (Node fetch — no CORS). Ticketmaster theater dates stay on the
 * live lookup path. Does not invent dates; pages that fail to parse are skipped.
 *
 * Usage:
 *   npm run refresh-tours
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseVenueNights } from "../src/lib/parseVenueHtml.ts";
import { parseLayloDrop } from "../src/lib/parseLaylo.ts";
import venuePages from "../data/venue-pages.json";
import layloDrops from "../data/laylo-drops.json";

type Show = {
  id: string;
  comedianId: string;
  title?: string;
  venue?: string;
  city: string;
  region?: string;
  country?: string;
  date: string;
  time?: string;
  ticketUrl?: string;
  sample?: boolean;
  source?: string;
};

type ShowsFile = {
  generatedAt?: string;
  sourceNotes?: string;
  shows: Show[];
};

type VenuePage = {
  comedianId: string;
  url: string;
  title: string;
  venue: string;
  city: string;
  region: string;
  country: string;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const showsPath = resolve(root, "data/shows.json");
const jeffPath = resolve(root, "data/jeff-arcuri-shows.json");
const comediansPath = resolve(root, "data/comedians.json");

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function showId(show: Pick<Show, "comedianId" | "date" | "city">) {
  if (show.comedianId === "andrew-schulz") {
    return `as-${show.date}-${slug(show.city)}`;
  }
  if (show.comedianId === "jeff-arcuri") {
    return `ja-${show.date}-${slug(show.city)}`;
  }
  return `${show.comedianId}-${show.date}-${slug(show.city)}`;
}

function keyOf(show: Pick<Show, "comedianId" | "date" | "venue" | "city">) {
  return [show.comedianId, show.date, (show.venue ?? "").toLowerCase(), show.city.toLowerCase()].join("|");
}

async function fetchPage(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "comedian-tracker/1.0 (tour refresh; +https://github.com/naghdy/comedian-tracker)",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function scrapeLaylo() {
  const found: Show[] = [];
  for (const drop of layloDrops as { comedianId: string; url: string; name: string }[]) {
    try {
      const json = await (await fetch(drop.url)).json();
      const nights = parseLayloDrop(json);
      console.log(`  Laylo ${drop.name}: ${nights.map((n) => n.date).join(", ")}`);
      for (const night of nights) {
        found.push({
          id: showId({
            comedianId: drop.comedianId,
            date: night.date,
            city: night.city,
          }),
          comedianId: drop.comedianId,
          title: drop.name,
          venue: night.venue,
          city: night.city,
          region: night.region,
          country: night.country,
          date: night.date,
          ticketUrl: night.ticketUrl,
          source: "listed",
        });
      }
    } catch (error) {
      console.log(
        `  skip Laylo ${drop.url}: ${error instanceof Error ? error.message : "fetch failed"}`,
      );
    }
  }
  return found;
}

async function scrapeVenuePages() {
  const found: Show[] = [];
  for (const page of venuePages as VenuePage[]) {
    try {
      const html = await fetchPage(page.url);
      const nights = parseVenueNights(html);
      if (!nights.length) {
        console.log(`  no dates parsed: ${page.url}`);
        continue;
      }
      console.log(`  ${page.city}: ${nights.map((n) => n.date).join(", ")} (${page.url})`);
      for (const night of nights) {
        const city = night.city || page.city;
        const venue = night.venue || page.venue;
        const row: Show = {
          id: showId({ comedianId: page.comedianId, date: night.date, city }),
          comedianId: page.comedianId,
          title: page.title,
          venue,
          city,
          region: night.region || page.region,
          country: page.country,
          date: night.date,
          ticketUrl: page.url,
          source: "listed",
        };
        found.push(row);
      }
    } catch (error) {
      console.log(
        `  skip ${page.url}: ${error instanceof Error ? error.message : "fetch failed"}`,
      );
    }
  }
  return found;
}

function mergeScraped(existing: Show[], incoming: Show[]) {
  const seen = new Set(existing.map(keyOf));
  const extra: Show[] = [];
  for (const show of incoming) {
    const key = keyOf(show);
    if (seen.has(key)) continue;
    seen.add(key);
    extra.push(show);
  }
  return extra.length ? [...existing, ...extra] : existing;
}

async function main() {
  const comedians = JSON.parse(readFileSync(comediansPath, "utf8")) as {
    comedians: { id: string; name: string }[];
  };
  const data = JSON.parse(readFileSync(showsPath, "utf8")) as ShowsFile;
  const jeff = JSON.parse(readFileSync(jeffPath, "utf8")) as ShowsFile;

  console.log("Comedian Tracker — tour refresh");
  console.log("====================================");
  console.log("Fetching Laylo official calendars and Helium / Improv club pages…");
  const fromLaylo = await scrapeLaylo();
  const fromVenue = await scrapeVenuePages();
  const schulzLaylo = fromLaylo.filter((s) => s.comedianId === "andrew-schulz");
  const jeffVenue = fromVenue.filter((s) => s.comedianId === "jeff-arcuri");

  if (schulzLaylo.length) {
    // Official homepage embed is the Schulz source of truth (TM/LN miss most nights).
    const without = data.shows.filter((s) => s.comedianId !== "andrew-schulz");
    const insertAt = data.shows.findIndex((s) => s.comedianId === "andrew-schulz");
    const at = insertAt === -1 ? without.length : insertAt;
    data.shows = [...without.slice(0, at), ...schulzLaylo, ...without.slice(at)];
    data.generatedAt = new Date().toISOString().slice(0, 10);
    writeFileSync(showsPath, `${JSON.stringify(data, null, 2)}\n`);
  }
  if (jeffVenue.length) {
    jeff.shows = mergeScraped(jeff.shows, jeffVenue);
    jeff.generatedAt = new Date().toISOString().slice(0, 10);
    writeFileSync(jeffPath, `${JSON.stringify(jeff, null, 2)}\n`);
  }

  const shows = [...data.shows, ...jeff.shows];
  const ids = new Set(comedians.comedians.map((c) => c.id));
  const missingComedian = shows.filter((s) => !ids.has(s.comedianId));
  const missingFields = shows.filter(
    (s) => !s.id || !s.comedianId || !s.city || !s.date,
  );
  const samples = shows.filter((s) => s.sample || s.source === "sample");
  const schulzNights = shows.filter((s) => s.comedianId === "andrew-schulz");

  console.log(`shows.json generatedAt: ${data.generatedAt ?? "(none)"}`);
  console.log(`Seed shows: ${shows.length}`);
  console.log(`Sample / placeholder shows: ${samples.length}`);
  console.log(`Andrew Schulz nights: ${schulzNights.length} (expect 16)`);
  console.log(`Comedians with at least one show:`);
  for (const c of comedians.comedians) {
    const n = shows.filter((s) => s.comedianId === c.id).length;
    console.log(`  - ${c.name}: ${n}`);
  }

  if (schulzNights.length !== 16) {
    console.error(`Expected 16 Andrew Schulz nights, found ${schulzNights.length}`);
    process.exit(1);
  }
  if (missingComedian.length || missingFields.length) {
    console.error("\nValidation failed.");
    if (missingComedian.length) {
      console.error("Unknown comedianId:", missingComedian.map((s) => s.id));
    }
    if (missingFields.length) {
      console.error("Incomplete rows:", missingFields.map((s) => s.id));
    }
    process.exit(1);
  }

  console.log("\nValidation OK.");
  console.log("Club pages were merged into seed JSON when parse succeeded.");
  console.log("UI Refresh merges this seed with Ticketmaster/SeatGeek in the browser.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
