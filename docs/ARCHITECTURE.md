# Architecture

## Stack

Vite 6 + React 18 + TypeScript. No router, no auth, no backend. The production bundle is static files deployed by GitHub Pages.

| Piece | Where |
| --- | --- |
| Entry | `index.html`, `src/main.tsx` |
| App shell | `src/App.tsx` |
| Types | `src/types.ts` (`Comedian`, `Show`, `CityCoord`, `TripQuery`, `StoredState`) |
| Styles | `src/index.css` (CSS variables, dark default, no single accent colour; comedians' colours are the only colour). Fonts: Big Shoulders Display (headings, months, day numbers), Hanken Grotesk (everything else), loaded from Google Fonts in `index.html`. |
| Motion | `motion` (`motion/react`). `LazyMotion` in `App.tsx` loads the animation features from `src/lib/motionFeatures.ts` as a separate chunk after first paint; components use `motion/react-m`. `MotionConfig reducedMotion="user"` honours the OS setting. |
| Map | `@react-google-maps/api` in `src/components/ShowMap.tsx`. Tile styles for both themes: `src/lib/mapStyles.ts`. |
| Build | `npm run build` → `tsc -b && vite build`. `vite.config.ts` sets `base: './'` (relative asset URLs, so the build works at `comediantracker.com/` and under any sub-path), dev server port `5173`, `host: true`. |

Env vars (all optional at compile time, all public in the bundle — never commit real values):

| Variable | Used for |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JavaScript API. Map panel only. |
| `VITE_TICKETMASTER_API_KEY` | Ticketmaster Discovery, `src/lib/lookupShows.ts`. |
| `VITE_SEATGEEK_CLIENT_ID` | SeatGeek events, same module. |

Copy `.env.example` to `.env.local` for local runs. Pages injects the same names from repo Actions secrets (see `.github/workflows/pages.yml`).

## Layout

One centred column, up to 1200px wide, laid out like a tour poster: header, map, dates, trip checker, footer. Each section opens with a thick rule. Date rows are a five-column grid on desktop (date, who, where, time, actions); below 900px the time folds into the place line, and below 640px each row stacks beside its date.

| Region | Component | Behavior |
| --- | --- | --- |
| Header | `src/components/Roster.tsx` | One bar with the "Comedian Tracker" wordmark, the total of upcoming nights and Light/Dark. Below it the lineup ("On tour"): a grid of names sorted by upcoming nights, each with its count and a thin bar in the comedian's colour scaled to the busiest comedian. Over 18 comedians it shows the busiest 15 (plus any selected) with **Show all N**. Click a name to filter map, agenda, and trip results; **Show everyone** clears it. There are no add, remove, refresh, or tour-link controls. |
| Top of main | `src/components/ShowMap.tsx` | Google Map. Color-coded circle pins, click opens an info window (title, venue, date, ticket link). |
| Middle | `src/components/Agenda.tsx` | Upcoming shows (today onward) grouped under large month headings, one `ShowRow` per night: weekday over a large day number ("Tonight" and an outlined number for today), name, tour title with the comedian's name stripped (`tourTitle` in `src/lib/display.ts`), venue, place and time, a **Tickets** link and a remove button that shows on hover. City text filter and comedian `<select>` stack with the roster filter. **Add a show** opens `ShowForm` (saved as `source: "user"`). |
| Bottom | `src/components/TripChecker.tsx` | City + from/to, defaulting to today and a week out. Case-insensitive partial city match via `cityMatches`. Results reuse `ShowRow` under a headline like `3 nights in Houston, 18–25 Nov`. |
| Footer | `src/App.tsx` | Where the dates come from, and **Reset seed**. |

`src/App.tsx` owns filter state, theme, and show add/remove. Roster membership is not editable in the UI.

Only upcoming nights are shown. `App` runs `upcomingShows` (`src/lib/filters.ts`) on the stored shows before anything else, so the map, agenda, trip checker and roster counts all start from the viewer's local calendar day (`todayISO`). Past nights stay in `localStorage` and the seed JSON; they are hidden, not deleted, so no seed-key bump is involved.

## Google Maps

`ShowMap` reads `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`. Empty key: a setup message; roster, agenda, and trip checker still work. Load error: the panel says the Maps JavaScript API must be enabled and the key must be valid for this host.

The key is a GitHub repo secret named `VITE_GOOGLE_MAPS_API_KEY` (**Settings → Secrets and variables → Actions**). The Pages workflow passes it into `npm run build`, so Vite bakes it into the JS bundle. HTTP referrer restrictions on the key must allow:

- `comediantracker.com/*`
- `www.comediantracker.com/*`
- `naghdy.com/*` and `naghdy.github.io/*` (old addresses)
- `http://localhost:5173/*` for local dev

Pins: `coordsForShow` uses `show.lat` / `show.lng` when both are finite, otherwise `data/cities.json` (city, or `"city, region"` when a region is set). Shows with no match stay in the agenda and are counted in the map lede as skipped. Several shows in the same city for the same comedian are nudged apart so the pins do not stack. Default view is `{ lat: 39.5, lng: -45 }` at zoom 3; one pin zooms to 6; many pins call `fitBounds`. Dark theme applies `DARK_MAP_STYLES`; light theme uses Google’s default light tiles (`styles: []`).

## Light / dark toggle

Default is **dark**.

- Inline script in `index.html` sets `document.documentElement.dataset.theme` before paint. Stored value `comedian-tracker:theme` wins; anything else (including a missing key) becomes `dark`.
- `src/lib/theme.ts`: `readTheme`, `applyTheme`, `persistTheme`. The roster button flips the value and writes localStorage.
- This key is independent of the seed key, so a seed bump does not reset the theme.

## localStorage seed

Current key: `comedian-tracker:v15` in `src/lib/storage.ts`.

`LEGACY_KEYS` (newest first): `v14`, `v13`, `v12`, `v11`, `v10`, `v9`, `v8`, `v7`, `v6`, `v5`, `v4`.

`load()`:

1. If `v15` parses as `{ comedians, shows }`, use it as-is. It is **not** re-merged with the JSON seed.
2. Otherwise walk `LEGACY_KEYS` and run `hydrateSeedShows` on the first snapshot that parses.
3. Otherwise clone the bundled seed.

`useTrackerState` writes the current state back to `v15` on every change, so a legacy migration is persisted once.

`hydrateSeedShows` (also exported as deprecated `hydrateJeffSeed`) for each seed comedian:

- No roster match (same `id`, or `namesMatch` on the name): append the comedian and their seed shows.
- Match: drop that comedian’s rows unless `source` is `user` or `lookup`, then merge the seed rows (`mergeShows`). Remap `comedianId` (and ids) when the stored id differs from the seed id.
- Fill a missing `tourUrl`, `notes`, or `aliases` from the seed. Replace `tourUrl` when it is in `STALE_TOUR_URLS` (old Ticketmaster artist pages, `theandrewschulz.com` without `www`, and the Jeff site URLs that were replaced by the Live Nation artist page).

Because a populated `v15` is never hydrated again, **any seed change must bump `KEY` and append the previous key to `LEGACY_KEYS`.**

**Reset seed** (`resetSeed`) confirms with “Restore the starter roster and seed shows?”, writes a fresh clone of the bundled seed to `v15`, and clears roster, city, comedian, and trip filters in `App`.

## City geocoding

There is no Geocoding API. `src/lib/geo.ts` loads `data/cities.json` and matches case-insensitively, ignoring periods. Exact city or alias first, then substring either way. `knownCities()` feeds the datalist on `ShowForm`.

Lookup rows from Ticketmaster or SeatGeek can carry venue lat/lng, so those pins work before a `cities.json` edit. Seed rows generally do not store lat/lng; they need a city row.

`scripts/merge-cities.ts` is a one-shot merger of extra city rows into `data/cities.json` (run with `npx tsx scripts/merge-cities.ts`). It does not geocode.

## lookupShows and auto-lookup

`src/lib/lookupShows.ts` can merge upcoming nights for a name:

1. Curated seed rows still on or after today (`seedListedShows` in `src/lib/listedCalendar.ts`), marked `source: "listed"`.
2. Ticketmaster Discovery, if `VITE_TICKETMASTER_API_KEY` is set (`source: "lookup"`, cancelled and date-TBA events dropped).
3. SeatGeek, if `VITE_SEATGEEK_CLIENT_ID` is set.
4. Official Laylo drop JSON from `data/laylo-drops.json`, **only when `window` is undefined** (Node). The CloudFront file has no CORS headers, so the browser must not fetch it.

Multiple showtimes on the same night at the same venue collapse to one row (`collapseByNight`): earliest `time` wins; if times tie, the row that has a `ticketUrl` wins. Dedupe key is comedian + date + normalized venue + normalized city.

The roster UI does not call this. Add-comedian and per-comedian refresh were removed in PR #9. `lookupUpcomingShows`, `applyRefreshedShows`, and `lookupMessage` remain for tests and for any Node caller. Do not put those controls back on the roster.

## refresh-tours

`npm run refresh-tours` runs `scripts/refresh-tours.ts` in Node (no CORS):

- Fetches each Laylo URL in `data/laylo-drops.json`, parses `orderedSubProducts` titles into one night per calendar day (`src/lib/parseLaylo.ts`), and **replaces** Andrew Schulz rows in `data/shows.json` when that fetch returns at least one night. A failed fetch leaves the existing Schulz rows in place. Rebuilt ids use the script’s slug, so `as-2026-09-25-westnyack` would become `as-2026-09-25-west-nyack`.
- Fetches Helium / Improv / SeatEngine pages in `data/venue-pages.json`, parses unique calendar days (`src/lib/parseVenueHtml.ts`), and **merges** Jeff Arcuri hits into `data/jeff-arcuri-shows.json` (existing rows kept).
- Pages that fail or parse to zero nights are skipped. The script does not invent dates.
- Rewrites `generatedAt` on a file it changes.
- Exits 1 unless Andrew Schulz has exactly 15 nights, or if a show is missing `id` / `comedianId` / `city` / `date`, or if `comedianId` is not on the roster. A real change to the Schulz count has to update that assertion and `src/lib/storage.test.ts`.

It does not bump the localStorage key, open a PR, or deploy. Chris D'Elia is regenerated separately by `npx tsx scripts/write-chris-delia-seed.ts`. Jeff’s hand-verified list is `npx tsx scripts/write-jeff-arcuri-seed.ts` (that script overwrites `data/jeff-arcuri-shows.json`).

## Favicon and Open Graph

`index.html` points at files in `public/` (copied to the site root):

| File | Role |
| --- | --- |
| `favicon.ico`, `favicon.svg`, `favicon-32.png`, `icon-512.png` | Icons |
| `apple-touch-icon.png` | Apple touch icon |
| `og-image.png` | `og:image` and `twitter:image` (1200×630), absolute URL `https://comediantracker.com/og-image.png` |
| `.nojekyll` | Stops GitHub Pages from running Jekyll |

`og:url` is `https://comediantracker.com/`.
