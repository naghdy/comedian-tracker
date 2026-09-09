# Comedian Tracker

Personal dashboard for tracking live comedy shows for a curated roster. No account — roster and shows persist in `localStorage`.

**Live site:** [https://naghdy.github.io/comedian-tracker/](https://naghdy.github.io/comedian-tracker/)

Day-to-day use is the live URL. You do not need to run anything locally.

## GitHub Pages (one-time)

The site deploys from GitHub Actions on every push to `main` (workflow: `.github/workflows/pages.yml`).

If the live URL 404s after the first merge, enable Pages in the repo:

1. Open **Settings → Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Re-run the **Deploy GitHub Pages** workflow (Actions tab), or push an empty commit to `main`

No API keys are required. The map uses Leaflet + OpenStreetMap / Carto.

## Run locally (optional)

```bash
npm install
npm run dev
```

Vite is configured with `base: '/comedian-tracker/'`, so the printed URL is [http://localhost:5173/comedian-tracker/](http://localhost:5173/comedian-tracker/).

```bash
npm run build    # production bundle
npm run preview  # serve the build
```

## What you get

- **Roster** (left): color chips, click-to-filter, add/remove comedian (name + optional tour URL).
- **Trip checker** (top): city + start/end dates. Case-insensitive partial city match. Headline: *In Seattle these days…*
- **Map**: Leaflet + OpenStreetMap / Carto dark tiles, color-coded pins, clickable popups.
- **Agenda**: chronological list, extra comedian/city filters, empty states, add/remove shows.

Starter roster: Ricky Gervais, Dave Chappelle, Andrew Schulz (alias Schultz), Mark Gagnon.

## Seed data

| File | Role |
| --- | --- |
| `data/comedians.json` | Roster + tour/site URLs |
| `data/shows.json` | Upcoming dates |
| `data/cities.json` | Static lat/lng lookup (no geocoding API key) |

Dates were seeded from public listings on **2026-09-09** (Live Nation, official tour pages, venue calendars). Rows with `"sample": true` / a **Sample** badge are placeholders, not confirmed on-sale dates. Chappelle’s public calendar is thin after the June 2026 arena run, so Seattle / Chicago / Las Vegas rows are marked Sample so the map and trip checker still have coverage.

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
