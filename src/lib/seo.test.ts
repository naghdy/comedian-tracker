import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Comedian, Show } from "../types";
import {
  comedianPageHtml,
  eventJsonLd,
  homeHeadAndNoscript,
  jsonLdScript,
  notFoundHtml,
  sitemapXml,
  upcomingFor,
  yearsLabel,
} from "./seo";

const ricky: Comedian = { id: "ricky-gervais", name: "Ricky Gervais", color: "#e2b93b", tourUrl: "https://example.com/tour" };
const theo: Comedian = { id: "theo-von", name: "Theo Von", color: "#888" };

function show(partial: Partial<Show> & Pick<Show, "id" | "date">): Show {
  return {
    comedianId: "ricky-gervais",
    title: "Ricky Gervais: Legend",
    venue: "Utilita Arena",
    city: "Sheffield",
    region: "England",
    country: "UK",
    ...partial,
  };
}

const shows: Show[] = [
  show({ id: "past", date: "2026-11-01" }),
  show({ id: "a", date: "2026-12-03", time: "19:30", ticketUrl: "https://tickets.example/a" }),
  show({ id: "b", date: "2027-01-05", city: "Guildford" }),
  show({ id: "s", date: "2027-02-01", sample: true }),
];
const opts = { today: "2026-11-26" };

describe("upcomingFor", () => {
  it("keeps upcoming, non-sample nights for that comedian, in order", () => {
    assert.deepEqual(
      upcomingFor(shows, "ricky-gervais", opts.today).map((s) => s.id),
      ["a", "b"],
    );
    assert.deepEqual(upcomingFor(shows, "theo-von", opts.today), []);
  });
});

describe("yearsLabel", () => {
  it("spans the first and last year", () => {
    assert.equal(yearsLabel(upcomingFor(shows, "ricky-gervais", opts.today)), "2026–2027");
    assert.equal(yearsLabel([shows[2]]), "2027");
    assert.equal(yearsLabel([]), "");
  });
});

describe("eventJsonLd", () => {
  it("builds a ComedyEvent from the seed fields", () => {
    const event = eventJsonLd(ricky, shows[1]) as Record<string, any>;
    assert.equal(event["@type"], "ComedyEvent");
    assert.equal(event.name, "Ricky Gervais: Legend");
    assert.equal(event.startDate, "2026-12-03T19:30");
    assert.equal(event.location.name, "Utilita Arena");
    assert.equal(event.location.address.addressCountry, "GB");
    assert.equal(event.offers.url, "https://tickets.example/a");
  });

  it("uses a plain date and no offer when the seed has neither", () => {
    const event = eventJsonLd(ricky, shows[2]) as Record<string, any>;
    assert.equal(event.startDate, "2027-01-05");
    assert.equal(event.offers, undefined);
  });
});

describe("jsonLdScript", () => {
  it("cannot be closed early by data", () => {
    const html = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    assert.equal(html.match(/<\/script>/g)?.length, 1);
  });
});

describe("comedianPageHtml", () => {
  it("puts the dates, canonical and event data in the HTML", () => {
    const html = comedianPageHtml(ricky, shows, [ricky, theo], opts);
    assert.match(html, /<title>Ricky Gervais Tour Dates 2026–2027 \| Comedian Tracker<\/title>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/comediantracker.com\/comedians\/ricky-gervais\/" \/>/);
    assert.match(html, /<h1>Ricky Gervais tour dates<\/h1>/);
    assert.match(html, /Guildford/);
    assert.doesNotMatch(html, /2026-11-01/);
    assert.equal(html.match(/"ComedyEvent"/g)?.length, 2);
    assert.match(html, /href="\/\?comedian=ricky-gervais"/);
    assert.match(html, /href="\/comedians\/theo-von\/"/);
  });

  it("still makes a page when nothing is announced", () => {
    const html = comedianPageHtml(theo, shows, [ricky, theo], opts);
    assert.match(html, /<title>Theo Von Tour Dates \| Comedian Tracker<\/title>/);
    assert.match(html, /No upcoming dates/);
    assert.doesNotMatch(html, /ComedyEvent/);
  });

  it("adds analytics only for well-formed IDs", () => {
    const withTags = comedianPageHtml(ricky, shows, [ricky], { ...opts, gaId: "G-ABC123", clarityId: "abc123" });
    assert.match(withTags, /googletagmanager\.com\/gtag\/js\?id=G-ABC123/);
    assert.match(withTags, /clarity\.ms\/tag\/abc123/);
    const without = comedianPageHtml(ricky, shows, [ricky], { ...opts, gaId: "bad\"><x", clarityId: "" });
    assert.doesNotMatch(without, /googletagmanager|clarity\.ms/);
  });

  it("escapes names and venues", () => {
    const html = comedianPageHtml(ricky, [show({ id: "x", date: "2027-01-01", venue: "<b>Club</b>" })], [ricky], opts);
    assert.match(html, /&lt;b&gt;Club&lt;\/b&gt;/);
  });
});

describe("notFoundHtml", () => {
  it("is not indexed", () => {
    const html = notFoundHtml([ricky], opts);
    assert.match(html, /<meta name="robots" content="noindex" \/>/);
    assert.doesNotMatch(html, /rel="canonical"/);
  });
});

describe("sitemapXml", () => {
  it("lists the home page, the hub and each comedian", () => {
    const xml = sitemapXml([ricky, theo], "2026-11-23");
    assert.match(xml, /<loc>https:\/\/comediantracker.com\/<\/loc>/);
    assert.match(xml, /<loc>https:\/\/comediantracker.com\/comedians\/<\/loc>/);
    assert.match(xml, /<loc>https:\/\/comediantracker.com\/comedians\/theo-von\/<\/loc><lastmod>2026-11-23<\/lastmod>/);
    assert.equal(xml.match(/<url>/g)?.length, 4);
  });
});

describe("homeHeadAndNoscript", () => {
  it("names the busiest comedians and links every page", () => {
    const home = homeHeadAndNoscript([theo, ricky], shows, opts.today);
    assert.match(home.description, /^Upcoming global tour dates for the comedians you love: Ricky Gervais and more/);
    assert.match(home.jsonLd, /"WebSite"/);
    assert.match(home.noscript, /\/comedians\/ricky-gervais\//);
    assert.match(home.noscript, /\/comedians\/theo-von\//);
  });
});
