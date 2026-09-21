import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hydrateJeffSeed } from "./storage";
import type { StoredState } from "../types";
import comedianShows from "../../data/shows.json";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";
import chrisDeliaShows from "../../data/chris-delia-shows.json";
import comedians from "../../data/comedians.json";

describe("hydrateJeffSeed", () => {
  it("adds Jeff and seed shows when the roster has an empty Jeff row", () => {
    const incoming: StoredState = {
      comedians: [
        {
          id: "jeff-arcuri",
          name: "Jeff Arcuri",
          color: "#fff",
        },
      ],
      shows: [],
    };
    const next = hydrateJeffSeed(incoming);
    const jeffShows = next.shows.filter((show) => show.comedianId === "jeff-arcuri");
    assert.equal(jeffShows.length, jeffArcuriShows.shows.length);
    assert.equal(
      next.comedians[0]?.tourUrl,
      "https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events",
    );
  });

  it("replaces stale listed Jeff nights and keeps user/lookup rows", () => {
    const incoming: StoredState = {
      comedians: [
        {
          id: "jeff-arcuri",
          name: "Jeff Arcuri",
          color: "#fff",
          tourUrl: "https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710",
        },
      ],
      shows: [
        {
          id: "stale-denver",
          comedianId: "jeff-arcuri",
          title: "Jeff Arcuri: Fresh Cut",
          venue: "Comedy Works Downtown",
          city: "Denver",
          date: "2026-12-17",
          source: "listed",
        },
        {
          id: "user-austin",
          comedianId: "jeff-arcuri",
          title: "Jeff Arcuri",
          venue: "Local Club",
          city: "Austin",
          date: "2026-12-01",
          source: "user",
        },
      ],
    };
    const next = hydrateJeffSeed(incoming);
    assert.equal(
      next.shows.some((show) => show.city === "Denver"),
      false,
    );
    assert.equal(
      next.shows.some((show) => show.id === "user-austin"),
      true,
    );
    assert.equal(
      next.shows.some((show) => show.city === "Brea"),
      true,
    );
    assert.equal(
      next.comedians[0]?.tourUrl,
      "https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events",
    );
  });
});

describe("jeff seed dates", () => {
  it("is the verified 2026-09-09 list only", () => {
    const dates = jeffArcuriShows.shows.map((show) => `${show.date} ${show.city} ${show.venue}`);
    assert.equal(jeffArcuriShows.shows.length, 50);
    assert.equal(
      dates.some((row) => /oxnard|mississauga|denver|comedy works/i.test(row)),
      false,
    );
    assert.equal(
      jeffArcuriShows.shows.some((show) => show.date.startsWith("2026-01")),
      false,
    );
    assert.equal(
      jeffArcuriShows.shows.filter((show) => show.city === "San Francisco").length,
      3,
    );
  });
});

describe("Andrew Schulz seed", () => {
  it("has 16 official Laylo nights including Columbus Funny Bone", () => {
    const schulz = comedianShows.shows.filter(
      (show) => show.comedianId === "andrew-schulz",
    );
    assert.equal(schulz.length, 16);
    assert.equal(schulz.filter((show) => show.city === "New Brunswick").length, 2);
    assert.equal(schulz.filter((show) => show.city === "Indianapolis").length, 2);
    assert.equal(schulz.filter((show) => show.city === "Columbus").length, 2);
    assert.equal(schulz.filter((show) => show.city === "Birmingham, AL").length, 2);
  });

  it("migrates a 4-date Schulz snapshot to the full 16-night Laylo calendar", () => {
    const incoming: StoredState = {
      comedians: [
        {
          id: "andrew-schulz",
          name: "Andrew Schulz",
          color: "#3b82d6",
          tourUrl: "https://theandrewschulz.com/",
        },
      ],
      shows: [
        {
          id: "as-2026-09-18-houston",
          comedianId: "andrew-schulz",
          title: "Andrew Schulz",
          venue: "Houston Improv",
          city: "Houston",
          date: "2026-09-18",
          source: "listed",
        },
        {
          id: "as-2026-09-19-houston",
          comedianId: "andrew-schulz",
          title: "Andrew Schulz",
          venue: "Houston Improv",
          city: "Houston",
          date: "2026-09-19",
          source: "listed",
        },
        {
          id: "as-2026-09-25-westnyack",
          comedianId: "andrew-schulz",
          title: "Andrew Schulz",
          venue: "Levity Live",
          city: "West Nyack",
          date: "2026-09-25",
          source: "listed",
        },
        {
          id: "as-2026-09-26-westnyack",
          comedianId: "andrew-schulz",
          title: "Andrew Schulz",
          venue: "Levity Live",
          city: "West Nyack",
          date: "2026-09-26",
          source: "listed",
        },
      ],
    };
    const next = hydrateJeffSeed(incoming);
    const schulz = next.shows.filter((show) => show.comedianId === "andrew-schulz");
    assert.equal(schulz.length, 16);
    assert.equal(
      schulz.some((show) => show.city === "Indianapolis"),
      true,
    );
    assert.equal(
      schulz.some((show) => show.city === "Columbus"),
      true,
    );
    assert.equal(
      next.comedians[0]?.tourUrl,
      "https://www.theandrewschulz.com/",
    );
  });
});

