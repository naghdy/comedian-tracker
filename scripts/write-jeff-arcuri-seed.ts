import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TM = "https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710";
const FRESH = "Jeff Arcuri: Fresh Cut";
const ROAD = "Jeff Arcuri: The Road Trip Tour";

type Row = [
  date: string,
  venue: string,
  city: string,
  region: string,
  country: string,
  time: string,
  ticketUrl: string,
  title: string,
];

const rows: Row[] = [
  ["2026-09-24", "Summit City Comedy Club", "Fort Wayne", "IN", "US", "19:00", "https://www.summitcitycomedy.com/events/134902", FRESH],
  ["2026-09-25", "Summit City Comedy Club", "Fort Wayne", "IN", "US", "19:00", "https://www.summitcitycomedy.com/events/134902", FRESH],
  ["2026-09-26", "Summit City Comedy Club", "Fort Wayne", "IN", "US", "18:00", "https://www.summitcitycomedy.com/events/134902", FRESH],
  ["2026-10-22", "Funny Bone Comedy Club", "Orlando", "FL", "US", "19:00", TM, FRESH],
  ["2026-10-23", "Funny Bone Comedy Club", "Orlando", "FL", "US", "19:00", TM, FRESH],
  ["2026-10-24", "Funny Bone Comedy Club", "Orlando", "FL", "US", "18:30", TM, FRESH],
  ["2026-11-05", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "19:30", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-06", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "19:30", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-07", "Fort Lauderdale Improv", "Dania Beach", "FL", "US", "19:00", "https://www.improvftl.com/events/134911", FRESH],
  ["2026-11-20", "Punch Line Comedy Club", "Sacramento", "CA", "US", "19:00", TM, FRESH],
  ["2026-11-21", "Punch Line Comedy Club", "Sacramento", "CA", "US", "19:00", TM, FRESH],
  ["2026-11-22", "Punch Line Comedy Club", "Sacramento", "CA", "US", "19:00", TM, FRESH],
  ["2026-12-03", "Huntsville Levity Live", "Huntsville", "AL", "US", "19:00", "https://levitylive.com/comic/jeff+arcuri/", FRESH],
  ["2026-12-04", "Huntsville Levity Live", "Huntsville", "AL", "US", "19:00", "https://levitylive.com/comic/jeff+arcuri/", FRESH],
  ["2026-12-05", "Huntsville Levity Live", "Huntsville", "AL", "US", "18:00", "https://levitylive.com/comic/jeff+arcuri/", FRESH],
  ["2026-12-17", "Comedy Works Downtown", "Denver", "CO", "US", "19:00", "https://comedyworks.com/comedians/jeff-arcuri", FRESH],
  ["2026-12-18", "Comedy Works Downtown", "Denver", "CO", "US", "19:00", "https://comedyworks.com/comedians/jeff-arcuri", FRESH],
  ["2026-12-19", "Comedy Works Downtown", "Denver", "CO", "US", "19:00", "https://comedyworks.com/comedians/jeff-arcuri", FRESH],
  ["2027-01-19", "The Magnolia", "El Cajon", "CA", "US", "19:30", TM, ROAD],
  ["2027-01-20", "The Magnolia", "El Cajon", "CA", "US", "19:30", TM, ROAD],
  ["2027-01-21", "The Magnolia", "El Cajon", "CA", "US", "19:30", TM, ROAD],
  ["2027-01-22", "The Masonic", "San Francisco", "CA", "US", "19:00", TM, ROAD],
  ["2027-01-23", "The Masonic", "San Francisco", "CA", "US", "18:00", TM, ROAD],
  ["2027-01-27", "Arlene Schnitzer Concert Hall", "Portland", "OR", "US", "19:30", TM, ROAD],
  ["2027-01-28", "Arlene Schnitzer Concert Hall", "Portland", "OR", "US", "19:30", TM, ROAD],
  ["2027-01-29", "Moore Theatre", "Seattle", "WA", "US", "19:00", TM, ROAD],
  ["2027-01-30", "Moore Theatre", "Seattle", "WA", "US", "19:00", TM, ROAD],
  ["2027-01-31", "Royal Theatre", "Victoria", "BC", "Canada", "", TM, ROAD],
  ["2027-02-04", "Eccles Theatre", "Salt Lake City", "UT", "US", "", TM, ROAD],
  ["2027-02-05", "Palazzo Theatre at The Venetian", "Las Vegas", "NV", "US", "21:30", TM, ROAD],
  ["2027-02-06", "Palazzo Theatre at The Venetian", "Las Vegas", "NV", "US", "", TM, ROAD],
  ["2027-02-23", "Connor Palace at Playhouse Square", "Cleveland", "OH", "US", "", TM, ROAD],
  ["2027-02-24", "Palace Theatre", "Columbus", "OH", "US", "", TM, ROAD],
  ["2027-02-25", "Taft Theatre", "Cincinnati", "OH", "US", "", TM, ROAD],
  ["2027-02-26", "Temple Theatre", "Saginaw", "MI", "US", "", TM, ROAD],
  ["2027-02-27", "Murat Theatre at Old National Centre", "Indianapolis", "IN", "US", "", TM, ROAD],
  ["2027-03-03", "Stifel Theatre", "St. Louis", "MO", "US", "", TM, ROAD],
  ["2027-03-04", "Paramount Theatre", "Cedar Rapids", "IA", "US", "", TM, ROAD],
  ["2027-03-05", "State Theatre", "Minneapolis", "MN", "US", "", TM, ROAD],
  ["2027-03-07", "Orpheum Theatre", "Madison", "WI", "US", "", TM, ROAD],
  ["2027-03-09", "Hoyt Sherman Place", "Des Moines", "IA", "US", "", TM, ROAD],
  ["2027-03-11", "The Midland Theatre", "Kansas City", "MO", "US", "", TM, ROAD],
  ["2027-03-12", "Orpheum Theatre", "Wichita", "KS", "US", "", TM, ROAD],
  ["2027-03-13", "Tulsa Theater", "Tulsa", "OK", "US", "", TM, ROAD],
  ["2027-03-17", "Tobin Center for the Performing Arts", "San Antonio", "TX", "US", "", TM, ROAD],
  ["2027-03-18", "Smart Financial Centre", "Sugar Land", "TX", "US", "", TM, ROAD],
  ["2027-03-19", "Majestic Theatre", "Dallas", "TX", "US", "", TM, ROAD],
  ["2027-03-21", "Orpheum Theater", "New Orleans", "LA", "US", "", TM, ROAD],
  ["2027-04-09", "Florida Theatre", "Jacksonville", "FL", "US", "", TM, ROAD],
  ["2027-04-10", "Ruth Eckerd Hall", "Clearwater", "FL", "US", "", TM, ROAD],
  ["2027-04-11", "Ruby Diamond Concert Hall", "Tallahassee", "FL", "US", "", TM, ROAD],
  ["2027-04-14", "Pensacola Saenger Theatre", "Pensacola", "FL", "US", "", TM, ROAD],
  ["2027-04-15", "Alabama Theatre", "Birmingham, AL", "AL", "US", "", TM, ROAD],
  ["2027-04-16", "Coca-Cola Roxy", "Atlanta", "GA", "US", "", TM, ROAD],
  ["2027-04-17", "Tennessee Theatre", "Knoxville", "TN", "US", "", TM, ROAD],
  ["2027-04-21", "Belk Theater", "Charlotte", "NC", "US", "", TM, ROAD],
  ["2027-04-22", "Altria Theater", "Richmond", "VA", "US", "", TM, ROAD],
  ["2027-04-23", "Wilson Center", "Wilmington", "NC", "US", "", TM, ROAD],
  ["2027-04-24", "Durham Performing Arts Center", "Durham", "NC", "US", "", TM, ROAD],
  ["2027-04-25", "Charleston Gaillard Center", "Charleston", "SC", "US", "", TM, ROAD],
  ["2027-05-14", "State Theatre", "Portland, ME", "ME", "US", "", TM, ROAD],
  ["2027-05-15", "Veterans Memorial Auditorium", "Providence", "RI", "US", "", TM, ROAD],
  ["2027-05-20", "Flagstar at Westbury Music Fair", "Westbury", "NY", "US", "", TM, ROAD],
  ["2027-05-21", "Warner Theatre", "Washington", "DC", "US", "", TM, ROAD],
  ["2027-06-04", "The Hippodrome Theatre", "Baltimore", "MD", "US", "", TM, ROAD],
  ["2027-06-05", "Beacon Theatre", "New York", "NY", "US", "", TM, ROAD],
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const shows = rows.map(([date, venue, city, region, country, time, ticketUrl, title]) => {
  const show: Record<string, string> = {
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
  };
  if (time) show.time = time;
  return show;
});

const payload = {
  generatedAt: "2026-09-09",
  sourceNotes:
    "Jeff Arcuri verified 2026-09-09. 2026 clubs: Summit City Comedy Club, Fort Lauderdale Improv, Levity Live Huntsville, Comedy Works Denver, Ticketmaster (Sacramento Punch Line, Orlando Funny Bone listings). 2027 Road Trip: Live Nation announcement plus Ticketmaster extras (El Cajon 21 Jan, Portland 28 Jan, Las Vegas 5 Feb). One row per night. Oxnard Levity omitted (official Oxnard calendar lists Martin Amini that weekend).",
  shows,
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../data/jeff-arcuri-shows.json");
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${shows.length} shows to ${out}`);
