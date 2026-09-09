import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeShows,
  namesMatch,
  replaceLookupShows,
  showDedupeKey,
} from "./lookupShows";
import type { Show } from "../types";

describe("namesMatch", () => {
  it("matches exact and titled events", () => {
    assert.equal(namesMatch("Jeff Arcuri", "Jeff Arcuri"), true);
    assert.equal(namesMatch("Jeff Arcuri", "Jeff Arcuri: Fresh Cut"), true);
    assert.equal(namesMatch("Jeff Arcuri", "JEFF ARCURI"), true);
  });

  it("does not match a different first+last pair", () => {
    assert.equal(namesMatch("Jeff Arcuri", "Jeff Dunham"), false);
    assert.equal(namesMatch("Jeff Arcuri", "Arcuri"), false);
  });
});

describe("mergeShows", () => {
  const listed: Show = {
    id: "listed-1",
    comedianId: "jeff-arcuri",
    title: "Jeff Arcuri",
    venue: "The Magnolia",
    city: "El Cajon",
    date: "2027-01-19",
    source: "listed",
  };
  const lookupDup: Show = {
    ...listed,
    id: "lookup-1",
    source: "lookup",
    ticketUrl: "https://www.ticketmaster.com/event/1",
  };
  const lookupNew: Show = {
    id: "lookup-2",
    comedianId: "jeff-arcuri",
    title: "Jeff Arcuri",
    venue: "Beacon Theatre",
    city: "New York",
    date: "2027-06-05",
    source: "lookup",
  };

  it("skips the same night at the same venue", () => {
    assert.equal(showDedupeKey(listed), showDedupeKey(lookupDup));
    const merged = mergeShows([listed], [lookupDup, lookupNew]);
    assert.equal(merged.length, 2);
    assert.equal(merged[1].id, "lookup-2");
  });

  it("replaces previous lookup rows but keeps listed/user rows", () => {
    const user: Show = {
      id: "user-1",
      comedianId: "jeff-arcuri",
      title: "Jeff Arcuri",
      venue: "Local Club",
      city: "Austin",
      date: "2026-12-01",
      source: "user",
    };
    const staleLookup: Show = {
      id: "lookup-old",
      comedianId: "jeff-arcuri",
      title: "Jeff Arcuri",
      venue: "Old Room",
      city: "Miami",
      date: "2026-10-01",
      source: "lookup",
    };
    const next = replaceLookupShows([listed, user, staleLookup], "jeff-arcuri", [
      lookupNew,
    ]);
    assert.equal(
      next.some((show) => show.id === "lookup-old"),
      false,
    );
    assert.equal(next.some((show) => show.id === "listed-1"), true);
    assert.equal(next.some((show) => show.id === "user-1"), true);
    assert.equal(next.some((show) => show.id === "lookup-2"), true);
  });
});