describe("Dave Chappelle seed", () => {
  const LN_ARTIST = "https://www.livenation.com/artist/K8vZ9171rcf/dave-chappelle-events";
  const karmageddon = [
    ["2026-10-20", "Nashville", "Bridgestone Arena"],
    ["2026-10-21", "Charlotte", "Spectrum Center"],
    ["2026-10-23", "Toronto", "Scotiabank Arena"],
    ["2026-10-24", "Louisville", "KFC Yum! Center"],
    ["2026-10-26", "Austin", "Moody Center ATX"],
    ["2026-10-28", "Houston", "Toyota Center"],
    ["2026-11-06", "New York", "Madison Square Garden"],
    ["2026-11-07", "New York", "Madison Square Garden"],
  ] as const;

  it("has the DC benefit, Fastball Mesa, and the 8-night Karmageddon arena run", () => {
    const chappelle = comedianShows.shows.filter(
      (show) => show.comedianId === "dave-chappelle",
    );
    assert.equal(chappelle.length, 10);
    assert.equal(new Set(chappelle.map((show) => show.date)).size, 10);
    assert.equal(
      chappelle.some(
        (show) =>
          show.date === "2026-09-25" &&
          show.city === "Washington" &&
          show.venue === "DAR Constitution Hall" &&
          show.title === "Dave Chappelle: Benefit for Duke Ellington School of the Arts" &&
          show.time === "19:30" &&
          show.ticketUrl ===
            "https://www.livenation.com/event/1AvfZ_3GkMzylrt/dave-chappelle-benefit-for-duke-ellington-school-of-the-arts",
      ),
      true,
    );
    assert.equal(
      chappelle.some(
        (show) =>
          show.date === "2026-10-18" &&
          show.city === "Mesa" &&
          show.venue === "Sloan Park" &&
          show.ticketUrl === "https://www.fastballcomedy.com/home",
      ),
      true,
    );
    for (const [date, city, venue] of karmageddon) {
      const row = chappelle.find((show) => show.date === date);
      assert.equal(row?.city, city);
      assert.equal(row?.venue, venue);
      assert.equal(row?.title, "Dave Chappelle: Karmageddon");
      assert.equal(row?.time, "19:30");
      assert.equal(row?.ticketUrl?.startsWith("https://www.livenation.com/event/"), true);
    }
    assert.equal(
      chappelle.find((show) => show.date === "2026-11-07")?.ticketUrl,
      "https://www.livenation.com/event/G5diZ_Ke-zg7I/new-york-comedy-festival-ln-present-dave-chappelle-karmageddon",
    );
    assert.equal(
      chappelle.some((show) => show.date === "2026-09-10"),
      false,
    );
    const roster = comedians.comedians.find((item) => item.id === "dave-chappelle");
    assert.equal(roster?.tourUrl, LN_ARTIST);
  });

  it("migrates a v8 MSG+Fastball snapshot to Karmageddon nights", () => {
    const incoming: StoredState = {
      comedians: [
        {
          id: "dave-chappelle",
          name: "Dave Chappelle",
          color: "#2f9e5a",
          tourUrl: "https://www.ticketmaster.com/dave-chappelle-tickets/artist/803682",
        },
      ],
      shows: [
        {
          id: "dc-2026-09-10-nyc",
          comedianId: "dave-chappelle",
          title: "NYC Still Rising After 25 Years",
          venue: "Madison Square Garden",
          city: "New York",
          date: "2026-09-10",
          source: "listed",
        },
        {
          id: "dc-2026-10-18-mesa",
          comedianId: "dave-chappelle",
          title: "Fastball Comedy Festival",
          venue: "Sloan Park",
          city: "Mesa",
          date: "2026-10-18",
          source: "listed",
        },
        {
          id: "user-chappelle-club",
          comedianId: "dave-chappelle",
          title: "Dave Chappelle",
          venue: "Local Club",
          city: "Chicago",
          date: "2026-12-01",
          source: "user",
        },
      ],
    };
    const next = hydrateJeffSeed(incoming);
    const chappelle = next.shows.filter((show) => show.comedianId === "dave-chappelle");
    assert.equal(
      chappelle.some((show) => show.date === "2026-09-10"),
      false,
    );
    assert.equal(
      chappelle.some((show) => show.city === "Nashville"),
      true,
    );
    assert.equal(
      chappelle.some((show) => show.city === "Louisville"),
      true,
    );
    assert.equal(
      chappelle.some((show) => show.id === "user-chappelle-club"),
      true,
    );
    assert.equal(chappelle.filter((show) => show.source === "listed").length, 10);
    assert.equal(
      chappelle.some(
        (show) => show.date === "2026-09-25" && show.city === "Washington",
      ),
      true,
    );
    assert.equal(
      chappelle.some(
        (show) =>
          show.date === "2026-11-06" && show.venue === "Madison Square Garden",
      ),
      true,
    );
    assert.equal(
      chappelle.some(
        (show) =>
          show.date === "2026-11-07" && show.venue === "Madison Square Garden",
      ),
      true,
    );
    assert.equal(next.comedians[0]?.tourUrl, LN_ARTIST);
  });
});

