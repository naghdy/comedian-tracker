import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseVenueNights } from "./parseVenueHtml";

const heliumHtml = `
<h6 class="event-date">Fri, Oct 23, 2026</h6>
<a class="event-btn-inline" href="/shows/383870"> 7:00 PM</a>
<h6 class="event-date">Sat, Oct 24, 2026</h6>
<a class="event-btn-inline" href="/shows/383871"> 7:00 PM</a>
<script type="application/ld+json">{"@context":"http://schema.org","@type":"Event","name":"Special Event: Andrew Schulz","startDate":"2026-10-23T23:00:00Z","location":{"@type":"Place","name":"Helium Comedy Club","address":{"addressLocality":"Indianapolis","addressRegion":"IN"}}}</script>
`;

describe("parseVenueNights", () => {
  it("collapses Helium showtimes to one row per calendar day", () => {
    const nights = parseVenueNights(heliumHtml);
    assert.deepEqual(
      nights.map((night) => night.date),
      ["2026-10-23", "2026-10-24"],
    );
  });
});
