import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hydrateJeffSeed } from "./storage";
import type { StoredState } from "../types";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";

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