describe("Chris D'Elia seed", () => {
  it("uses an apostrophe in the display name", () => {
    const row = comedians.comedians.find((item) => item.id === "chris-delia");
    assert.equal(row?.name, "Chris D'Elia");
    assert.equal(row?.tourUrl, "https://www.chrisdelia.com/");
  });

  it("has one listed night per official calendar day", () => {
    const dates = chrisDeliaShows.shows.map((show) => show.date);
    assert.equal(chrisDeliaShows.shows.length, 62);
    assert.equal(new Set(dates).size, 62);
    assert.equal(
      chrisDeliaShows.shows.every((show) => show.source === "listed"),
      true,
    );
    assert.equal(
      chrisDeliaShows.shows.some((show) => show.city === "Alpharetta"),
      true,
    );
    assert.equal(
      chrisDeliaShows.shows.some((show) => show.city === "Hamburg"),
      true,
    );
    assert.equal(
      chrisDeliaShows.shows.filter((show) => show.city === "Addison").length,
      3,
    );
    assert.equal(
      chrisDeliaShows.shows.every((show) =>
        Boolean(show.ticketUrl && show.ticketUrl !== "https://www.chrisdelia.com/"),
      ),
      true,
    );
    assert.equal(
      chrisDeliaShows.shows.some((show) => /sample/i.test(show.title)),
      false,
    );
  });

  it("adds Chris and seed nights when the roster does not have him", () => {
    const incoming: StoredState = {
      comedians: [
        {
          id: "jeff-arcuri",
          name: "Jeff Arcuri",
          color: "#fff",
        },
      ],
      shows: [],
    };
    const next = hydrateJeffSeed(incoming);
    const chris = next.comedians.find((item) => item.id === "chris-delia");
    const chrisShows = next.shows.filter((show) => show.comedianId === "chris-delia");
    assert.equal(chris?.name, "Chris D'Elia");
    assert.equal(chrisShows.length, chrisDeliaShows.shows.length);
  });
});

