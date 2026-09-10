import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TITLE = "Chris D'Elia";

type Row = [
  date: string,
  venue: string,
  city: string,
  region: string | undefined,
  country: string,
  ticketUrl: string,
  time?: string,
];

/** One row per calendar night from chrisdelia.com as of 2026-09-10. */
const rows: Row[] = [
  ["2026-09-11", "Stand Up Live", "Phoenix", "AZ", "US", "https://phoenix.standuplive.com/events/137700"],
  ["2026-09-12", "Stand Up Live", "Phoenix", "AZ", "US", "https://phoenix.standuplive.com/events/137700", "20:45"],
  ["2026-09-13", "Tempe Improv", "Tempe", "AZ", "US", "https://www.tempeimprov.com/events/137702"],
  ["2026-09-24", "Stardome", "Birmingham, AL", "AL", "US", "https://www.stardome.com/shows/377381"],
  ["2026-09-25", "Helium Comedy Club", "Alpharetta", "GA", "US", "https://atlanta.heliumcomedy.com/events/139026"],
  ["2026-09-26", "Helium Comedy Club", "Alpharetta", "GA", "US", "https://atlanta.heliumcomedy.com/events/139026"],
  ["2026-09-27", "Helium Comedy Club", "Alpharetta", "GA", "US", "https://atlanta.heliumcomedy.com/events/139026", "19:00"],
  ["2026-10-02", "Helium Comedy Club", "Buffalo", "NY", "US", "https://buffalo.heliumcomedy.com/events/139219"],
  ["2026-10-03", "Helium Comedy Club", "Buffalo", "NY", "US", "https://buffalo.heliumcomedy.com/events/139219"],
  ["2026-10-04", "Helium Comedy Club", "Buffalo", "NY", "US", "https://buffalo.heliumcomedy.com/events/139219", "19:00"],
  ["2026-10-11", "Apollo Theatre", "Paris", undefined, "France", "https://bilit.events/event/chris-delia-go-for-it-the-tour-paris"],
  ["2026-10-12", "Chateau Neuf", "Oslo", undefined, "Norway", "https://www.ticketmaster.no/event/chris-delia-go-for-it-tour-live-in-oslo-billetter/1467912556"],
  ["2026-10-14", "Quatsch Comedy Club", "Berlin", undefined, "Germany", "https://bilit.events/event/chris-delia-go-for-it-the-tour-berlin"],
  ["2026-10-15", "La Madeleine", "Brussels", undefined, "Belgium", "https://show-chrisdelia-lamadeleine.ticketlive.be"],
  ["2026-10-16", "RunAn", "Gothenburg", undefined, "Sweden", "https://bilit.events/event/chris-delia-go-for-it-the-tour-gothenburg"],
  ["2026-10-17", "Scandic Falkoner Auditorium", "Copenhagen", undefined, "Denmark", "https://bilit.events/event/chris-delia-go-for-it-the-tour-copenhagen"],
  ["2026-10-20", "Albert Hall", "Manchester", "England", "UK", "https://bilit.events/event/chris-delia-go-for-it-the-tour-manchester"],
  ["2026-10-21", "Queen Elizabeth II Center", "London", "England", "UK", "https://bilit.events/event/chris-delia-go-for-it-the-tour-london"],
  ["2026-10-24", "Berio Hall at Wiener Konzerthaus", "Vienna", undefined, "Austria", "https://bilit.events/event/chris-delia-go-for-it-the-tour-vienna"],
  ["2026-10-25", "Laeiszhalle Kleiner Saal", "Hamburg", undefined, "Germany", "https://www.ticketmaster.de/event/chris-delia-go-for-it-the-tour-tickets/1393853007", "19:00"],
  ["2026-10-26", "Sodra Teatern", "Stockholm", undefined, "Sweden", "https://secure.tickster.com/sv/z80c330086b36fg/selectproductgroup"],
  ["2026-11-07", "Xcite Center at Parx Casino", "Bensalem", "PA", "US", "https://www.axs.com/events/1447719/chris-delia-21-event-tickets?skin=parxcasino"],
  ["2026-11-13", "Palm Beach Improv", "Wellington, FL", "FL", "US", "https://www.palmbeachimprov.com/events/140732"],
  ["2026-11-14", "Palm Beach Improv", "Wellington, FL", "FL", "US", "https://www.palmbeachimprov.com/events/140732"],
  ["2026-11-15", "Palm Beach Improv", "Wellington, FL", "FL", "US", "https://www.palmbeachimprov.com/events/140732", "18:00"],
  ["2026-11-20", "Rose City Comedy", "Tyler", "TX", "US", "https://www.tixr.com/groups/rosecitycomedy/events/chris-d-elia-special-event--191012"],
  ["2026-11-21", "Rose City Comedy", "Tyler", "TX", "US", "https://www.tixr.com/groups/rosecitycomedy/events/chris-d-elia-special-event--191012"],
  ["2026-11-28", "AleSmith Brewery", "San Diego", "CA", "US", "https://www.eventbrite.com/e/chris-delia-alesmith-brewing-on-sat-nov-28-one-night-only-tickets-1999009435032"],
  ["2026-12-11", "Skyline Comedy Club", "Appleton", "WI", "US", "https://www.skylinecomedy.com/events/136903"],
  ["2026-12-12", "Skyline Comedy Club", "Appleton", "WI", "US", "https://www.skylinecomedy.com/events/136903"],
  ["2026-12-13", "Skyline Comedy Club", "Appleton", "WI", "US", "https://www.skylinecomedy.com/events/136903", "18:00"],
  ["2026-12-17", "Helium Comedy Club", "Indianapolis", "IN", "US", "https://indianapolis.heliumcomedy.com/events/142021"],
  ["2026-12-18", "Helium Comedy Club", "Indianapolis", "IN", "US", "https://indianapolis.heliumcomedy.com/events/142021"],
  ["2026-12-19", "Helium Comedy Club", "Indianapolis", "IN", "US", "https://indianapolis.heliumcomedy.com/events/142021"],
  ["2027-01-08", "Houston Improv", "Houston", "TX", "US", "https://improvtx.com/houston/comic/chris+d%27elia/"],
  ["2027-01-09", "Houston Improv", "Houston", "TX", "US", "https://improvtx.com/houston/comic/chris+d%27elia/"],
  ["2027-01-10", "Houston Improv", "Houston", "TX", "US", "https://improvtx.com/houston/comic/chris+d%27elia/", "19:00"],
  ["2027-01-22", "Irvine Improv", "Irvine", "CA", "US", "https://improv.com/irvine/comic/chris+d%27elia/"],
  ["2027-01-23", "Irvine Improv", "Irvine", "CA", "US", "https://improv.com/irvine/comic/chris+d%27elia/"],
  ["2027-01-28", "Side Splitters Comedy Club", "Tampa", "FL", "US", "https://sidesplitterscomedytampa.punchup.live/shows/chris-delia-special-event", "19:00"],
  ["2027-01-29", "Side Splitters Comedy Club", "Tampa", "FL", "US", "https://sidesplitterscomedytampa.punchup.live/shows/chris-delia-special-event"],
  ["2027-01-30", "Side Splitters Comedy Club", "Tampa", "FL", "US", "https://sidesplitterscomedytampa.punchup.live/shows/chris-delia-special-event"],
  ["2027-02-05", "Off The Hook Comedy Club", "Naples", "FL", "US", "https://www.offthehookcomedy.com/events/133178"],
  ["2027-02-06", "Off The Hook Comedy Club", "Naples", "FL", "US", "https://www.offthehookcomedy.com/events/133178"],
  ["2027-02-18", "The Comedy Vault", "Batavia", "IL", "US", "https://www.comedyvaultbatavia.com/events/143356", "19:30"],
  ["2027-02-19", "The Comedy Vault", "Batavia", "IL", "US", "https://www.comedyvaultbatavia.com/events/143356"],
  ["2027-02-20", "The Comedy Vault", "Batavia", "IL", "US", "https://www.comedyvaultbatavia.com/events/143356"],
  ["2027-02-26", "Addison Improv", "Addison", "TX", "US", "https://improvtx.com/addison/comic/chris+d%27elia/"],
  ["2027-02-27", "Addison Improv", "Addison", "TX", "US", "https://improvtx.com/addison/comic/chris+d%27elia/"],
  ["2027-02-28", "Addison Improv", "Addison", "TX", "US", "https://improvtx.com/addison/comic/chris+d%27elia/", "19:30"],
  ["2027-03-25", "Cap City Comedy Club", "Austin", "TX", "US", "https://www.capcitycomedy.com/events/142262", "19:30"],
  ["2027-03-26", "Cap City Comedy Club", "Austin", "TX", "US", "https://www.capcitycomedy.com/events/142262"],
  ["2027-03-27", "Cap City Comedy Club", "Austin", "TX", "US", "https://www.capcitycomedy.com/events/142262"],
  ["2027-04-15", "Goodnights Comedy Club", "Raleigh", "NC", "US", "https://www.goodnightscomedy.com/events/142299", "19:30"],
  ["2027-04-16", "Goodnights Comedy Club", "Raleigh", "NC", "US", "https://www.goodnightscomedy.com/events/142299"],
  ["2027-04-17", "Goodnights Comedy Club", "Raleigh", "NC", "US", "https://www.goodnightscomedy.com/events/142299"],
  ["2027-04-22", "The Comedy Zone", "Jacksonville", "FL", "US", "https://www.comedyzone.com/events/142381", "19:15"],
  ["2027-04-23", "The Comedy Zone", "Jacksonville", "FL", "US", "https://www.comedyzone.com/events/142381"],
  ["2027-04-24", "The Comedy Zone", "Jacksonville", "FL", "US", "https://www.comedyzone.com/events/142381"],
  ["2027-05-13", "Bananas Comedy Club", "Rutherford", "NJ", "US", "https://www.bananascomedyclub.com/events/142261", "19:30"],
  ["2027-05-14", "Bananas Comedy Club", "Rutherford", "NJ", "US", "https://www.bananascomedyclub.com/events/142261"],
  ["2027-05-15", "Bananas Comedy Club", "Rutherford", "NJ", "US", "https://www.bananascomedyclub.com/events/142261"],
];

const shows = rows.map(([date, venue, city, region, country, ticketUrl, time]) => {
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
    ticketUrl,
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
        "Chris D'Elia verified 2026-09-10 from official hub chrisdelia.com. One row per calendar night (multiple club showtimes collapsed). Per-night ticket URLs from official Buy Tickets links. Hamburg time corroborated by Elbphilharmonie/Laeiszhalle. San Antonio Live Nation-only dates omitted. No invented Sample dates.",
      shows,
    },
    null,
    2,
  )}\n`,
);
console.log(`Wrote ${shows.length} Chris D'Elia nights to ${out}`);
