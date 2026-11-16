import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, dayParts, formatRange, formatTime, groupByMonth, placeLabel, tourTitle } from "./display";
import type { Show } from "../types";

describe("tourTitle", () => {
  it("drops the comedian's name from the title", () => {
    assert.equal(tourTitle("Ricky Gervais", "Ricky Gervais: Legend"), "Legend");
    assert.equal(tourTitle("Jimmy O. Yang", "Jimmy O. Yang: Has No Friends Tour"), "Has No Friends Tour");
  });

  it("returns null when the title is only the name", () => {
    assert.equal(tourTitle("Mo Amer", "Mo Amer"), null);
    assert.equal(tourTitle("Chris D'Elia", "chris d'elia"), null);
  });

  it("keeps titles that don't start with the name", () => {
    assert.equal(tourTitle("Dave Chappelle", "Fastball Comedy Festival"), "Fastball Comedy Festival");
  });
});

describe("groupByMonth", () => {
  const s = (id: string, date: string): Show => ({ id, comedianId: "x", title: "x", venue: "v", city: "c", date });

  it("groups consecutive shows by month in order", () => {
    const groups = groupByMonth([s("a", "2026-11-16"), s("b", "2026-11-30"), s("c", "2027-01-05")]);
    assert.deepEqual(groups.map((g) => [g.key, g.label, g.shows.map((x) => x.id)]), [
      ["2026-11", "November 2026", ["a", "b"]],
      ["2027-01", "January 2027", ["c"]],
    ]);
  });
});

describe("small formatters", () => {
  it("splits a date for the listing column", () => {
    assert.deepEqual(dayParts("2026-11-16"), { day: "16", weekday: "Mon", month: "Nov" });
  });

  it("formats times in 12-hour clock", () => {
    assert.equal(formatTime("19:30"), "7:30 PM");
    assert.equal(formatTime("00:05"), "12:05 AM");
    assert.equal(formatTime(undefined), null);
  });

  it("labels places without repeating the obvious country", () => {
    assert.equal(placeLabel({ city: "Denver", region: "CO", country: "US" }), "Denver, CO");
    assert.equal(placeLabel({ city: "Brighton", region: "England", country: "UK" }), "Brighton, England");
    assert.equal(placeLabel({ city: "Sydney", region: "NSW", country: "Australia" }), "Sydney, NSW, Australia");
    assert.equal(placeLabel({ city: "Stockholm", country: "Sweden" }), "Stockholm, Sweden");
  });

  it("formats trip ranges and adds days", () => {
    assert.equal(formatRange("2026-11-18", "2026-11-25"), "18–25 Nov");
    assert.equal(formatRange("2026-11-28", "2026-12-02"), "28 Nov – 2 Dec");
    assert.equal(addDays("2026-12-30", 7), "2027-01-06");
  });
});
