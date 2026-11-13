import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterShows, todayISO, tripMatches, upcomingShows } from "./filters";
import type { Show } from "../types";

function show(id: string, date: string, city = "Denver"): Show {
  return { id, comedianId: "mo-amer", title: "Mo Amer", venue: "Club", city, date };
}

describe("upcomingShows", () => {
  const shows = [
    show("sep", "2026-09-11"),
    show("yesterday", "2026-11-12"),
    show("today", "2026-11-13"),
    show("later", "2027-02-13"),
  ];

  it("keeps shows on or after today and hides earlier ones", () => {
    const ids = upcomingShows(shows, "2026-11-13").map((s) => s.id);
    assert.deepEqual(ids, ["today", "later"]);
  });

  it("does not change the stored list", () => {
    upcomingShows(shows, "2026-11-13");
    assert.equal(shows.length, 4);
  });

  it("feeds the trip checker only upcoming nights", () => {
    const hits = tripMatches(upcomingShows(shows, "2026-11-13"), {
      city: "Denver",
      start: "2026-09-01",
      end: "2026-12-31",
    });
    assert.deepEqual(hits.map((s) => s.id), ["today"]);
    assert.equal(filterShows(shows, { city: "Denver" }).length, 4);
  });
});

describe("todayISO", () => {
  it("uses the local calendar day", () => {
    assert.equal(todayISO(new Date(2026, 10, 13, 23, 30)), "2026-11-13");
    assert.equal(todayISO(new Date(2027, 0, 5, 0, 5)), "2027-01-05");
  });
});
