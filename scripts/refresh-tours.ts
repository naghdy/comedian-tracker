/**
 * Weekly tour refresh hook.
 *
 * This is a stub. Wire it to a cron job or GitHub Action (suggested: Mondays)
 * once scrapers exist. The web app looks up dates live via Ticketmaster
 * Discovery (see README); this script only validates committed seed JSON.
 *
 * Suggested public sources (respect robots.txt / ToS; prefer official pages):
 *   - Ricky Gervais — Live Nation UK, Comedy.co.uk, rickygervais.com
 *   - Dave Chappelle — Live Nation, MSG, venue calendars (dates appear late)
 *   - Andrew Schulz — livenation.com artist page (also listed as Schultz)
 *   - Mark Gagnon — https://markgagnonlive.com
 *
 * Output: rewrite data/shows.json. User-added shows live in localStorage and
 * will not be overwritten by this file.
 *
 * Usage:
 *   npm run refresh-tours
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Show = {
  id: string;
  comedianId: string;
  city: string;
  date: string;
  sample?: boolean;
  source?: string;
};

type ShowsFile = {
  generatedAt?: string;
  sourceNotes?: string;
  shows: Show[];
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const showsPath = resolve(root, "data/shows.json");
const jeffPath = resolve(root, "data/jeff-arcuri-shows.json");
const comediansPath = resolve(root, "data/comedians.json");

function main() {
  const comedians = JSON.parse(readFileSync(comediansPath, "utf8")) as {
    comedians: { id: string; name: string }[];
  };
  const data = JSON.parse(readFileSync(showsPath, "utf8")) as ShowsFile;
  const jeff = JSON.parse(readFileSync(jeffPath, "utf8")) as ShowsFile;
  const shows = [...data.shows, ...jeff.shows];
  const ids = new Set(comedians.comedians.map((c) => c.id));

  const missingComedian = shows.filter((s) => !ids.has(s.comedianId));
  const missingFields = shows.filter(
    (s) => !s.id || !s.comedianId || !s.city || !s.date,
  );
  const samples = shows.filter((s) => s.sample || s.source === "sample");

  console.log("Comedian Tracker — tour refresh stub");
  console.log("====================================");
  console.log(`shows.json generatedAt: ${data.generatedAt ?? "(none)"}`);
  console.log(`jeff-arcuri-shows.json generatedAt: ${jeff.generatedAt ?? "(none)"}`);
  console.log(`Seed shows: ${shows.length}`);
  console.log(`Sample / placeholder shows: ${samples.length}`);
  console.log(`Comedians with at least one show:`);
  for (const c of comedians.comedians) {
    const n = shows.filter((s) => s.comedianId === c.id).length;
    console.log(`  - ${c.name}: ${n}`);
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

  console.log("\nValidation OK. No live scrape ran.");
  console.log("To implement weekly refresh:");
  console.log("  1. Fetch each official tour page / listing.");
  console.log("  2. Normalize to { id, comedianId, title, venue, city, region, country, date, time?, ticketUrl?, sample? }.");
  console.log("  3. Keep sample:true rows unless a listed date replaces that city/window.");
  console.log("  4. Write data/shows.json and bump generatedAt.");
  console.log("  5. Leave localStorage user edits alone — the app merges on top of seed.");
}

main();
