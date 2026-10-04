# Data

All committed tour data is JSON under `data/`. The app bundles comedians and shows through `src/lib/seedData.ts`. Nothing here is fetched at runtime by the UI.

Dates in the files were checked against public listings. Do not add a night that the source of truth does not list. There are no Sample placeholder rows.

## One row per calendar night

Each seed file has exactly one show per comedian per `date` (multiple club showtimes on the same night are collapsed). `source` on every committed show is `"listed"`.

Runtime dedupe (`showDedupeKey` in `src/lib/lookupShows.ts`) is stricter: comedian + date + normalized venue + normalized city. `collapseByNight` keeps the earliest `time`, or the row with a `ticketUrl` when times match.

## `source` values

From `Show.source` in `src/types.ts`:

| Value | Meaning |
| --- | --- |
| `listed` | Curated seed row from an official listing. Replaced on legacy hydration when the seed changes. |
| `user` | Added in the agenda form. Kept across hydration and refresh merges. |
| `lookup` | Produced by Ticketmaster, SeatGeek, or a Node Laylo fetch. Kept across hydration. |
| `sample` | Old placeholder flag. Unused in current JSON. Do not add these. |

`sample: true` on a show is the same idea (agenda and map still render a Sample badge). Current seed rows omit it.

## ID conventions

Seed ids are `{prefix}-{YYYY-MM-DD}-{city-token}`, for example `dc-2026-09-25-washington`.

Chris, Jeff, and `scripts/refresh-tours.ts` build the token with a slug: lowercase, non-alphanumerics collapsed to hyphens (`cd-2026-11-28-san-diego`, `ja-2026-09-24-fort-wayne`, `as-2026-11-06-birmingham-al`). `refresh-tours` would rename a Schulz id if it rebuilds the row (`westnyack` becomes `west-nyack`).

Hand-written rows in `data/shows.json` sometimes use a shorter token than that slug. Leave those ids alone:

| Id | City on the row |
| --- | --- |
| `dc-2026-11-06-nyc`, `dc-2026-11-07-nyc` | New York |
| `as-2026-09-25-westnyack` | West Nyack |
| `rg-2026-09-14-stalbans` | St Albans |
| `rg-2026-12-10-newcastle` | Newcastle upon Tyne |
| `mg-2026-11-07-sandiego` | San Diego |
| `mg-2027-01-08-slc` | Salt Lake City |

| Prefix | Comedian | File | Example |
| --- | --- | --- | --- |
| `rg` | Ricky Gervais | `data/shows.json` | `rg-2026-09-09-cambridge` |
| `dc` | Dave Chappelle | `data/shows.json` | `dc-2026-09-25-washington` |
| `as` | Andrew Schulz | `data/shows.json` | `as-2026-09-11-new-brunswick` |
| `mg` | Mark Gagnon | `data/shows.json` | `mg-2026-10-02-plano` |
| `ja` | Jeff Arcuri | `data/jeff-arcuri-shows.json` | `ja-2026-09-24-fort-wayne` |
| `cd` | Chris D'Elia | `data/chris-delia-shows.json` | `cd-2026-09-11-phoenix` |

`refresh-tours` uses `as-` and `ja-` for those two. Any other scraped comedian gets `{comedianId}-{date}-{city-slug}`.

Ids created in the browser:

- Agenda **Add show**: `{comedianId}-{date}-{city-slug}-{Date.now()}`
- Lookup: `lookup-{comedianId}-{date}-{city-slug}-{venue-slug}`

## Show files

`data/shows.json`, `data/jeff-arcuri-shows.json`, and `data/chris-delia-shows.json` share one envelope:

```json
{
  "generatedAt": "YYYY-MM-DD",
  "sourceNotes": "string",
  "shows": []
}
```

Each show matches `Show` in `src/types.ts`:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | See prefixes above. |
| `comedianId` | yes | Must match `data/comedians.json`. |
| `title` | yes | Tour or event name. |
| `venue` | yes | |
| `city` | yes | Must match a `cities.json` name (or alias) to get a pin, unless `lat`/`lng` are set. |
| `date` | yes | `YYYY-MM-DD`. |
| `region` | no | State or nation region (`DC`, `England`, …). |
| `country` | no | `US`, `UK`, `France`, … |
| `time` | no | `HH:MM` 24-hour local. Omitted when the source has no single time. |
| `ticketUrl` | no | Per-night buy link when the source has one. |
| `notes` | no | Short listing note (used on some Chappelle rows). |
| `source` | no | `"listed"` on every current seed row. |
| `lat`, `lng` | no | Not set on current seed rows. Lookup may set them. |
| `sample` | no | Omit. |

Current counts (all `source: "listed"`, one night per date):

| File | `generatedAt` | Rows |
| --- | --- | --- |
| `data/shows.json` | 2026-09-28 | 60 = Gervais 22 + Chappelle 11 + Schulz 16 + Gagnon 11 |
| `data/jeff-arcuri-shows.json` | 2026-09-09 | 50 |
| `data/chris-delia-shows.json` | 2026-09-28 | 63 |

`src/lib/seedData.ts` concatenates those three `shows` arrays into `SEED_SHOWS`. A new file is invisible until it is imported there.

## `data/comedians.json`

