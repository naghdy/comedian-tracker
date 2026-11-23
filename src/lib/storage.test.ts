import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coordsForShow, findCity } from "./geo";
import { hydrateJeffSeed, hydrateSeedShows } from "./storage";
import { SEED_SHOWS } from "./seedData";
import type { StoredState } from "../types";
import comedianShows from "../../data/shows.json";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";
import chrisDeliaShows from "../../data/chris-delia-shows.json";
import moAmerShows from "../../data/mo-amer-shows.json";
import aaronChenShows from "../../data/aaron-chen-shows.json";
import jimmyOYangShows from "../../data/jimmy-o-yang-shows.json";
import zarnaGargShows from "../../data/zarna-garg-shows.json";
import andrewSantinoShows from "../../data/andrew-santino-shows.json";
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
      next.shows.some((show) => show.id === "stale-denver"),
      false,
    );
    assert.equal(
      next.shows.some((show) => show.id === "ja-2026-12-17-denver"),
      true,
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
  it("is the verified 2026-10-05 list", () => {
    const dates = jeffArcuriShows.shows.map((show) => `${show.date} ${show.city} ${show.venue}`);
    assert.equal(jeffArcuriShows.shows.length, 82);
    assert.equal(new Set(jeffArcuriShows.shows.map((show) => show.date)).size, 82);
    assert.equal(
      dates.some((row) => /oxnard|mississauga/i.test(row)),
      false,
    );
    assert.equal(
      jeffArcuriShows.shows.filter((show) => show.city === "Denver" && show.venue === "Comedy Works").length,
      3,
    );
    assert.equal(
      jeffArcuriShows.shows.filter((show) => show.city === "Stamford").length,
      3,
    );
    assert.equal(
      jeffArcuriShows.shows.filter((show) => show.date === "2027-06-06" && show.venue === "Beacon Theatre").length,
      1,
    );
    assert.equal(
      jeffArcuriShows.shows.every((show) => show.source === "listed"),
      true,
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
  it("has 15 official Laylo nights including Columbus Funny Bone", () => {
    const schulz = comedianShows.shows.filter(
      (show) => show.comedianId === "andrew-schulz",
    );
    assert.equal(schulz.length, 15);
    assert.equal(schulz.filter((show) => show.city === "New Brunswick").length, 2);
    assert.equal(schulz.filter((show) => show.city === "Indianapolis").length, 2);
    assert.equal(schulz.filter((show) => show.city === "Columbus").length, 2);
    assert.equal(schulz.filter((show) => show.city === "Birmingham, AL").length, 1);
  });

  it("migrates a 4-date Schulz snapshot to the full 15-night Laylo calendar", () => {
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
    assert.equal(schulz.length, 15);
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
    ["2026-11-04", "Atlanta", "State Farm Arena"],
    ["2026-11-06", "New York", "Madison Square Garden"],
    ["2026-11-07", "New York", "Madison Square Garden"],
  ] as const;

  it("has the DC benefit, Fastball Mesa, and the 10-night Karmageddon arena run", () => {
    const chappelle = comedianShows.shows.filter(
      (show) => show.comedianId === "dave-chappelle",
    );
    assert.equal(chappelle.length, 12);
    assert.equal(new Set(chappelle.map((show) => show.date)).size, 12);
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
      chappelle.find((show) => show.date === "2026-11-04")?.ticketUrl,
      "https://www.livenation.com/event/vvG1zZ_KQsfasA/dave-chappelle",
    );
    assert.equal(
      chappelle.find((show) => show.date === "2026-11-07")?.ticketUrl,
      "https://www.livenation.com/event/G5diZ_Ke-zg7I/new-york-comedy-festival-ln-present-dave-chappelle-karmageddon",
    );
    assert.equal(
      chappelle.some(
        (show) =>
          show.id === "dc-2026-10-27-austin" &&
          show.date === "2026-10-27" &&
          show.time === "19:30" &&
          show.city === "Austin" &&
          show.venue === "Moody Center ATX" &&
          show.title === "Dave Chappelle Karmageddon" &&
          show.ticketUrl ===
            "https://www.livenation.com/event/G5dIZ_3Ii5CH1/dave-chappelle-karmageddon",
      ),
      true,
    );
    assert.equal(
      chappelle.some((show) => show.date === "2026-09-10"),
      false,
    );
    const gervaisTimes = ["rg-2026-10-12-manchester", "rg-2026-10-13-manchester", "rg-2026-11-16-brighton", "rg-2026-11-17-brighton"];
    for (const id of gervaisTimes) {
      assert.equal(
        comedianShows.shows.find((show) => show.id === id)?.time,
        "19:30",
      );
    }
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
    assert.equal(chappelle.filter((show) => show.source === "listed").length, 12);
    assert.equal(
      chappelle.some(
        (show) =>
          show.date === "2026-11-04" && show.venue === "State Farm Arena",
      ),
      true,
    );
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
    assert.equal(chrisDeliaShows.shows.length, 87);
    assert.equal(new Set(dates).size, 87);
    const uncasville = chrisDeliaShows.shows.filter((show) => show.city === "Uncasville");
    assert.deepEqual(
      uncasville.map((show) => `${show.date} ${show.time}`),
      ["2027-04-29 20:00", "2027-04-30 20:00", "2027-05-01 18:00"],
    );
    assert.equal(
      uncasville.every(
        (show) =>
          show.venue === "Comix Roadhouse" &&
          show.ticketUrl === "https://www.comixroadhouse.com/comics/chris-d-elia-050127",
      ),
      true,
    );
    const stockholm = chrisDeliaShows.shows.filter((show) => show.city === "Stockholm");
    assert.deepEqual(
      stockholm.map((show) => show.date),
      ["2026-10-26", "2026-10-27"],
    );
    assert.equal(
      stockholm.every((show) => show.venue === "Sodra Teatern"),
      true,
    );
    assert.equal(
      stockholm.find((show) => show.date === "2026-10-27")?.ticketUrl,
      "https://secure.tickster.com/en/l0bc1wwkv6t5bd0/selectevent",
    );
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

describe("2026-10-05 city pins", () => {
  it("resolves every new night to an existing city pin", () => {
    assert.equal(findCity("Stamford")?.lat, 41.0534);
    assert.equal(findCity("Stamford")?.lng, -73.5387);
    assert.equal(findCity("stamford, ct")?.city, "Stamford");
    assert.equal(findCity("Uncasville")?.lat, 41.4343);
    assert.equal(findCity("Uncasville")?.lng, -72.1101);
    assert.equal(findCity("uncasville, ct")?.city, "Uncasville");
    assert.equal(findCity("mohegan sun")?.city, "Uncasville");

    const added = [
      ...jeffArcuriShows.shows.filter((show) =>
        [
          "2026-10-15",
          "2026-10-16",
          "2026-10-17",
          "2026-11-12",
          "2026-11-13",
          "2026-11-14",
          "2026-12-17",
          "2026-12-18",
          "2026-12-19",
          "2027-01-27",
          "2027-01-28",
          "2027-01-31",
          "2027-02-03",
          "2027-02-04",
          "2027-02-23",
          "2027-02-24",
          "2027-03-04",
          "2027-03-11",
          "2027-03-13",
          "2027-03-17",
          "2027-03-18",
          "2027-03-19",
          "2027-03-20",
          "2027-04-09",
          "2027-04-10",
          "2027-04-11",
          "2027-04-21",
          "2027-04-22",
          "2027-04-23",
          "2027-04-25",
          "2027-05-15",
          "2027-06-06",
        ].includes(show.date),
      ),
      ...chrisDeliaShows.shows.filter((show) => show.city === "Uncasville"),
      ...comedianShows.shows.filter((show) => show.id === "dc-2026-10-27-austin"),
    ];
    assert.equal(added.length, 36);
    for (const show of added) {
      const pin = findCity(show.city);
      assert.ok(pin, `${show.id} ${show.city}`);
      assert.equal(typeof pin?.lat, "number");
      assert.equal(typeof pin?.lng, "number");
    }
    assert.equal(findCity("Portland")?.lat, 45.5152);
    assert.equal(
      jeffArcuriShows.shows.find((show) => show.date === "2027-01-27")?.city,
      "Portland",
    );
  });
});


describe("2026-11-12 refresh", () => {
  it("adds 16 Gervais 2027 nights and 18 D'Elia nights, all pinned", () => {
    const gervaisUk = comedianShows.shows.filter(
      (show) => show.comedianId === "ricky-gervais" && show.country === "UK",
    );
    const gervais2027 = gervaisUk.filter((show) => show.date.startsWith("2027-"));
    assert.equal(gervais2027.length, 16);
    assert.equal(gervaisUk.length, 38);
    const newDelia = chrisDeliaShows.shows.filter((show) =>
      ["St. Louis", "Hollywood", "Timonium", "Calgary", "San Antonio", "Bloomington, MN", "Oklahoma City"].includes(show.city),
    );
    assert.equal(newDelia.length, 18);
    for (const show of [...gervais2027, ...newDelia]) {
      assert.ok(findCity(show.city), `no pin for ${show.id} (${show.city})`);
    }
    assert.equal(findCity("York, England")?.city, "York, England");
    assert.equal(findCity("New York")?.city, "New York");
    assert.equal(
      chrisDeliaShows.shows.find((show) => show.id === "cd-2026-11-28-san-diego")?.venue,
      "The Legacy Performance Institute",
    );
  });
});

describe("2026-11-13 Mo Amer", () => {
  it("adds Mo Amer to the roster with 18 listed nights, one per date, all pinned", () => {
    const roster = comedians.comedians.map((comedian) => comedian.id);
    assert.ok(roster.includes("mo-amer"));
    assert.equal(moAmerShows.shows.length, 18);
    assert.equal(new Set(moAmerShows.shows.map((show) => show.date)).size, 18);
    for (const show of moAmerShows.shows) {
      assert.equal(show.comedianId, "mo-amer");
      assert.equal(show.source, "listed");
      assert.match(show.id, /^ma-\d{4}-\d{2}-\d{2}-[a-z-]+$/);
      assert.ok(findCity(show.city), `no pin for ${show.id} (${show.city})`);
    }
    assert.equal(findCity("San Jose")?.city, "San Jose");
    assert.equal(findCity("Honolulu")?.city, "Honolulu");
    assert.equal(moAmerShows.shows[0]?.date, "2026-11-13");
    assert.equal(moAmerShows.shows.at(-1)?.date, "2027-02-13");
  });

  it("adds Mo Amer and his nights to a stored roster that lacks him", () => {
    const next = hydrateSeedShows({ comedians: [], shows: [] });
    assert.ok(next.comedians.some((comedian) => comedian.id === "mo-amer"));
    assert.equal(
      next.shows.filter((show) => show.comedianId === "mo-amer").length,
      18,
    );
  });
});

describe("2026-11-13 Aaron Chen and Jimmy O. Yang", () => {
  const cases = [
    { id: "aaron-chen", prefix: "ac", file: aaronChenShows, count: 24, first: "2026-11-26", last: "2027-04-17" },
    { id: "jimmy-o-yang", prefix: "jy", file: jimmyOYangShows, count: 40, first: "2027-01-15", last: "2027-05-30" },
  ];

  it("adds both to the roster, Aaron Chen first", () => {
    const roster = comedians.comedians.map((comedian) => comedian.id);
    assert.equal(roster.indexOf("jimmy-o-yang"), roster.indexOf("aaron-chen") + 1);
  });

  for (const c of cases) {
    it(`${c.id}: ${c.count} listed nights, one per date, all pinned`, () => {
      assert.equal(c.file.shows.length, c.count);
      assert.equal(new Set(c.file.shows.map((show) => show.date)).size, c.count);
      assert.equal(c.file.shows[0]?.date, c.first);
      assert.equal(c.file.shows.at(-1)?.date, c.last);
      for (const show of c.file.shows) {
        assert.equal(show.comedianId, c.id);
        assert.equal(show.source, "listed");
        assert.match(show.id, new RegExp(`^${c.prefix}-\\d{4}-\\d{2}-\\d{2}-[a-z-]+$`));
        assert.ok(coordsForShow(show), `no pin for ${show.id} (${show.city})`);
      }
    });

    it(`${c.id}: hydration adds the nights to a stored roster that lacks them`, () => {
      const next = hydrateSeedShows({ comedians: [], shows: [] });
      assert.ok(next.comedians.some((comedian) => comedian.id === c.id));
      assert.equal(next.shows.filter((show) => show.comedianId === c.id).length, c.count);
    });
  }

  it("pins Aaron Chen's Newcastle night in Australia, not Newcastle upon Tyne", () => {
    const newcastle = aaronChenShows.shows.find((show) => show.id === "ac-2026-11-26-newcastle");
    assert.ok(newcastle);
    assert.ok((coordsForShow(newcastle)?.lat ?? 0) < 0);
    assert.equal(findCity("Newcastle")?.city, "Newcastle upon Tyne");
  });

  it("seeds Thirroul on 27 Nov, as the venue and Live Nation list it", () => {
    assert.ok(aaronChenShows.shows.some((show) => show.id === "ac-2026-11-27-thirroul"));
    assert.equal(aaronChenShows.shows.some((show) => show.date === "2026-11-28"), false);
  });
});

describe("2026-11-16 Zarna Garg", () => {
  it("adds Zarna Garg to the roster after Jimmy O. Yang", () => {
    const roster = comedians.comedians.map((comedian) => comedian.id);
    assert.equal(roster.indexOf("zarna-garg"), roster.indexOf("jimmy-o-yang") + 1);
  });

  it("seeds 30 listed nights, one per date, all pinned", () => {
    assert.equal(zarnaGargShows.shows.length, 30);
    assert.equal(new Set(zarnaGargShows.shows.map((show) => show.date)).size, 30);
    assert.equal(zarnaGargShows.shows[0]?.date, "2026-11-21");
    assert.equal(zarnaGargShows.shows.at(-1)?.date, "2027-05-08");
    for (const show of zarnaGargShows.shows) {
      assert.equal(show.comedianId, "zarna-garg");
      assert.equal(show.source, "listed");
      assert.match(show.id, /^zg-\d{4}-\d{2}-\d{2}-[a-z-]+$/);
      assert.match(show.time ?? "", /^\d{2}:\d{2}$/);
      assert.ok(coordsForShow(show), `no pin for ${show.id} (${show.city})`);
    }
  });

  it("hydration adds her nights to a stored roster that lacks them", () => {
    const next = hydrateSeedShows({ comedians: [], shows: [] });
    assert.ok(next.comedians.some((comedian) => comedian.id === "zarna-garg"));
    assert.equal(next.shows.filter((show) => show.comedianId === "zarna-garg").length, 30);
  });

  it("pins Portland, ME in Maine and Montréal under its accented spelling", () => {
    const portland = zarnaGargShows.shows.find((show) => show.id === "zg-2027-01-23-portland");
    assert.ok(portland);
    assert.equal(coordsForShow(portland)?.lat, 43.6591);
    assert.equal(findCity("Montréal")?.city, "Montreal");
  });
});

describe("2026-11-16 map pins with a region", () => {
  it("pins England, Birmingham AL and Portland ME nights in the right place", () => {
    const at = (id: string) => {
      const show = SEED_SHOWS.find((s) => s.id === id);
      assert.ok(show, id);
      return coordsForShow(show);
    };
    assert.deepEqual(at("rg-2026-12-03-sheffield"), { lat: 53.3811, lng: -1.4701 });
    assert.deepEqual(at("cd-2026-10-20-manchester"), { lat: 53.4808, lng: -2.2426 });
    assert.deepEqual(at("ja-2027-05-14-portland-me"), { lat: 43.6591, lng: -70.2568 });
    assert.deepEqual(at("cd-2026-09-24-birmingham-al"), { lat: 33.5186, lng: -86.8104 });
    assert.equal(at("ac-2026-11-26-newcastle")?.lat, findCity("Newcastle, NSW")?.lat);
  });

  it("never pins a seed night in Los Angeles unless it is a Los Angeles night", () => {
    const la = findCity("Los Angeles");
    for (const show of SEED_SHOWS) {
      const pin = coordsForShow(show);
      if (pin?.lat === la?.lat && pin?.lng === la?.lng) {
        assert.equal(findCity(show.city)?.city, "Los Angeles", `${show.id} (${show.city}, ${show.region}) pinned in LA`);
      }
    }
  });

  it("matches short aliases only as whole words", () => {
    assert.equal(findCity("Sheffield, England")?.city, "Sheffield");
    assert.equal(findCity("Oxford, England")?.city, "Oxford");
    assert.equal(findCity("Washington DC area")?.city, "Washington");
  });
});

describe("2026-11-17 weekly refresh", () => {
  const gervais = comedianShows.shows.filter((show) => show.comedianId === "ricky-gervais");
  const at = (id: string) => {
    const show = SEED_SHOWS.find((s) => s.id === id);
    assert.ok(show, id);
    return show;
  };

  it("adds 3 European Gervais nights", () => {
    const europe = ["rg-2027-04-30-paris", "rg-2027-07-02-amsterdam", "rg-2027-08-28-stockholm"].map(at);
    assert.deepEqual(
      europe.map((show) => [show.id, show.venue, show.date]),
      [
        ["rg-2027-04-30-paris", "Accor Arena", "2027-04-30"],
        ["rg-2027-07-02-amsterdam", "AFAS Live", "2027-07-02"],
        ["rg-2027-08-28-stockholm", "Avicii Arena", "2027-08-28"],
      ],
    );
    for (const show of europe) {
      assert.equal(show.source, "listed");
      assert.ok(show.ticketUrl?.startsWith("https://"), show.id);
    }
  });

  it("keeps Gervais rows in date order", () => {
    const dates = gervais.map((show) => show.date);
    assert.deepEqual(dates, [...dates].sort());
  });

  it("pins the new nights to the right cities", () => {
    assert.deepEqual(coordsForShow(at("rg-2027-04-30-paris")), { lat: 48.8566, lng: 2.3522 });
    assert.deepEqual(coordsForShow(at("rg-2027-07-02-amsterdam")), { lat: 52.3676, lng: 4.9041 });
    assert.deepEqual(coordsForShow(at("rg-2027-08-28-stockholm")), { lat: 59.3293, lng: 18.0686 });
    assert.equal(findCity("Amsterdam, Netherlands")?.city, "Amsterdam");
  });

  it("points Aaron Chen's Brisbane nights at the QPAC encore page", () => {
    for (const id of ["ac-2026-12-10-brisbane", "ac-2026-12-11-brisbane"]) {
      assert.equal(
        aaronChenShows.shows.find((show) => show.id === id)?.ticketUrl,
        "https://www.qpac.com.au/whats-on/2026/aaron-chen-encore/",
      );
    }
  });

  it("ships the new nights in the bundled seed", () => {
    for (const id of ["rg-2027-04-30-paris", "rg-2027-07-02-amsterdam", "rg-2027-08-28-stockholm"]) {
      assert.equal(at(id).comedianId, "ricky-gervais");
    }
  });
});

describe("2026-11-17 Bobby Lee, Andrew Santino and Theo Von", () => {
  it("adds all three to the end of the roster in that order", () => {
    const roster = comedians.comedians.map((comedian) => comedian.id);
    assert.deepEqual(roster.slice(-3), ["bobby-lee", "andrew-santino", "theo-von"]);
  });

  it("seeds 15 listed Santino nights, one per date, all pinned", () => {
    assert.equal(andrewSantinoShows.shows.length, 15);
    assert.equal(new Set(andrewSantinoShows.shows.map((show) => show.date)).size, 15);
    assert.equal(andrewSantinoShows.shows[0]?.date, "2027-02-05");
    assert.equal(andrewSantinoShows.shows.at(-1)?.date, "2027-03-27");
    const dates = andrewSantinoShows.shows.map((show) => show.date);
    assert.deepEqual(dates, [...dates].sort());
    for (const show of andrewSantinoShows.shows) {
      assert.equal(show.comedianId, "andrew-santino");
      assert.equal(show.source, "listed");
      assert.match(show.id, /^sa-\d{4}-\d{2}-\d{2}-[a-z-]+$/);
      assert.ok(show.ticketUrl?.startsWith("https://"), show.id);
      assert.ok(coordsForShow(show), `no pin for ${show.id} (${show.city})`);
    }
  });

  it("leaves time off only where no venue printed one", () => {
    const untimed = andrewSantinoShows.shows
      .filter((show) => !(show as { time?: string }).time)
      .map((show) => show.id);
    // Madison 5-6 Mar got its 19:00 early show on 2026-11-23 (venue's etix page).
    assert.deepEqual(untimed, []);
  });

  it("pins Milwaukee and West Palm Beach", () => {
    assert.equal(findCity("Milwaukee, WI")?.city, "Milwaukee");
    assert.equal(findCity("Palm Beach")?.city, "West Palm Beach");
  });

  it("hydration adds all three, with no invented nights for Bobby Lee or Theo Von", () => {
    const next = hydrateSeedShows({ comedians: [], shows: [] });
    for (const id of ["bobby-lee", "andrew-santino", "theo-von"]) {
      assert.ok(next.comedians.some((comedian) => comedian.id === id), id);
    }
    assert.equal(next.shows.filter((show) => show.comedianId === "andrew-santino").length, 15);
    assert.equal(SEED_SHOWS.some((show) => show.comedianId === "bobby-lee"), false);
    assert.equal(SEED_SHOWS.some((show) => show.comedianId === "theo-von"), false);
  });
});

describe("2026-11-19 weekly refresh", () => {
  const at = (id: string) => {
    const show = SEED_SHOWS.find((s) => s.id === id);
    assert.ok(show, id);
    return show;
  };
  const timeOf = (id: string) => (at(id) as { time?: string }).time ?? null;

  it("adds 10 Gervais 2027 nights, 51 in all, in date order", () => {
    const gervais = comedianShows.shows.filter((show) => show.comedianId === "ricky-gervais");
    assert.equal(gervais.length, 51);
    assert.equal(gervais.filter((show) => show.country === "UK").length, 38);
    const added = [
      ["rg-2027-01-23-antwerp", "Lotto Arena", "Belgium", "19:30"],
      ["rg-2027-02-27-badalona", "Olímpic Arena Badalona", "Spain", "19:30"],
      ["rg-2027-03-19-lisbon", "MEO Arena", "Portugal", "19:30"],
      ["rg-2027-04-09-new-york", "Radio City Music Hall", "US", "19:30"],
      ["rg-2027-04-10-new-york", "Radio City Music Hall", "US", "19:30"],
      ["rg-2027-04-12-chicago", "United Center", "US", "19:30"],
      ["rg-2027-04-24-vienna", "Wiener Stadthalle - Halle D", "Austria", "19:30"],
      ["rg-2027-06-19-zagreb", "Arena Zagreb", "Croatia", null],
      ["rg-2027-07-17-zurich", "Hallenstadion", "Switzerland", "19:30"],
      ["rg-2027-08-14-toronto", "Scotiabank Arena", "Canada", "19:30"],
    ] as const;
    for (const [id, venue, country, time] of added) {
      const show = at(id);
      assert.equal(show.comedianId, "ricky-gervais");
      assert.equal(show.venue, venue);
      assert.equal(show.country, country);
      assert.equal(timeOf(id), time);
      assert.equal(show.source, "listed");
      assert.ok(show.ticketUrl?.startsWith("https://"), id);
    }
    assert.equal(timeOf("rg-2027-07-02-amsterdam"), "19:30");
    const dates = gervais.map((show) => show.date);
    assert.deepEqual(dates, [...dates].sort());
  });

  it("pins every new night, including the six new cities", () => {
    for (const id of [
      "rg-2027-01-23-antwerp",
      "rg-2027-02-27-badalona",
      "rg-2027-03-19-lisbon",
      "rg-2027-04-09-new-york",
      "rg-2027-04-12-chicago",
      "rg-2027-04-24-vienna",
      "rg-2027-06-19-zagreb",
      "rg-2027-07-17-zurich",
      "rg-2027-08-14-toronto",
      "cd-2027-05-21-new-cumberland",
      "zg-2027-02-19-chicago",
      "zg-2027-05-06-nashville",
    ]) {
      assert.ok(coordsForShow(at(id)), `no pin for ${id}`);
    }
    assert.deepEqual(coordsForShow(at("rg-2027-07-17-zurich")), { lat: 47.3769, lng: 8.5417 });
    assert.equal(findCity("Zürich")?.city, "Zurich");
    assert.equal(findCity("Lisboa")?.city, "Lisbon");
    assert.equal(findCity("Antwerpen")?.city, "Antwerp");
    assert.equal(findCity("Wien")?.city, "Vienna");
  });

  it("adds D'Elia's New Cumberland run, with the venue's times from 2026-11-23", () => {
    const rows = chrisDeliaShows.shows.filter((show) => show.city === "New Cumberland");
    assert.deepEqual(
      rows.map((show) => [show.date, (show as { time?: string }).time ?? null]),
      [
        ["2027-05-21", "19:00"],
        ["2027-05-22", "18:00"],
        ["2027-05-23", "17:00"],
      ],
    );
    assert.ok(rows.every((show) => show.venue === "HBG Comedy Zone" && show.region === "PA"));
  });

  it("adds Zarna Garg's Chicago and Nashville nights and moves Portland to 19:00", () => {
    for (const id of ["zg-2027-02-19-chicago", "zg-2027-05-06-nashville", "zg-2027-05-07-nashville", "zg-2027-05-08-nashville"]) {
      assert.equal(timeOf(id), "19:00");
    }
    assert.equal(at("zg-2027-02-19-chicago").venue, "The Vic Theatre");
    assert.equal(timeOf("zg-2027-01-23-portland"), "19:00");
  });

  it("fills in start times from the venue pages", () => {
    assert.equal(timeOf("ma-2026-12-12-honolulu"), "18:30");
    assert.ok(at("ma-2026-12-12-honolulu").ticketUrl?.includes("/14301374"));
    assert.equal(timeOf("sa-2027-03-12-columbus"), "19:00");
    assert.equal(timeOf("sa-2027-03-13-columbus"), "18:30");
    assert.equal(timeOf("as-2026-12-04-raleigh"), "19:00");
    assert.equal(timeOf("as-2026-12-05-raleigh"), "19:00");
    assert.equal(timeOf("as-2026-12-11-columbus"), "19:00");
    assert.equal(timeOf("as-2026-12-12-columbus"), "18:30");
  });
});

describe("2026-11-23 weekly refresh", () => {
  it("adds Jimmy O. Yang's second Medford night", () => {
    const row = jimmyOYangShows.shows.find((show) => show.id === "jy-2027-04-03-medford");
    assert.equal(row?.venue, "Chevalier Theatre");
    assert.equal((row as { time?: string } | undefined)?.time, "19:00");
    assert.ok(findCity("Medford"));
  });
});
