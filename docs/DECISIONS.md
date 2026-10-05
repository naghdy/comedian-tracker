# Decisions

Dated log of product decisions. Dates are the merge dates on `main`. PR numbers are the GitHub pulls in [naghdy/comedian-tracker](https://github.com/naghdy/comedian-tracker).

## 2026-09-09 — v1 dashboard ([#1](https://github.com/naghdy/comedian-tracker/pull/1))

Shipped a personal tracker: roster with color chips, trip checker, chronological agenda, and a Leaflet map on OpenStreetMap / Carto dark tiles. Starter roster was Ricky Gervais, Dave Chappelle, Andrew Schulz (alias Schultz), and Mark Gagnon. Seed dates came from public listings that day, with gaps filled by rows marked Sample. No auth. State lived in `localStorage`. The roster could add and remove comedians.

Rationale: one static page Nabil can open for “who is in this city while I am there,” without an account or a server.

## 2026-09-09 — GitHub Pages ([#2](https://github.com/naghdy/comedian-tracker/pull/2))

Deploy on every push to `main` via `.github/workflows/pages.yml` (`upload-pages-artifact` + `deploy-pages`). Vite `base` is `/comedian-tracker/`. `public/.nojekyll` is there so Pages does not run Jekyll.

Rationale: the app should be usable at a URL with no local install. The Pages project URL is [https://naghdy.github.io/comedian-tracker/](https://naghdy.github.io/comedian-tracker/). The README’s live link, set the same day in [#3](https://github.com/naghdy/comedian-tracker/pull/3), is [https://naghdy.com/comedian-tracker/](https://naghdy.com/comedian-tracker/).

## 2026-09-09 — Google Maps instead of Leaflet ([#3](https://github.com/naghdy/comedian-tracker/pull/3))

Replaced Leaflet / OpenStreetMap with `@react-google-maps/api`. The Maps key is the Actions secret `VITE_GOOGLE_MAPS_API_KEY`, baked in at build time. Missing key: the map panel explains setup; the rest of the app still runs. Pins still use `data/cities.json` (no Geocoding API).

Rationale: a single familiar basemap, with a dark style that matches the dashboard and a light style that follows the theme toggle.

## 2026-09-09 — Dark default, light toggle ([#3](https://github.com/naghdy/comedian-tracker/pull/3))

v1 was already a dark UI with a dark map. PR #3 added a Light/Dark control for the whole dashboard, stored in `comedian-tracker:theme`. Unset or unknown values resolve to dark, including the inline script in `index.html` that runs before paint.

Rationale: Nabil uses the dark dashboard; light is available when he wants it, and the choice survives reloads without a seed reset.

## 2026-09-09 — Real listings only ([#3](https://github.com/naghdy/comedian-tracker/pull/3))

Removed Sample placeholder shows. The seed became the verified 2026-09-09 list only: Gervais 22 (Live Nation UK Legend), Chappelle 2 (then Ticketmaster: MSG 10 Sep benefit and Fastball Mesa 18 Oct), Schulz 4 (Houston and West Nyack), Gagnon 11 (markgagnonlive.com). Storage key moved to `comedian-tracker:v4`.

Rationale: a guessed night is worse than a short list. Later PRs only add nights a source of truth names.

## 2026-09-09 — Map above, trip checker below ([#4](https://github.com/naghdy/comedian-tracker/pull/4))

Main column order became Map, Agenda, Trip checker. The roster stayed on the left.

Rationale: the map is the first thing to scan; the trip checker is a query, not the landing view.

## 2026-09-09 — Auto-lookup and Jeff Arcuri ([#5](https://github.com/naghdy/comedian-tracker/pull/5))

Adding a comedian looked up upcoming shows (seed calendar, Ticketmaster Discovery, SeatGeek) and merged them onto the roster. Jeff Arcuri joined the seed: 50 verified nights from jeffarcuri.com/shows, Live Nation, Ticketmaster, and venue pages. Unverified Oxnard and Mississauga dates were left out.

Rationale: theater dates Ticketmaster has should fill in when someone is added, and Jeff’s confirmed club and Road Trip nights belonged on the roster. The lookup helpers remain in `src/lib/lookupShows.ts`. The add/refresh buttons that called them were removed in #9; the UI no longer fetches live dates.

## 2026-09-09 — Andrew Schulz from Laylo ([#6](https://github.com/naghdy/comedian-tracker/pull/6))

Replaced Schulz’s four Live Nation / Ticketmaster nights with all 16 nights from the official Laylo embed on theandrewschulz.com (CloudFront drop `1e3551fe-33d5-4a86-8364-3edb80ccdd62`). The browser does not fetch that JSON (no CORS). `npm run refresh-tours` parses it in Node. Ticketmaster still only lists Houston and West Nyack.

Rationale: the artist’s own calendar is the source of truth. Using Ticketmaster alone drops most of the tour.

## 2026-09-09 — Tighter roster rows ([#7](https://github.com/naghdy/comedian-tracker/pull/7))

Narrow-sidebar layout: name on its own line, icon actions no longer colliding with the show count.

Rationale: the 280px sidebar was clipping names. #9 then removed those icon actions; the count-on-the-right layout stayed.

## 2026-09-10 — Favicon and Open Graph image ([#8](https://github.com/naghdy/comedian-tracker/pull/8))

Added `public/favicon.ico`, `favicon.svg`, `favicon-32.png`, `icon-512.png`, `apple-touch-icon.png`, and `og-image.png` (1200×630). `index.html` points `og:image` and `twitter:image` at `https://naghdy.com/comedian-tracker/og-image.png`.

Rationale: the tab and link previews should show the tracker mark instead of a generic icon or an empty card.

## 2026-09-10 — Curator-managed roster and Chris D'Elia ([#9](https://github.com/naghdy/comedian-tracker/pull/9))

Removed add-comedian, remove, refresh, and tour-link controls. Roster rows are a color chip, the name, and the show count on the right. Click-to-filter and **Reset seed** stayed. Agenda can still add or remove a single show (`source: "user"`).

Chris D'Elia was seeded from chrisdelia.com (apostrophe in the display name), one row per night, each with that night’s Buy Tickets URL. The PR landed 62 nights; Stockholm 27 Oct in #12 brought the file to 63. Hydration adds any missing seed comedian, not only Jeff. Seed key bumped to `v8`.

Rationale: the roster is curated. Inline add/remove/refresh invited unofficial dates and a noisy sidebar. Official nights belong in git, then in the bundle.

## 2026-09-16 — Dave Chappelle Karmageddon ([#10](https://github.com/naghdy/comedian-tracker/pull/10))

Chappelle’s `tourUrl` became the Live Nation artist page. Seeded the announced Karmageddon arenas (Nashville 20 Oct, Charlotte 21 Oct, Toronto 23 Oct, Louisville 24 Oct, Austin 26 Oct, Houston 28 Oct, MSG 6 Nov) plus Fastball Mesa 18 Oct. Removed the past MSG 10 Sep 2026 benefit. The 25 Sep DAR benefit was not on this list yet. Seed key `v8` → `v9`. Eight listed nights.

Rationale: Live Nation had published the arena run. The old Ticketmaster artist URL was stale and is rewritten on migrate (`STALE_TOUR_URLS`).

## 2026-09-21 — DC benefit and MSG night 2 ([#11](https://github.com/naghdy/comedian-tracker/pull/11))

Added 25 Sep 2026, DAR Constitution Hall, Washington, benefit for the Duke Ellington School of the Arts, and 7 Nov 2026, Madison Square Garden, NY Comedy Festival second night. The 6 Nov MSG row was left as-is. Seed key `v9` → `v10`. Ten listed nights.

Rationale: both nights are on Live Nation (the MSG pair also on the NY Comedy Festival schedule). They were announced after the Karmageddon seed.

## 2026-09-28 — Atlanta and Stockholm 27 Oct ([#12](https://github.com/naghdy/comedian-tracker/pull/12))

Added Dave Chappelle, 4 Nov 2026, State Farm Arena, Atlanta, Karmageddon (Live Nation event page; the arena page slug says 11-06 and the page date is 4 Nov). Added Chris D'Elia, 27 Oct 2026, Sodra Teatern, Stockholm, from chrisdelia.com / Tickster. The 26 Oct Stockholm night stayed. Atlanta was already in `cities.json`. Seed key `v10` → `v11`. Chappelle 11 nights, D'Elia 63.

Rationale: the Monday digest found two nights the previous seed did not have. Existing nights were not rewritten.

## 2026-10-05 — Weekly refresh ([#14](https://github.com/naghdy/comedian-tracker/pull/14))

Jeff Arcuri gained 32 nights from the official Seated widget on jeffarcuri.com/shows (artist `ca51f2fa-2a2d-4864-ab5c-857e4d1536cc`). 2026 clubs stay titled "Jeff Arcuri: Fresh Cut" (Stamford 15–17 Oct, New Brunswick 12–14 Nov, Denver Comedy Works 17–19 Dec). 2027 "Jeff Arcuri: The Road Trip Tour" adds Portland OR 27–28 Jan, Victoria 31 Jan, Salt Lake City 3–4 Feb, Cleveland 23 Feb, Columbus 24 Feb, Cedar Rapids 4 Mar, Kansas City 11 Mar, Tulsa 13 Mar, San Antonio 17 Mar, Sugar Land 18 Mar, Dallas 19–20 Mar, Jacksonville 9 Apr, Clearwater 10 Apr, Tallahassee 11 Apr, Charlotte 21 Apr, Richmond 22 Apr, Wilmington 23 Apr, Charleston 25 Apr, Providence 15 May, and a second Beacon Theatre night on 6 Jun. The previous 50 nights stayed. Jeff is 82.

Dave Chappelle gained 27 Oct 2026, 19:30, Moody Center ATX, Austin, title "Dave Chappelle Karmageddon" (Live Nation). The 26 Oct Austin night stayed. Chappelle is 12.

Chris D'Elia gained Comix Roadhouse (Mohegan Sun), Uncasville: 29 Apr 2027 20:00, 30 Apr 2027 20:00, and 1 May 2027 18:00 (earliest of 18:00/20:00), from chrisdelia.com. D'Elia is 66.

Ricky Gervais start times for Manchester 12–13 Oct and Brighton 16–17 Nov moved from 18:30 to 19:30. Live Nation UK lists 19:30 as the show; 18:30 is doors.

New city pins: Stamford CT and Uncasville CT. Seed key `v11` → `v12`.

Rationale: the Monday digest checked these nights on the official sources the same day. Existing listed nights that those sources still show were kept.
