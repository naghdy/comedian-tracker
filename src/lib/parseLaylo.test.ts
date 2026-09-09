import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nightsFromLayloTitle, parseLayloDrop } from "./parseLaylo";

describe("nightsFromLayloTitle", () => {
  it("expands a two-night club stop", () => {
    const parsed = nightsFromLayloTitle(
      "Stress Factory - Sept 11-12, 2026 - SOLD OUT",
    );
    assert.deepEqual(parsed, {
      venue: "Stress Factory",
      dates: ["2026-09-11", "2026-09-12"],
    });
  });
});

describe("parseLayloDrop", () => {
  it("returns one row per calendar day and swaps inverted lat/lng", () => {
    const nights = parseLayloDrop({
      orderedSubProducts: [
        {
          title: "Stress Factory - Sept 11-12, 2026 - SOLD OUT",
          link: "https://newbrunswick.stressfactory.com/events/142216?token=abc",
          location: {
            name: "New Brunswick",
            latitude: -74.4518188,
            longitude: 40.4862157,
            state: { name: "New Jersey" },
            country: { name: "United States" },
          },
        },
        {
          title: "Funny Bone - Dec 11-12, 2026",
          link: "https://www.etix.com/ticket/e/1060481/andrew-schulz-columbus-funny-bone-comedy-club-columbus",
          location: {
            name: "Columbus",
            latitude: -82.99879419999999,
            longitude: 39.9611755,
            state: { name: "Ohio" },
            country: { name: "United States" },
          },
        },
      ],
    });
    assert.equal(nights.length, 4);
    assert.equal(nights[0]?.city, "New Brunswick");
    assert.equal(nights[0]?.lat, 40.4862157);
    assert.equal(nights[0]?.lng, -74.4518188);
    assert.equal(nights[0]?.ticketUrl, "https://newbrunswick.stressfactory.com/events/142216");
    assert.equal(nights.at(-1)?.city, "Columbus");
    assert.equal(nights.at(-1)?.date, "2026-12-12");
  });

  it("expands the official 8-stop homepage drop to 16 calendar nights", () => {
    const nights = parseLayloDrop({
      orderedSubProducts: [
        { title: "Stress Factory - Sept 11-12, 2026 - SOLD OUT", location: { name: "New Brunswick", state: { name: "New Jersey" }, country: { name: "United States" } }, link: "https://newbrunswick.stressfactory.com/events/142216" },
        { title: "Houston Improv - Sept 18-19, 2026 - SOLD OUT", location: { name: "Houston", state: { name: "Texas" }, country: { name: "United States" } }, link: "https://improvtx.com/houston/comic/andrew+schulz/" },
        { title: "Levity Live - Sept 25-26, 2026 - SOLD OUT", location: { name: "West Nyack", state: { name: "New York" }, country: { name: "United States" } }, link: "https://levitylive.com/nyack/comic/andrew+schulz/" },
        { title: "Helium Comedy Club - Oct 23-24, 2026", location: { name: "Indianapolis", state: { name: "Indiana" }, country: { name: "United States" } }, link: "https://indianapolis.heliumcomedy.com/events/142211" },
        { title: "Stardome Comedy Club - Nov 6-7, 2026", location: { name: "Birmingham", state: { name: "Alabama" }, country: { name: "United States" } }, link: "https://www.stardome.com/events/142204" },
        { title: "Hilarities - Nov 13-14, 2026", location: { name: "Cleveland", state: { name: "Ohio" }, country: { name: "United States" } }, link: "https://hilarities.com/events/142270" },
        { title: "Goodnights Comedy Club - Dec 4-5, 2026", location: { name: "Raleigh", state: { name: "North Carolina" }, country: { name: "United States" } }, link: "https://www.goodnightscomedy.com/events/142206" },
        { title: "Funny Bone - Dec 11-12, 2026", location: { name: "Columbus", state: { name: "Ohio" }, country: { name: "United States" } }, link: "https://www.etix.com/ticket/e/1060481/andrew-schulz-columbus-funny-bone-comedy-club-columbus" },
      ],
    });
    assert.equal(nights.length, 16);
    assert.deepEqual(
      nights.map((night) => `${night.date} ${night.city}`),
      [
        "2026-09-11 New Brunswick",
        "2026-09-12 New Brunswick",
        "2026-09-18 Houston",
        "2026-09-19 Houston",
        "2026-09-25 West Nyack",
        "2026-09-26 West Nyack",
        "2026-10-23 Indianapolis",
        "2026-10-24 Indianapolis",
        "2026-11-06 Birmingham, AL",
        "2026-11-07 Birmingham, AL",
        "2026-11-13 Cleveland",
        "2026-11-14 Cleveland",
        "2026-12-04 Raleigh",
        "2026-12-05 Raleigh",
        "2026-12-11 Columbus",
        "2026-12-12 Columbus",
      ],
    );
  });
});
