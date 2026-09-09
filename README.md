# Comedian Tracker

Personal dashboard for tracking live comedy shows for a curated roster. No account — roster and shows persist in `localStorage`.

**Live site:** [https://naghdy.com/comedian-tracker/](https://naghdy.com/comedian-tracker/)

Day-to-day use is the live URL. You do not need to run anything locally.

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

### Ticketmaster key (required for live date lookup)

GitHub Pages has no backend, so **Add comedian** and **Refresh shows** call the [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) from the browser (the API supports CORS). SeatGeek is an optional fallback.

1. Create a Discovery API key at [developer.ticketmaster.com](https://developer.ticketmaster.com/).
2. Add a repo secret named **`VITE_TICKETMASTER_API_KEY`**.
3. Optional: create a SeatGeek app at [seatgeek.com/account/develop](https://seatgeek.com/account/develop) and add **`VITE_SEATGEEK_CLIENT_ID`**.
4. Re-run **Deploy GitHub Pages** so Vite can bake the keys into the build.

These values are public in the JavaScript bundle, same as the Maps key. Do not commit them. Without a Ticketmaster key, adding a comedian still creates the roster entry and shows a clear message; dates can be added by hand.

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

- **Roster** (left): color chips, click-to-filter, add/remove comedian (name + optional tour URL). Adding a comedian looks up upcoming live dates and pins them on the map/agenda. **Refresh** (per comedian or all) re-fetches later. Light/dark toggle (persisted).
- **Map**: Google Maps, color-coded pins by comedian, clickable info windows. Dark vs default-light tiles follow the theme. Lookup events include venue lat/lng when Ticketmaster/SeatGeek send them, so new cities can pin without a `cities.json` edit.
- **Agenda**: chronological list, extra comedian/city filters, empty states, add/remove shows.
- **Trip checker**: city + start/end dates. Case-insensitive partial city match. Headline: *In Houston these days…*

Starter roster: Ricky Gervais, Dave Chappelle, Andrew Schulz (alias Schultz), Mark Gagnon, Jeff Arcuri.

## Live lookup

On **Add comedian** the app:

1. Saves the roster row immediately (name required, tour URL optional).
2. Searches Ticketmaster attractions/events for a name match (first + last name). Optional SeatGeek query if that client id is set.
3. Collapses multiple showtimes on the same night at the same venue to one agenda row.
4. Merges new shows into `localStorage` and they appear on the map + agenda right away.

If the API key is missing, the request fails, or nothing matches, the comedian **stays on the roster** and the add form shows what happened. Refresh replaces previous lookup-sourced rows for that person and keeps seed (`listed`) and manually added (`user`) dates.

## Seed data

| File | Role |
| --- | --- |
| `data/comedians.json` | Roster + tour/site URLs |
| `data/shows.json` | Upcoming dates for the original four |
| `data/jeff-arcuri-shows.json` | Jeff Arcuri seed dates |
| `data/cities.json` | Static lat/lng lookup (no geocoding API key) |

Dates were seeded from public listings on **2026-09-09**. There are **no Sample placeholders**. Prefer fewer confirmed dates over invented ones.

| Comedian | Real dates seeded | Sources |
| --- | --- | --- |
| Ricky Gervais | 22 (Legend, 9 Sep–10 Dec 2026) | [Live Nation UK](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051) |
| Dave Chappelle | 2 | [Ticketmaster](https://www.ticketmaster.com/dave-chappelle-tickets/artist/803682): MSG 10 Sep benefit; Fastball Festival, Sloan Park, Mesa 18 Oct. No solo tour found. |
| Andrew Schulz | 4 | [theandrewschulz.com](https://theandrewschulz.com/) / [Live Nation](https://www.livenation.com/artist/K8vZ917Cf37/andrew-schulz-events): Houston 18–19 Sep, West Nyack 25–26 Sep only. |
| Mark Gagnon | 11 | [markgagnonlive.com](https://markgagnonlive.com/) through 9 Jan 2027 |
| Jeff Arcuri | 50 (18 club nights in 2026 + 32 confirmed 2027 Road Trip nights; one row per calendar day) | [jeffarcuri.com/shows](https://www.jeffarcuri.com/shows); [Live Nation artist page](https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events) (`tourUrl`); [Ticketmaster artist page](https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710); venue pages (Summit City, Brea Improv, Orlando Funny Bone, Fort Lauderdale Improv, Huntsville Levity Live). Unverified **Oxnard Oct 2026** and **Mississauga Sep 2026** are omitted. No 2026-01 dates. |

Existing browsers may still have an older `localStorage` snapshot. **v4** / **v5** snapshots are migrated once into `comedian-tracker:v6`: if Jeff Arcuri is missing or has no shows, the verified seed nights are added; stale listed Jeff nights from an older seed are replaced. Manual and lookup-sourced rows are kept. Use **Reset seed** (or a fresh profile) to restore the JSON files.

Edits you make in the UI stay in this browser. **Reset seed** in the roster restores the JSON files.

If you add a city that is not in `data/cities.json` and the show has no lat/lng from lookup, it still appears in the agenda but will not get a map pin until you add coordinates there.

## Weekly scrape hook

```bash
npm run refresh-tours
```

`scripts/refresh-tours.ts` is a **stub**. It validates `data/shows.json` against the roster and prints how to wire a weekly refresh. It does not scrape yet.

Suggested sources (respect robots.txt / ToS; prefer official pages):

- Ricky Gervais — [Live Nation UK](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051)
- Dave Chappelle — [Ticketmaster](https://www.ticketmaster.com/dave-chappelle-tickets/artist/803682)
- Andrew Schulz — [theandrewschulz.com](https://theandrewschulz.com/) / [Live Nation](https://www.livenation.com/artist/K8vZ917Cf37/andrew-schulz-events)
- Mark Gagnon — [markgagnonlive.com](https://markgagnonlive.com/)
- Jeff Arcuri — [jeffarcuri.com/shows](https://www.jeffarcuri.com/shows) / [Live Nation](https://www.livenation.com/artist/K8vZ9179td0/jeff-arcuri-events) / [Ticketmaster](https://www.ticketmaster.com/jeff-arcuri-tickets/artist/2569710)

A reasonable cadence is a Monday cron or GitHub Action that rewrites `data/shows.json` and bumps `generatedAt`. User-added shows live only in `localStorage` and are not overwritten by that file.

## Stack

Vite + React + TypeScript. v1 has no auth.
