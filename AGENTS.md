# Comedian Tracker

Personal live-show dashboard for a curated comedy roster. No accounts. The roster and shows persist in this browser’s `localStorage`. v1 is Vite + React + TypeScript.

**Live:** [https://naghdy.com/comedian-tracker/](https://naghdy.com/comedian-tracker/)  
**GitHub Pages:** [https://naghdy.github.io/comedian-tracker/](https://naghdy.github.io/comedian-tracker/)

Day-to-day use is the live URL. You do not need a local server.

## Run, test, build

```bash
npm install
cp .env.example .env.local   # Maps key required for the map; Ticketmaster/SeatGeek optional
npm run dev                  # http://localhost:5173/comedian-tracker/
npm test                     # tsx --test src/lib/*.test.ts
npm run build                # tsc -b && vite build
npm run preview
npm run refresh-tours        # Node scrape into seed JSON (not the weekly digest)
```

Node 22 in GitHub Actions (`.github/workflows/pages.yml`). Vite `base` is `/comedian-tracker/`.

## Where data lives

Seed JSON is in `data/` and bundled by `src/lib/seedData.ts` (`shows.json` + `jeff-arcuri-shows.json` + `chris-delia-shows.json`). City pins come from `data/cities.json`. The browser copy is `localStorage` key `comedian-tracker:v12`. Schema, sources, and ID rules: [docs/DATA.md](docs/DATA.md).

## Golden rules

- Owner: Nabil (GitHub [naghdy](https://github.com/naghdy)), timezone Europe/Zurich.
- Never invent dates. Prefer official sources, and prefer fewer confirmed dates over guesses.
- Standing preference: verified new tour dates go straight to prod (PR, then merge, then Pages) without asking for confirmation. Still tell the owner what changed.
- Roster is curator-managed. Don't add UI controls for add/remove/refresh.
- Always bump the localStorage seed key when seed data changes.
- Keep the layout (map top, trip checker bottom) and the dark default.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, layout, Maps, theme, seed migration, lookup, refresh script
- [docs/DATA.md](docs/DATA.md) — every data file, schemas, one-row-per-night, sources
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — add a comedian, update dates, deploy, weekly digest, troubleshooting
- [docs/DECISIONS.md](docs/DECISIONS.md) — dated product decisions
