import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cityMatches, citySuggestions, coordsForShow, placeForShow } from "./geo";
import { filterShows } from "./filters";
import { SEED_SHOWS } from "./seedData";
import type { Show } from "../types";

function show(
  id: string,
  city: string,
  extra: Partial<Show> = {},
): Show {
  return {
    id,
    comedianId: extra.comedianId ?? "mo-amer",
    title: "Tour",
    venue: "Club",
    city,
    date: "2026-12-01",
    ...extra,
  };
}

const houston = show("hou", "Houston", { region: "TX" });
const atlanta = show("atl", "Atlanta", { region: "GA" });
const portland = show("pdx", "Portland", { region: "OR" });
const portlandMe = show("pwm", "Portland", { region: "ME", comedianId: "zarna-garg" });
const la = show("la", "Los Angeles", { region: "CA" });
const la2 = show("la2", "LA", { comedianId: "jeff-arcuri" });
const bhamUk = show("bhx", "Birmingham", { region: "England", country: "UK" });
const bhamAl = show("bhm", "Birmingham", { region: "AL" });
const phoenix = show("phx", "Phoenix");
const mesa = show("mesa", "Mesa", { region: "AZ" });
const dc = show("dc", "Washington", { region: "DC" });
const nowhere = show("zz", "Smallville", { region: "KS" });
const all = [houston, atlanta, portland, portlandMe, la, la2, bhamUk, bhamAl, phoenix, mesa, dc, nowhere];

const ids = (shows: Show[]) => shows.map((s) => s.id).sort();

describe("placeForShow", () => {
  it("is what the map pins a show to", () => {
    for (const s of all) {
      const place = placeForShow(s);
      const pin = coordsForShow(s);
      assert.deepEqual(pin, place ? { lat: place.lat, lng: place.lng } : null, s.id);
    }
    assert.equal(placeForShow(portlandMe)?.city, "Portland, ME");
    assert.equal(placeForShow(bhamAl)?.city, "Birmingham, AL");
    assert.equal(placeForShow(la2)?.city, "Los Angeles");
  });
});

describe("cityMatches", () => {
  const match = (query: string) => ids(filterShows(all, { city: query }));

  it("keeps only the place the map uses when the text names it", () => {
    assert.deepEqual(match("LA"), ["la", "la2"]);
    assert.deepEqual(match("Los Angeles"), ["la", "la2"]);
    assert.deepEqual(match("Birmingham, AL"), ["bhm"]);
    assert.deepEqual(match("birmingham"), ["bhx"]);
    assert.deepEqual(match("Portland, ME"), ["pwm"]);
    assert.deepEqual(match("Portland"), ["pdx"]);
  });

  it("follows the map's aliases, with a place's own name first", () => {
    assert.deepEqual(match("DC"), ["dc"]);
    assert.deepEqual(match("washington dc"), ["dc"]);
    // Mesa lists "phoenix" as an alias, but Phoenix is a place of its own.
    assert.deepEqual(match("Phoenix"), ["phx"]);
    assert.deepEqual(match("Mesa"), ["mesa"]);
    assert.equal(placeForShow(phoenix)?.city, "Phoenix");
  });

  it("reads partial text as the start of a word, not anywhere inside one", () => {
    assert.deepEqual(match("hou"), ["hou"]);
    assert.deepEqual(match("port"), ["pdx", "pwm"]);
    assert.deepEqual(match("ang"), ["la", "la2"]);
    // "la" is an exact alias for Los Angeles, and is not found inside
    // Atlanta, Portland or Birmingham, England.
    assert.ok(!match("la").includes("atl"));
    assert.ok(!match("la").includes("pdx"));
    assert.deepEqual(match("ston"), []);
  });

  it("still matches shows with no city row by their own text", () => {
    assert.deepEqual(match("small"), ["zz"]);
    assert.deepEqual(match("Smallville"), ["zz"]);
    assert.deepEqual(match("Smallville, KS"), ["zz"]);
  });

  it("matches everything for blank text", () => {
    assert.equal(cityMatches(houston, "  "), true);
  });
});

describe("citySuggestions", () => {
  it("groups nights by map place and lists the busiest first when empty", () => {
    const list = citySuggestions(all, "");
    const losAngeles = list.find((s) => s.label === "Los Angeles");
    assert.equal(losAngeles?.nights, 2);
    assert.deepEqual(losAngeles?.comedianIds.sort(), ["jeff-arcuri", "mo-amer"]);
    assert.equal(list[0].label, "Los Angeles");
    assert.ok(list.length <= 8);
  });

  it("tells same-named places apart", () => {
    const labels = citySuggestions(all, "birm").map((s) => s.label);
    assert.deepEqual(labels.sort(), ["Birmingham", "Birmingham, AL"]);
    const uk = citySuggestions(all, "birm").find((s) => s.label === "Birmingham");
    assert.equal(uk?.detail, "England");
    const al = citySuggestions(all, "birm").find((s) => s.label === "Birmingham, AL");
    assert.equal(al?.detail, undefined);
  });

  it("ranks an exact name, then a name prefix, then an alias", () => {
    assert.equal(citySuggestions(all, "la")[0].label, "Los Angeles");
    assert.equal(citySuggestions(all, "Portland")[0].label, "Portland");
    assert.deepEqual(
      citySuggestions(all, "port").map((s) => s.label),
      ["Portland", "Portland, ME"],
    );
    assert.deepEqual(citySuggestions(all, "phoe").map((s) => s.label), ["Phoenix", "Mesa"]);
    assert.deepEqual(citySuggestions(all, "dc").map((s) => s.label), ["Washington"]);
  });

  it("never suggests a place inside another word", () => {
    assert.deepEqual(citySuggestions(all, "ston"), []);
    assert.ok(!citySuggestions(all, "la").some((s) => s.label === "Atlanta"));
  });

  it("picking a suggestion filters to exactly the nights it counted", () => {
    const seed = SEED_SHOWS;
    for (const s of citySuggestions(seed, "", 500)) {
      const hits = filterShows(seed, { city: s.label });
      assert.equal(hits.length, s.nights, s.label);
    }
  });

  it("every seed show is offered under the place the map pins it to", () => {
    const seed = SEED_SHOWS;
    const labels = new Set(citySuggestions(seed, "", 500).map((s) => s.label));
    for (const s of seed) {
      const place = placeForShow(s);
      if (place) assert.ok(labels.has(place.city), `${s.id} (${s.city})`);
    }
  });
});