```json
{
  "comedians": [
    {
      "id": "dave-chappelle",
      "name": "Dave Chappelle",
      "aliases": ["optional"],
      "color": "#2f9e5a",
      "tourUrl": "https://…",
      "notes": "optional"
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | kebab-case, stable. Show `comedianId` points here. |
| `name` | yes | Display name. Apostrophes stay (`Chris D'Elia`). |
| `color` | yes | CSS color for the chip, card bar, and map pin. |
| `aliases` | no | Alternate spellings for name match (Schulz/Schultz, D'Elia/Delia). |
| `tourUrl` | no | Canonical listing page. Shown in data only; the roster has no tour-link control. |
| `notes` | no | Curator note. Not shown as a field in the roster UI. |

Roster order in the file is the sidebar order.

## `data/cities.json`

Array of 107 cities. No envelope.

```json
{ "city": "Washington", "lat": 38.9072, "lng": -77.0369, "aliases": ["washington, dc", "dc"] }
```

| Field | Required | Notes |
| --- | --- | --- |
| `city` | yes | Display name and primary match key. Disambiguate in the name when needed (`Birmingham` vs `Birmingham, AL`, `Portland, ME`, `Wellington, FL`). |
| `lat`, `lng` | yes | Decimal degrees. |
| `aliases` | no | Extra match strings. Periods are ignored. |

Matching is exact (city or alias), then substring in either direction (`findCity`). Trip search uses the same table (`cityMatches`).

## `data/laylo-drops.json`

Array. One row today, Andrew Schulz:

| Field | Notes |
| --- | --- |
| `comedianId` | Roster id. |
| `name` | Display name passed to the parser as the show title by `refresh-tours`. |
| `dropId` | Laylo drop UUID. |
| `url` | CloudFront JSON. Schulz: `https://d21i0hc4hl3bvt.cloudfront.net/drops/1e3551fe-33d5-4a86-8364-3edb80ccdd62.json` |

`parseLayloDrop` reads `orderedSubProducts[].title` (`Venue - Sept 11-12, 2026 - …`), expands the day range, and reads `location` for city, region, country, link, and coordinates (swapping inverted US lat/lng).

## `data/venue-pages.json`

Club pages scraped by `npm run refresh-tours` (not by the browser). Each entry:

| Field | Notes |
| --- | --- |
| `comedianId` | `andrew-schulz` or `jeff-arcuri` in the current file. |
| `url` | Helium, Improv, Levity, Stardome, Hilarities, Goodnights, Summit City, or Fort Lauderdale Improv event/comic URL. |
| `title` | Show title written onto scraped rows. |
| `venue`, `city`, `region`, `country` | Fallback when the HTML parse has no venue/city/region. `ticketUrl` on the scraped row is this page URL. |

Schulz’s source of truth is the Laylo drop, which replaces his `shows.json` rows. These venue URLs are extra club pages. Jeff venue hits are merged into `jeff-arcuri-shows.json` and do not delete hand-verified nights.

## Source of truth by comedian

Prefer the official page. Ticketmaster or Live Nation alone is not enough when the official calendar is a club embed or a personal site.

| Comedian | Source of truth | What is seeded |
| --- | --- | --- |
| Ricky Gervais | [Live Nation UK Legend tour](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051) | 22 nights, 9 Sep–10 Dec 2026. `tourUrl` is that page. Verified 2026-09-09. |
| Dave Chappelle | [Live Nation artist page](https://www.livenation.com/artist/K8vZ9171rcf/dave-chappelle-events), plus festival and benefit pages | 11 nights, one per calendar night. Duke Ellington School benefit, DAR Constitution Hall, Washington 25 Sep 2026. [Fastball Comedy Festival](https://www.fastballcomedy.com/home), Sloan Park, Mesa 18 Oct 2026. Karmageddon arenas including Atlanta State Farm Arena 4 Nov 2026 and NY Comedy Festival MSG 6–7 Nov 2026. Past MSG 10 Sep benefit removed. |
| Andrew Schulz | Official Laylo embed on [theandrewschulz.com](https://www.theandrewschulz.com/). Drop JSON: [CloudFront `1e3551fe-33d5-4a86-8364-3edb80ccdd62`](https://d21i0hc4hl3bvt.cloudfront.net/drops/1e3551fe-33d5-4a86-8364-3edb80ccdd62.json) | 16 club nights. Ticketmaster and Live Nation are incomplete (they only surface Houston and West Nyack). Never use them alone. Alias Schultz is the same person. |
| Mark Gagnon | [markgagnonlive.com](https://markgagnonlive.com/) | 11 nights through 9 Jan 2027. Verified 2026-09-09. |
| Jeff Arcuri | [jeffarcuri.com/shows](https://www.jeffarcuri.com/shows), plus [Live Nation](https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events), [Ticketmaster artist 2569710](https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710), and venue pages (Summit City, Brea Improv, Orlando Funny Bone, Fort Lauderdale Improv, Huntsville Levity Live) | 50 nights: 18 club nights in 2026 and 32 confirmed 2027 Road Trip nights. One row per calendar day. Unverified Oxnard Oct 2026 and Mississauga Sep 2026 are omitted. No 2026-01 dates. `tourUrl` is the Live Nation artist page. Regenerator: `scripts/write-jeff-arcuri-seed.ts`. |
| Chris D'Elia | [chrisdelia.com](https://www.chrisdelia.com/) | 63 nights, 11 Sep 2026–15 May 2027, one per calendar night. Each row’s `ticketUrl` is that night’s Buy Tickets link, not the hub. Stockholm Sodra Teatern 26–27 Oct (27 Oct added 2026-09-28). Hamburg 25 Oct time corroborated by [Elbphilharmonie / Laeiszhalle](https://www.elbphilharmonie.de/en/whats-on/chris-delia/29092). San Antonio Live Nation-only dates omitted. `tourUrl` is the hub. Seed file is generated by `scripts/write-chris-delia-seed.ts`. |
