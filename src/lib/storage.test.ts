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

