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

## Run locally (optional)

```bash
npm install
cp .env.example .env.local   # then paste your Maps key
npm run dev
```

Vite is configured with `base: '/comedian-tracker/'`, so the printed URL is [http://localhost:5173/comedian-tracker/](http://localhost:5173/comedian-tracker/).

```bash
npm run build    # production bundle
npm run preview  # serve the build
```

## What you get

- **Roster** (left): color chips, click-to-filter, add/remove comedian (name + optional tour URL). Light/dark toggle (persisted).
- **Trip checker** (top): city + start/end dates. Case-insensitive partial city match. Headline: *In Houston these days…*
- **Map**: Google Maps, color-coded pins by comedian, clickable info windows. Dark vs default-light tiles follow the theme.
- **Agenda**: chronological list, extra comedian/city filters, empty states, add/remove shows.

Starter roster: Ricky Gervais, Dave Chappelle, Andrew Schulz (alias Schultz), Mark Gagnon.

## Seed data

| File | Role |
| --- | --- |
| `data/comedians.json` | Roster + tour/site URLs |
| `data/shows.json` | Upcoming dates |
| `data/cities.json` | Static lat/lng lookup (no geocoding API key) |

Dates were seeded from public listings on **2026-09-09**. There are **no Sample placeholders**. Prefer fewer confirmed dates over invented ones.

| Comedian | Real dates seeded | Sources |
| --- | --- | --- |
| Ricky Gervais | 22 (Legend, 9 Sep–10 Dec 2026) | [Live Nation UK](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051), Chortle |
| Dave Chappelle | 2 | MSG 10 Sep benefit; Fastball Festival, Sloan Park, Mesa 18 Oct. Public calendar is sparse after the June 2026 arena run. |
| Andrew Schulz | 6 | Live Nation (Houston 18–19 Sep, West Nyack 25–26 Sep); [Helium Indianapolis](https://indianapolis.heliumcomedy.com/events/142211) 23–24 Oct. Aggregator-only dates omitted. |
| Mark Gagnon | 11 | [markgagnonlive.com](https://markgagnonlive.com) through 9 Jan 2027 |

Existing browsers may still have an older `localStorage` snapshot. Use **Reset seed** (or a fresh browser profile) to pick up this file. The app now stores state under `comedian-tracker:v3`.

Edits you make in the UI stay in this browser. **Reset seed** in the roster restores the JSON files.

If you add a city that is not in `data/cities.json`, it still appears in the agenda but will not get a map pin until you add coordinates there.

## Weekly scrape hook

```bash
npm run refresh-tours
```

`scripts/refresh-tours.ts` is a **stub**. It validates `data/shows.json` against the roster and prints how to wire a weekly refresh. It does not scrape yet.

Suggested sources (respect robots.txt / ToS; prefer official pages):

- Ricky Gervais — [Live Nation UK](https://www.livenation.co.uk/ricky-gervais-tickets-adp2051), Comedy.co.uk, rickygervais.com
- Dave Chappelle — Live Nation, MSG, venue calendars (dates often land late)
- Andrew Schulz — [Live Nation artist page](https://www.livenation.com/artist/K8vZ917Cf37/andrew-schulz-events) (also listed as Schultz)
- Mark Gagnon — [markgagnonlive.com](https://markgagnonlive.com)

A reasonable cadence is a Monday cron or GitHub Action that rewrites `data/shows.json` and bumps `generatedAt`. User-added shows live only in `localStorage` and are not overwritten by that file.

## Stack

Vite + React + TypeScript. v1 has no auth.
