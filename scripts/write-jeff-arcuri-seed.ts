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
  ["2026-10-15", "New York Comedy Club Stamford", "Stamford", "CT", "US", "https://link.seated.com/f5ee622e-5dab-4d9e-86c8-d6c3f49912c4", FRESH],
  ["2026-10-16", "New York Comedy Club Stamford", "Stamford", "CT", "US", "https://link.seated.com/f5ee622e-5dab-4d9e-86c8-d6c3f49912c4", FRESH],
  ["2026-10-17", "New York Comedy Club Stamford", "Stamford", "CT", "US", "https://link.seated.com/f5ee622e-5dab-4d9e-86c8-d6c3f49912c4", FRESH],
  ["2026-10-22", "Funny Bone Comedy Club Orlando", "Orlando", "FL", "US", "https://orlando.funnybone.com/calendar/", FRESH],
  ["2026-10-23", "Funny Bone Comedy Club Orlando", "Orlando", "FL", "US", "https://orlando.funnybone.com/calendar/", FRESH],
  ["2026-10-24", "Funny Bone Comedy Club Orlando", "Orlando", "FL", "US", "https://orlando.funnybone.com/calendar/", FRESH],
  ["2026-11-05", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-06", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-07", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-12", "Stress Factory", "New Brunswick", "NJ", "US", "https://link.seated.com/917e8288-2267-45e7-95f6-fa617467b681", FRESH],
  ["2026-11-13", "Stress Factory", "New Brunswick", "NJ", "US", "https://link.seated.com/917e8288-2267-45e7-95f6-fa617467b681", FRESH],
  ["2026-11-14", "Stress Factory", "New Brunswick", "NJ", "US", "https://link.seated.com/917e8288-2267-45e7-95f6-fa617467b681", FRESH],
  ["2026-11-20", "Punch Line Comedy Club", "Sacramento", "CA", "US", "https://www.ticketmaster.com/jeff-arcuri-fresh-cut-sacramento-california-11-20-2026/event/1C006486C74BFAEF", FRESH],
  ["2026-11-21", "Punch Line Comedy Club", "Sacramento", "CA", "US", LN, FRESH],
  ["2026-11-22", "Punch Line Comedy Club", "Sacramento", "CA", "US", "https://www.ticketmaster.com/jeff-arcuri-fresh-cut-sacramento-california-11-22-2026/event/1C006486C75DFB12", FRESH],
  ["2026-12-03", "Huntsville Levity Live", "Huntsville", "AL", "US", "https://levitylive.com/huntsville/event/jeff+arcuri%3a+fresh+cut/14829763/", FRESH],
  ["2026-12-04", "Huntsville Levity Live", "Huntsville", "AL", "US", "https://levitylive.com/huntsville/event/jeff+arcuri%3a+fresh+cut/14829763/", FRESH],
  ["2026-12-05", "Huntsville Levity Live", "Huntsville", "AL", "US", "https://www.ticketweb.com/event/jeff-arcuri-fresh-cut-huntsville-levity-live-tickets/14829763", FRESH],
  ["2026-12-17", "Comedy Works", "Denver", "CO", "US", "https://link.seated.com/16b79907-3f4c-4b16-ba6d-73b54394d36f", FRESH],
  ["2026-12-18", "Comedy Works", "Denver", "CO", "US", "https://link.seated.com/16b79907-3f4c-4b16-ba6d-73b54394d36f", FRESH],
  ["2026-12-19", "Comedy Works", "Denver", "CO", "US", "https://link.seated.com/16b79907-3f4c-4b16-ba6d-73b54394d36f", FRESH],
  ["2027-01-19", "The Magnolia", "El Cajon", "CA", "US", "https://www.ticketmaster.com/jeff-arcuri-the-road-trip-tour-el-cajon-california-01-19-2027/event/0B0064D1D8E64F13", ROAD],
  ["2027-01-20", "The Magnolia", "El Cajon", "CA", "US", LN, ROAD],
  ["2027-01-21", "The Magnolia", "El Cajon", "CA", "US", LN, ROAD],
  ["2027-01-22", "The Masonic", "San Francisco", "CA", "US", LN, ROAD],
  ["2027-01-23", "The Masonic", "San Francisco", "CA", "US", LN, ROAD],
  ["2027-01-24", "The Masonic", "San Francisco", "CA", "US", LN, ROAD],
  ["2027-01-27", "Arlene Schnitzer Concert Hall", "Portland", "OR", "US", "https://www.livenation.com/event/vvG1HZ_u5DS-3U/jeff-arcuri-the-road-trip-tour", ROAD],
  ["2027-01-28", "Arlene Schnitzer Concert Hall", "Portland", "OR", "US", "https://www.livenation.com/event/vvG1HZ_uE9fe7Q/jeff-arcuri-the-road-trip-tour", ROAD],
  ["2027-01-29", "Moore Theatre", "Seattle", "WA", "US", LN, ROAD],
  ["2027-01-30", "Moore Theatre", "Seattle", "WA", "US", LN, ROAD],
  ["2027-01-31", "Royal Theatre", "Victoria", "BC", "CA", "https://link.seated.com/6fdd8012-f43c-4a51-8c20-cd6f8f2ba2a4", ROAD],
  ["2027-02-03", "Eccles Theater", "Salt Lake City", "UT", "US", "https://link.seated.com/dd1de5e9-6b29-4c13-b21e-8b44f0d3f5a2", ROAD],
  ["2027-02-04", "Eccles Theater", "Salt Lake City", "UT", "US", "https://link.seated.com/bca75719-86f9-417d-a079-25388099321a", ROAD],
  ["2027-02-05", "Palazzo Theatre", "Las Vegas", "NV", "US", LN, ROAD],
  ["2027-02-06", "Palazzo Theatre", "Las Vegas", "NV", "US", LN, ROAD],
  ["2027-02-23", "Connor Palace at Playhouse Square", "Cleveland", "OH", "US", "https://link.seated.com/a99835b3-c0d7-47e6-a03b-5377ffa9bd21", ROAD],
  ["2027-02-24", "Palace Theatre", "Columbus", "OH", "US", "https://link.seated.com/56b2f717-344c-44b9-b3ba-b0660a07efd3", ROAD],
  ["2027-02-25", "Taft Theatre", "Cincinnati", "OH", "US", LN, ROAD],
  ["2027-02-26", "Temple Theatre", "Saginaw", "MI", "US", LN, ROAD],
  ["2027-02-27", "Old National Centre", "Indianapolis", "IN", "US", LN, ROAD],
  ["2027-03-03", "Stifel Theatre", "St. Louis", "MO", "US", LN, ROAD],
  ["2027-03-04", "Paramount Theatre", "Cedar Rapids", "IA", "US", "https://link.seated.com/ca04f25c-5075-4ef2-a69b-077e992841a2", ROAD],
  ["2027-03-05", "State Theatre", "Minneapolis", "MN", "US", LN, ROAD],
  ["2027-03-06", "State Theatre", "Minneapolis", "MN", "US", LN, ROAD],
  ["2027-03-07", "Orpheum", "Madison", "WI", "US", LN, ROAD],
  ["2027-03-09", "Hoyt Sherman Place", "Des Moines", "IA", "US", LN, ROAD],
  ["2027-03-10", "Hoyt Sherman Place", "Des Moines", "IA", "US", LN, ROAD],
  ["2027-03-11", "The Midland Theatre", "Kansas City", "MO", "US", "https://link.seated.com/c263b0c4-574b-491a-a4be-d2a179b5e57d", ROAD],
  ["2027-03-12", "Orpheum", "Wichita", "KS", "US", LN, ROAD],
  ["2027-03-13", "Tulsa Theater", "Tulsa", "OK", "US", "https://link.seated.com/e8bb4af4-fcad-4fdd-bbd2-ede0a19199a2", ROAD],
  ["2027-03-17", "Tobin Center for the Performing Arts", "San Antonio", "TX", "US", "https://link.seated.com/43ad644e-f846-4541-8d2b-41cc7895bde3", ROAD],
  ["2027-03-18", "Smart Financial Centre at Sugar Land", "Sugar Land", "TX", "US", "https://www.livenation.com/event/G5dIZ_uFbs1xR/jeff-arcuri-the-road-trip-tour", ROAD],
  ["2027-03-19", "Majestic Theatre", "Dallas", "TX", "US", "https://link.seated.com/c3852066-ae97-41b2-acda-5b4c3b172ca7", ROAD],
  ["2027-03-20", "Majestic Theatre", "Dallas", "TX", "US", "https://link.seated.com/d922ba1e-0f63-42d0-9bce-118fcf7f94a3", ROAD],
  ["2027-03-21", "Orpheum", "New Orleans", "LA", "US", LN, ROAD],
  ["2027-04-09", "Florida Theatre", "Jacksonville", "FL", "US", "https://link.seated.com/a2c0b184-daa9-417a-b1b2-a8ba2b2f9ccc", ROAD],
  ["2027-04-10", "Ruth Eckerd Hall", "Clearwater", "FL", "US", "https://link.seated.com/cbeff1e9-6aed-4e91-9a13-1e9c8718c932", ROAD],
  ["2027-04-11", "Ruby Diamond Concert Hall", "Tallahassee", "FL", "US", "https://link.seated.com/a3de0f91-d523-4215-ad16-4076192aed39", ROAD],
  ["2027-04-14", "Saenger", "Pensacola", "FL", "US", LN, ROAD],
  ["2027-04-15", "Alabama Theatre", "Birmingham, AL", "AL", "US", LN, ROAD],
  ["2027-04-16", "Coca-Cola Roxy", "Atlanta", "GA", "US", LN, ROAD],
  ["2027-04-17", "Tennessee Theatre", "Knoxville", "TN", "US", LN, ROAD],
  ["2027-04-21", "Belk Theater", "Charlotte", "NC", "US", "https://link.seated.com/43061dcd-8ee8-4078-b2b9-ac6744c9a774", ROAD],
  ["2027-04-22", "Altria Theater", "Richmond", "VA", "US", "https://link.seated.com/abb3779e-2333-4628-bc20-070854b5d371", ROAD],
  ["2027-04-23", "Wilson Center", "Wilmington", "NC", "US", "https://link.seated.com/c3fe2ecd-c281-4133-9d38-c5546bd9a709", ROAD],
  ["2027-04-24", "DPAC", "Durham", "NC", "US", LN, ROAD],
  ["2027-04-25", "Charleston Gaillard Center", "Charleston", "SC", "US", "https://link.seated.com/d584b189-af0a-4158-ab91-c1a7d116d57e", ROAD],
  ["2027-05-14", "State Theatre", "Portland, ME", "ME", "US", LN, ROAD],
  ["2027-05-15", "Veterans Memorial Auditorium", "Providence", "RI", "US", "https://link.seated.com/24a3712d-2828-4213-b8f8-4dffed38edf7", ROAD],
  ["2027-05-20", "Flagstar at Westbury Music Fair", "Westbury", "NY", "US", LN, ROAD],
  ["2027-05-21", "Warner Theatre", "Washington", "DC", "US", LN, ROAD],
  ["2027-05-22", "Warner Theatre", "Washington", "DC", "US", LN, ROAD],
  ["2027-06-04", "Hippodrome", "Baltimore", "MD", "US", LN, ROAD],
  ["2027-06-05", "Beacon Theatre", "New York", "NY", "US", "https://www.ticketmaster.com/jeff-arcuri-the-road-trip-tour-new-york-new-york-06-05-2027/event/3B0064D3C28F5CD3", ROAD],
  ["2027-06-06", "Beacon Theatre", "New York", "NY", "US", "https://link.seated.com/243aa34d-a61b-4e2f-ac06-54799fea9bb5", ROAD],
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
  generatedAt: "2026-10-05",
  sourceNotes:
    "Jeff Arcuri verified 2026-10-05. Primary source: official Seated widget on jeffarcuri.com/shows (artist ca51f2fa-2a2d-4864-ab5c-857e4d1536cc). Also Live Nation artist page K8vZ9179td0, Ticketmaster artist 2569710, and venue pages. 2026 clubs title \"Jeff Arcuri: Fresh Cut\". 2027 title \"Jeff Arcuri: The Road Trip Tour\". One row per calendar day. Excluded unverified: Oxnard Oct 2026, Mississauga Sep 2026. No 2026-01 dates.",
  shows,
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../data/jeff-arcuri-shows.json");
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${shows.length} shows to ${out}`);
