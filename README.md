# Comedian Tracker

Personal dashboard for tracking live comedy shows for a curated roster. No account — roster and shows persist in `localStorage`.

**Live site:** [https://naghdy.com/comedian-tracker/](https://naghdy.com/comedian-tracker/)

Day-to-day use is the live URL. You do not need to run anything locally.

## Project context

Agents and humans picking this up should start at [AGENTS.md](AGENTS.md). Detail lives in [docs/](docs/):

- [Architecture](docs/ARCHITECTURE.md) — stack, layout, Maps, theme, seed key, lookup
- [Data](docs/DATA.md) — file schemas and each comedian’s source of truth
- [Operations](docs/OPERATIONS.md) — roster updates, deploy, weekly digest
- [Decisions](docs/DECISIONS.md) — why the product looks like this

## GitHub Pages

The site deploys from GitHub Actions on every push to `main` (workflow: `.github/workflows/pages.yml`).

If the live URL 404s:

1. Open **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Re-run the **Deploy GitHub Pages** workflow (Actions tab), or push to `main`

### Google Maps API key (required for the map)

The roster, trip checker, and agenda work without a key. The map panel shows a setup message until one is provided.

1. Create a [Maps JavaScript API](https://console.cloud.google.com/google/maps-apis) key in Google Cloud.
2. Restrict it to `https://naghdy.com/comedian-tracker/*` (and `http://localhost:5173/*` if you develop locally).
3. Add a repo secret named **`VITE_GOOGLE_MAPS_API_KEY`**: **Settings → Secrets and variables → Actions**.
4. Re-run **Deploy GitHub Pages** so Vite can bake the key into the build.

Do not commit a real key. For local runs, copy `.env.example` to `.env.local`.

### Ticketmaster key (optional)

Lookup helpers in `src/lib/lookupShows.ts` can still call the [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) (CORS-enabled) plus optional SeatGeek. The **roster UI no longer adds or refreshes comedians** — the list is curator-managed in seed JSON. Club calendars such as Andrew Schulz’s official Laylo embed are stored as seed data and fetched by `npm run refresh-tours`, not from the browser.

1. Create a Discovery API key at [developer.ticketmaster.com](https://developer.ticketmaster.com/).
2. Add a repo secret named **`VITE_TICKETMASTER_API_KEY`**.
3. Optional: create a SeatGeek app at [seatgeek.com/account/develop](https://seatgeek.com/account/develop) and add **`VITE_SEATGEEK_CLIENT_ID`**.
4. Re-run **Deploy GitHub Pages** so Vite can bake the keys into the build.

These values are public in the JavaScript bundle, same as the Maps key. Do not commit them. Without a Ticketmaster key, seed club dates and known Laylo drops still populate. Other artists can be dated by hand in the agenda.

Locally, put the keys in `.env.local` next to the Maps key.

## Run locally (optional)

```bash
npm install
cp .env.example .env.local   # then paste your Maps + Ticketmaster keys
npm run dev
npm test                     # lookup merge helpers
```

Vite is configured with `base: '/comedian-tracker/'`, so the printed URL is [http://localhost:5173/comedian-tracker/](http://localhost:5173/comedian-tracker/).

```bash
npm run build    # production bundle
npm run preview  # serve the build
```

## What you get

- **Roster** (left): curator-managed color chips. Click a row to filter the map/agenda; show count is on the right. No add/remove/refresh/tour-link controls — tell the assistant which comedians to track and it updates seed JSON. Light/dark toggle (persisted). **Reset seed** restores the JSON files in this browser.
- **Map**: Google Maps, color-coded pins by comedian, clickable info windows. Dark vs default-light tiles follow the theme. Lookup events include venue lat/lng when Ticketmaster/SeatGeek send them, so new cities can pin without a `cities.json` edit.
- **Agenda**: chronological list, extra comedian/city filters, empty states, add/remove shows.
- **Trip checker**: city + start/end dates. Case-insensitive partial city match. Headline: *In Houston these days…*

Starter roster: Ricky Gervais, Dave Chappelle, Andrew Schulz (alias Schultz), Mark Gagnon, Jeff Arcuri, Chris D'Elia.

## Live lookup

The UI does not fetch live dates. Seed/scrape tooling (`npm run refresh-tours` and unused browser helpers in `lookupShows.ts`) can still merge:

1. Curated seed / club-calendar nights for that name (so Helium, Improv, and Levity dates Ticketmaster misses still appear).
2. Ticketmaster Discovery (if `VITE_TICKETMASTER_API_KEY` is set).
3. SeatGeek (if `VITE_SEATGEEK_CLIENT_ID` is set).
4. Official **Laylo** drop JSON (`data/laylo-drops.json`) when seed has no nights yet. The CloudFront file has no CORS headers, so GitHub Pages cannot read it from the browser; `npm run refresh-tours` parses it from Node into `data/shows.json`. Ticketmaster only lists Houston + West Nyack for Schulz — the 16-night seed is that official calendar.
5. Club HTML is not fetched in the browser (CORS). `npm run refresh-tours` scrapes Helium / Improv / Laylo from Node.

Multiple showtimes on the same night at the same venue collapse to one agenda row. Manually added (`user`) dates are kept when seed listed rows are replaced.

## Seed data

| File | Role |
| --- | --- |
| `data/comedians.json` | Roster + tour/site URLs |
| `data/shows.json` | Upcoming dates for the original four |
| `data/jeff-arcuri-shows.json` | Jeff Arcuri seed dates |
| `data/chris-delia-shows.json` | Chris D'Elia seed dates |
| `data/cities.json` | Static lat/lng lookup (no geocoding API key) |
| `data/laylo-drops.json` | Official Laylo embed drop IDs (Andrew Schulz homepage calendar) |
| `data/venue-pages.json` | Club event URLs to scrape from Node (`npm run refresh-tours`) |

Dates were seeded from public listings on **2026-09-09** (Chris D'Elia on **2026-09-10**; Chappelle Karmageddon on **2026-09-16**; DC benefit + second MSG night on **2026-09-21**; Atlanta and Stockholm second night on **2026-09-28**). There are **no Sample placeholders**. Prefer fewer confirmed dates over invented ones.

| Comedian | Real dates seeded | Sources |
| --- | --- | --- |
| Ricky Gervais | 22 (Legend, 9 Sep–10 Dec 2026) | [Live Nation UK](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051) |
| Dave Chappelle | **11** (one row per calendar night) | [Live Nation artist page](https://www.livenation.com/artist/K8vZ9171rcf/dave-chappelle-events) (`tourUrl`): Duke Ellington School benefit DAR Constitution Hall, Washington 25 Sep; [Fastball Comedy Festival](https://www.fastballcomedy.com/home) Sloan Park, Mesa 18 Oct; Karmageddon arenas — Nashville Bridgestone 20 Oct; Charlotte Spectrum Center 21 Oct; Toronto Scotiabank 23 Oct; Louisville KFC Yum! Center 24 Oct; Austin Moody Center ATX 26 Oct; Houston Toyota Center 28 Oct; Atlanta State Farm Arena 4 Nov; New York MSG 6–7 Nov (NY Comedy Festival). Past MSG 10 Sep benefit removed. |
| Andrew Schulz | **16** | Official Laylo embed on [theandrewschulz.com](https://www.theandrewschulz.com/) (`tourUrl`; drop [1e3551fe-33d5-4a86-8364-3edb80ccdd62](https://d21i0hc4hl3bvt.cloudfront.net/drops/1e3551fe-33d5-4a86-8364-3edb80ccdd62.json)): New Brunswick Stress Factory 11–12 Sep; Houston Improv 18–19 Sep; West Nyack Levity Live 25–26 Sep; Indianapolis Helium 23–24 Oct; Birmingham Stardome 6–7 Nov; Cleveland Hilarities 13–14 Nov; Raleigh Goodnights 4–5 Dec; Columbus Funny Bone 11–12 Dec. Ticketmaster/Live Nation only list Houston + Nyack. |
| Mark Gagnon | 11 | [markgagnonlive.com](https://markgagnonlive.com/) through 9 Jan 2027 |
| Jeff Arcuri | 50 (18 club nights in 2026 + 32 confirmed 2027 Road Trip nights; one row per calendar day) | [jeffarcuri.com/shows](https://www.jeffarcuri.com/shows); [Live Nation artist page](https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events) (`tourUrl`); [Ticketmaster artist page](https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710); venue pages (Summit City, Brea Improv, Orlando Funny Bone, Fort Lauderdale Improv, Huntsville Levity Live). Unverified **Oxnard Oct 2026** and **Mississauga Sep 2026** are omitted. No 2026-01 dates. |
| Chris D'Elia | **63** (one row per calendar night, 11 Sep 2026–15 May 2027) | Official hub [chrisdelia.com](https://www.chrisdelia.com/) (`tourUrl`) plus each night’s Buy Tickets URL. Stockholm Sodra Teatern 26–27 Oct (27 Oct added 2026-09-28). Hamburg 25 Oct corroborated by [Elbphilharmonie/Laeiszhalle](https://www.elbphilharmonie.de/en/whats-on/chris-delia/29092). Multiple club showtimes on the same night collapsed. San Antonio Live Nation-only dates omitted. |

Existing browsers may still have an older `localStorage` snapshot. **v4–v10** snapshots are migrated once into `comedian-tracker:v11`: Dave Chappelle’s listed nights become the Duke Ellington School DC benefit, Fastball Mesa, and the **9-night Karmageddon** arena run including Atlanta State Farm Arena 4 Nov and both NY Comedy Festival MSG dates (stale Ticketmaster tour URL replaced with Live Nation), missing seed comedians (including **Chris D'Elia**, now **63** nights with Stockholm 26–27 Oct) and their listed nights are added, Jeff Arcuri empty rows pick up seed nights, and Andrew Schulz’s four Live Nation dates are replaced with the full **16-night** official Laylo calendar. Stale listed seed rows are replaced; manual and lookup-sourced rows are kept. Use **Reset seed** (or a fresh profile) to restore the JSON files.

Edits you make in the UI stay in this browser. **Reset seed** in the roster restores the JSON files.

If you add a city that is not in `data/cities.json` and the show has no lat/lng from lookup, it still appears in the agenda but will not get a map pin until you add coordinates there.

## Weekly scrape hook

```bash
npm run refresh-tours
```

`scripts/refresh-tours.ts` fetches official **Laylo** drop JSON plus Helium / Improv / SeatEngine club pages listed in `data/venue-pages.json` and `data/laylo-drops.json`, parses unique calendar nights, and merges them into `data/shows.json` / `data/jeff-arcuri-shows.json`. Ticketmaster theater dates are still filled at runtime in the browser.

Suggested extra sources (respect robots.txt / ToS; prefer official pages):

- Ricky Gervais — [Live Nation UK](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051)
- Dave Chappelle — [Live Nation artist page](https://www.livenation.com/artist/K8vZ9171rcf/dave-chappelle-events) / [Fastball](https://www.fastballcomedy.com/home)
- Andrew Schulz — [theandrewschulz.com](https://www.theandrewschulz.com/) Laylo embed / venue pages
- Mark Gagnon — [markgagnonlive.com](https://markgagnonlive.com/)
- Jeff Arcuri — [jeffarcuri.com/shows](https://www.jeffarcuri.com/shows) / [Live Nation](https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events) / [Ticketmaster](https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710)
- Chris D'Elia — [chrisdelia.com](https://www.chrisdelia.com/)

A reasonable cadence is a Monday cron or GitHub Action that rewrites `data/shows.json` and bumps `generatedAt`. User-added shows live only in `localStorage` and are not overwritten by that file.

## Stack

Vite + React + TypeScript. v1 has no auth.
