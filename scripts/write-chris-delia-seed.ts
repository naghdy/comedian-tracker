import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HUB = "https://www.chrisdelia.com/";
const TITLE = "Chris D'Elia";

type Row = [
  date: string,
  venue: string,
  city: string,
  region: string | undefined,
  country: string,
  time: string | undefined,
];

/** One row per calendar night from chrisdelia.com as of 2026-09-10. */
const rows: Row[] = [
  ["2026-09-11", "Stand Up Live", "Phoenix", "AZ", "US", undefined],
  ["2026-09-12", "Stand Up Live", "Phoenix", "AZ", "US", "20:45"],
  ["2026-09-13", "Tempe Improv", "Tempe", "AZ", "US", undefined],
  ["2026-09-24", "Stardome", "Birmingham, AL", "AL", "US", undefined],
  ["2026-09-25", "Helium Comedy Club", "Alpharetta", "GA", "US", undefined],
  ["2026-09-26", "Helium Comedy Club", "Alpharetta", "GA", "US", undefined],
  ["2026-09-27", "Helium Comedy Club", "Alpharetta", "GA", "US", "19:00"],
  ["2026-10-02", "Helium Comedy Club", "Buffalo", "NY", "US", undefined],
  ["2026-10-03", "Helium Comedy Club", "Buffalo", "NY", "US", undefined],
  ["2026-10-04", "Helium Comedy Club", "Buffalo", "NY", "US", "19:00"],
  ["2026-10-11", "Apollo Theatre", "Paris", undefined, "France", undefined],
  ["2026-10-12", "Chateau Neuf", "Oslo", undefined, "Norway", undefined],
  ["2026-10-14", "Quatsch Comedy Club", "Berlin", undefined, "Germany", undefined],
  ["2026-10-15", "La Madeleine", "Brussels", undefined, "Belgium", undefined],
  ["2026-10-16", "RunAn", "Gothenburg", undefined, "Sweden", undefined],
  ["2026-10-17", "Scandic Falkoner Auditorium", "Copenhagen", undefined, "Denmark", undefined],
  ["2026-10-20", "Albert Hall", "Manchester", "England", "UK", undefined],
  ["2026-10-21", "Queen Elizabeth II Center", "London", "England", "UK", undefined],
  ["2026-10-24", "Berio Hall at Wiener Konzerthaus", "Vienna", undefined, "Austria", undefined],
  ["2026-10-25", "Laeiszhalle Kleiner Saal", "Hamburg", undefined, "Germany", "19:00"],
  ["2026-10-26", "Södra Teatern", "Stockholm", undefined, "Sweden", undefined],
  ["2026-11-07", "Xcite Center at Parx Casino", "Bensalem", "PA", "US", undefined],
  ["2026-11-13", "Palm Beach Improv", "Wellington, FL", "FL", "US", undefined],
  ["2026-11-14", "Palm Beach Improv", "Wellington, FL", "FL", "US", undefined],
  ["2026-11-15", "Palm Beach Improv", "Wellington, FL", "FL", "US", "18:00"],
  ["2026-11-20", "Rose City Comedy", "Tyler", "TX", "US", undefined],
  ["2026-11-21", "Rose City Comedy", "Tyler", "TX", "US", undefined],
  ["2026-11-28", "AleSmith Brewery", "San Diego", "CA", "US", undefined],
  ["2026-12-11", "Skyline Comedy Club", "Appleton", "WI", "US", undefined],
  ["2026-12-12", "Skyline Comedy Club", "Appleton", "WI", "US", undefined],
  ["2026-12-13", "Skyline Comedy Club", "Appleton", "WI", "US", "18:00"],
  ["2026-12-17", "Helium Comedy Club", "Indianapolis", "IN", "US", undefined],
  ["2026-12-18", "Helium Comedy Club", "Indianapolis", "IN", "US", undefined],
  ["2026-12-19", "Helium Comedy Club", "Indianapolis", "IN", "US", undefined],
  ["2027-01-08", "Houston Improv", "Houston", "TX", "US", undefined],
  ["2027-01-09", "Houston Improv", "Houston", "TX", "US", undefined],
  ["2027-01-10", "Houston Improv", "Houston", "TX", "US", "19:00"],
  ["2027-01-22", "Irvine Improv", "Irvine", "CA", "US", undefined],
  ["2027-01-23", "Irvine Improv", "Irvine", "CA", "US", undefined],
  ["2027-01-28", "Side Splitters Comedy Club", "Tampa", "FL", "US", "19:00"],
  ["2027-01-29", "Side Splitters Comedy Club", "Tampa", "FL", "US", undefined],
  ["2027-01-30", "Side Splitters Comedy Club", "Tampa", "FL", "US", undefined],
  ["2027-02-05", "Off The Hook Comedy Club", "Naples", "FL", "US", undefined],
  ["2027-02-06", "Off The Hook Comedy Club", "Naples", "FL", "US", undefined],
  ["2027-02-18", "The Comedy Vault", "Batavia", "IL", "US", "19:30"],
  ["2027-02-19", "The Comedy Vault", "Batavia", "IL", "US", undefined],
  ["2027-02-20", "The Comedy Vault", "Batavia", "IL", "US", undefined],
  ["2027-02-26", "Addison Improv", "Dallas", "TX", "US", undefined],
  ["2027-02-27", "Addison Improv", "Dallas", "TX", "US", undefined],
  ["2027-02-28", "Addison Improv", "Dallas", "TX", "US", "19:30"],
  ["2027-03-25", "Cap City Comedy Club", "Austin", "TX", "US", "19:30"],
  ["2027-03-26", "Cap City Comedy Club", "Austin", "TX", "US", undefined],
  ["2027-03-27", "Cap City Comedy Club", "Austin", "TX", "US", undefined],
  ["2027-04-15", "Goodnights Comedy Club", "Raleigh", "NC", "US", "19:30"],
  ["2027-04-16", "Goodnights Comedy Club", "Raleigh", "NC", "US", undefined],
  ["2027-04-17", "Goodnights Comedy Club", "Raleigh", "NC", "US", undefined],
  ["2027-04-22", "The Comedy Zone", "Jacksonville", "FL", "US", "19:15"],
  ["2027-04-23", "The Comedy Zone", "Jacksonville", "FL", "US", undefined],
  ["2027-04-24", "The Comedy Zone", "Jacksonville", "FL", "US", undefined],
  ["2027-05-13", "Bananas Comedy Club", "Rutherford", "NJ", "US", "19:30"],
  ["2027-05-14", "Bananas Comedy Club", "Rutherford", "NJ", "US", undefined],
  ["2027-05-15", "Bananas Comedy Club", "Rutherford", "NJ", "US", undefined],
];

const shows = rows.map(([date, venue, city, region, country, time]) => {
  const idCity = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    id: `cd-${date}-${idCity}`,
    comedianId: "chris-delia",
    title: TITLE,
    venue,
    city,
    ...(region ? { region } : {}),
    country,
    date,
    ...(time ? { time } : {}),
    ticketUrl: HUB,
    source: "listed" as const,
  };
});

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../data/chris-delia-shows.json");
writeFileSync(
  out,
  `${JSON.stringify(
    {
      generatedAt: "2026-09-10",
      sourceNotes:
        "Chris D'Elia verified 2026-09-10 from official hub chrisdelia.com. One row per calendar night (multiple club showtimes collapsed). Hamburg time corroborated by Elbphilharmonie/Laeiszhalle listing. No invented Sample dates.",
      shows,
    },
    null,
    2,
  )}\n`,
);
console.log(`Wrote ${shows.length} Chris D'Elia nights to ${out}`);
