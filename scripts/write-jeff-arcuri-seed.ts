import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LN = "https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events";
const FRESH = "Jeff Arcuri: Fresh Cut";
const ROAD = "Jeff Arcuri: The Road Trip Tour";

type Row = [
  date: string,
  venue: string,
  city: string,
  region: string,
  country: string,
  ticketUrl: string,
  title: string,
];

const rows: Row[] = [
  ["2026-09-24", "Summit City Comedy Club", "Fort Wayne", "IN", "US", "https://www.summitcitycomedy.com/events/134902", FRESH],
  ["2026-09-25", "Summit City Comedy Club", "Fort Wayne", "IN", "US", "https://www.summitcitycomedy.com/events/134902", FRESH],
  ["2026-09-26", "Summit City Comedy Club", "Fort Wayne", "IN", "US", "https://www.summitcitycomedy.com/events/134902", FRESH],
  ["2026-10-08", "Brea Improv", "Brea", "CA", "US", "https://improv.com/brea/comic/jeff+arcuri/", FRESH],
  ["2026-10-09", "Brea Improv", "Brea", "CA", "US", "https://improv.com/brea/comic/jeff+arcuri/", FRESH],
  ["2026-10-10", "Brea Improv", "Brea", "CA", "US", "https://improv.com/brea/comic/jeff+arcuri/", FRESH],
  ["2026-10-22", "Funny Bone Comedy Club Orlando", "Orlando", "FL", "US", "https://orlando.funnybone.com/calendar/", FRESH],
  ["2026-10-23", "Funny Bone Comedy Club Orlando", "Orlando", "FL", "US", "https://orlando.funnybone.com/calendar/", FRESH],
  ["2026-10-24", "Funny Bone Comedy Club Orlando", "Orlando", "FL", "US", "https://orlando.funnybone.com/calendar/", FRESH],
  ["2026-11-05", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-06", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-07", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-20", "Punch Line Comedy Club", "Sacramento", "CA", "US", "https://www.ticketmaster.com/jeff-arcuri-fresh-cut-sacramento-california-11-20-2026/event/1C006486C74BFAEF", FRESH],
  ["2026-11-21", "Punch Line Comedy Club", "Sacramento", "CA", "US", LN, FRESH],
  ["2026-11-22", "Punch Line Comedy Club", "Sacramento", "CA", "US", "https://www.ticketmaster.com/jeff-arcuri-fresh-cut-sacramento-california-11-22-2026/event/1C006486C75DFB12", FRESH],
  ["2026-12-03", "Huntsville Levity Live", "Huntsville", "AL", "US", "https://levitylive.com/huntsville/event/jeff+arcuri%3a+fresh+cut/14829763/", FRESH],
  ["2026-12-04", "Huntsville Levity Live", "Huntsville", "AL", "US", "https://levitylive.com/huntsville/event/jeff+arcuri%3a+fresh+cut/14829763/", FRESH],
  ["2026-12-05", "Huntsville Levity Live", "Huntsville", "AL", "US", "https://www.ticketweb.com/event/jeff-arcuri-fresh-cut-huntsville-levity-live-tickets/14829763", FRESH],
  ["2027-01-19", "The Magnolia", "El Cajon", "CA", "US", "https://www.ticketmaster.com/jeff-arcuri-the-road-trip-tour-el-cajon-california-01-19-2027/event/0B0064D1D8E64F13", ROAD],
  ["2027-01-20", "The Magnolia", "El Cajon", "CA", "US", LN, ROAD],
  ["2027-01-21", "The Magnolia", "El Cajon", "CA", "US", LN, ROAD],
  ["2027-01-22", "The Masonic", "San Francisco", "CA", "US", LN, ROAD],
  ["2027-01-23", "The Masonic", "San Francisco", "CA", "US", LN, ROAD],
  ["2027-01-24", "The Masonic", "San Francisco", "CA", "US", LN, ROAD],
  ["2027-01-29", "Moore Theatre", "Seattle", "WA", "US", LN, ROAD],
  ["2027-01-30", "Moore Theatre", "Seattle", "WA", "US", LN, ROAD],
  ["2027-02-05", "Palazzo Theatre", "Las Vegas", "NV", "US", LN, ROAD],
  ["2027-02-06", "Palazzo Theatre", "Las Vegas", "NV", "US", LN, ROAD],
  ["2027-02-25", "Taft Theatre", "Cincinnati", "OH", "US", LN, ROAD],
  ["2027-02-26", "Temple Theatre", "Saginaw", "MI", "US", LN, ROAD],
  ["2027-02-27", "Old National Centre", "Indianapolis", "IN", "US", LN, ROAD],
  ["2027-03-03", "Stifel Theatre", "St. Louis", "MO", "US", LN, ROAD],
  ["2027-03-05", "State Theatre", "Minneapolis", "MN", "US", LN, ROAD],
  ["2027-03-06", "State Theatre", "Minneapolis", "MN", "US", LN, ROAD],
  ["2027-03-07", "Orpheum", "Madison", "WI", "US", LN, ROAD],
  ["2027-03-09", "Hoyt Sherman Place", "Des Moines", "IA", "US", LN, ROAD],
  ["2027-03-10", "Hoyt Sherman Place", "Des Moines", "IA", "US", LN, ROAD],
  ["2027-03-12", "Orpheum", "Wichita", "KS", "US", LN, ROAD],
  ["2027-03-21", "Orpheum", "New Orleans", "LA", "US", LN, ROAD],
  ["2027-04-14", "Saenger", "Pensacola", "FL", "US", LN, ROAD],
  ["2027-04-15", "Alabama Theatre", "Birmingham, AL", "AL", "US", LN, ROAD],
  ["2027-04-16", "Coca-Cola Roxy", "Atlanta", "GA", "US", LN, ROAD],
  ["2027-04-17", "Tennessee Theatre", "Knoxville", "TN", "US", LN, ROAD],
  ["2027-04-24", "DPAC", "Durham", "NC", "US", LN, ROAD],
  ["2027-05-14", "State Theatre", "Portland, ME", "ME", "US", LN, ROAD],
  ["2027-05-20", "Flagstar at Westbury Music Fair", "Westbury", "NY", "US", LN, ROAD],
  ["2027-05-21", "Warner Theatre", "Washington", "DC", "US", LN, ROAD],
  ["2027-05-22", "Warner Theatre", "Washington", "DC", "US", LN, ROAD],
  ["2027-06-04", "Hippodrome", "Baltimore", "MD", "US", LN, ROAD],
  ["2027-06-05", "Beacon Theatre", "New York", "NY", "US", "https://www.ticketmaster.com/jeff-arcuri-the-road-trip-tour-new-york-new-york-06-05-2027/event/3B0064D3C28F5CD3", ROAD],
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const shows = rows.map(([date, venue, city, region, country, ticketUrl, title]) => ({
  id: `ja-${date}-${slug(city)}`,
  comedianId: "jeff-arcuri",
  title,
  venue,
  city,
  region,
  country,
  date,
  ticketUrl,
  source: "listed",
}));

const payload = {
  generatedAt: "2026-09-09",
  sourceNotes:
    "Jeff Arcuri verified 2026-09-09. Official hubs: jeffarcuri.com/shows, Live Nation artist page K8vZ9179td0, Ticketmaster artist 2569710. 2026 clubs from venue pages + LN/TM. 2027 Road Trip: confirmed LN/TM nights only, one row per calendar day. Excluded unverified: Oxnard Oct 2026, Mississauga Sep 2026. No 2026-01 dates.",
  shows,
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../data/jeff-arcuri-shows.json");
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${shows.length} shows to ${out}`);
