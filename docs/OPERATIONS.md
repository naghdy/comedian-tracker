# Operations

Owner: Nabil (GitHub [naghdy](https://github.com/naghdy)), timezone Europe/Zurich.

Verified new tour dates go straight to production: open a PR, merge it, let GitHub Pages deploy, and tell Nabil what changed. Do not wait for a confirmation before shipping a date that is on the comedian’s source of truth. Still send the summary (who, which nights, which URLs).

Never invent a date. If the official page does not list it, leave it out.

## Adding a comedian

The curator names the person. The agent finds official dates, then:

1. Add a roster row to `data/comedians.json` (`id`, `name`, `color`, `tourUrl`, `notes`, `aliases` when spellings differ). Sidebar order follows this array.
2. Add shows to `data/shows.json`, or to a dedicated file imported from `src/lib/seedData.ts` (Jeff and Chris use dedicated files). One row per calendar night, `source: "listed"`, id `{prefix}-{YYYY-MM-DD}-{city-slug}`. See [DATA.md](DATA.md).
3. Add any new city to `data/cities.json` (`city`, `lat`, `lng`, `aliases`) so the map can pin it. A show with no city match and no lat/lng still appears on the agenda.
4. Bump the seed key in `src/lib/storage.ts`. Today that is `comedian-tracker:v12`. Set `KEY` to the next version and append the old key to `LEGACY_KEYS`. A browser that already has the current key will not re-read the JSON until the key changes.
5. Update tests that assert counts and migration: `src/lib/storage.test.ts`, and `src/lib/lookupShows.test.ts` if the new or changed comedian is covered there. `npm run refresh-tours` also exits 1 unless Andrew Schulz still has 16 nights — update that assertion when his official calendar actually changes length.
6. `npm test` and `npm run build`.
7. Open a PR, merge to `main`, and let Pages deploy. Tell Nabil what was added.

Do not add roster UI for add, remove, refresh, or tour links.

## Updating dates

Same flow as adding a comedian: edit the seed file (or the writer script, then regenerate), add cities if needed, bump `KEY`, push the old key into `LEGACY_KEYS`, update tests, PR, merge, Pages.

Remove a past one-off only when that comedian’s source drops it. Leaving a night the source still lists is correct. Deleting a night the source no longer lists is correct (the MSG 10 Sep 2026 benefit was removed that way). Do not prune nights only because the calendar date has passed.

Writer scripts, when you change their hardcoded rows:

```bash
npx tsx scripts/write-chris-delia-seed.ts   # overwrites data/chris-delia-shows.json
npx tsx scripts/write-jeff-arcuri-seed.ts    # overwrites data/jeff-arcuri-shows.json
```

`npm run refresh-tours` rewrites Schulz from Laylo and merges Jeff club pages. It does not bump localStorage, commit, or deploy. Review the diff before treating it as verified.

`hydrateSeedShows` replaces `listed` rows for each seed comedian and keeps `user` and `lookup` rows. People who already stored `v12` need the key bump; **Reset seed** is the manual escape hatch.

## Deploy

Push or merge to `main` runs **Deploy GitHub Pages** (`.github/workflows/pages.yml`). `workflow_dispatch` can re-run it. Concurrency group `pages` cancels an in-progress deploy.

The build job checks out the repo, uses Node 22, `npm ci`, and `npm run build` with:

- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_TICKETMASTER_API_KEY`
- `VITE_SEATGEEK_CLIENT_ID`

from Actions secrets, then uploads `dist`. The deploy job uses `actions/deploy-pages`.

If the live URL 404s: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then re-run the workflow.

### Verify the live bundle

After the workflow is green, confirm the new ids and the new seed key are in the published JavaScript, not only in the git tree.

1. Open [https://naghdy.com/comedian-tracker/](https://naghdy.com/comedian-tracker/) (the Pages host is [https://naghdy.github.io/comedian-tracker/](https://naghdy.github.io/comedian-tracker/)).
2. In the HTML, follow the module script under `/comedian-tracker/assets/`.
3. Search that bundle for a new show id (for example `dc-2026-10-27-austin`) and for the seed key (`comedian-tracker:v12`, or the version you just bumped to).

Vite inlines the JSON seed and the storage key, so both strings are in the JS. A stale Pages deploy will still show the previous ids and key.

## Weekly digest

An external assistant routine runs **Mondays at 08:57 Europe/Zurich**. It is not a workflow in this repo.

It checks every comedian’s source of truth ([DATA.md](DATA.md)), diffs that list against the seed, notifies Nabil of new dates, and ships them: PR, merge, Pages. The same rules apply (no invented dates, bump the seed key, one row per night, remove a one-off only when the source drops it).

`npm run refresh-tours` is a local helper for Laylo and club HTML. It is not that Monday routine.

## Troubleshooting

### Stale localStorage

Symptom: the live site is new, this browser still shows old nights or an old roster.

Cause: `load()` returns whatever is already stored under the current key and does not merge seed JSON again.

Fix: **Reset seed** in the sidebar (confirms, then replaces `comedian-tracker:v12` with the bundled seed and clears filters). A fresh profile does the same. If seed JSON changed and the key was not bumped, existing browsers will stay stale until someone resets or a later bump migrates them.

Theme lives in `comedian-tracker:theme` and is not cleared by Reset seed.

### Map key referrer errors

Symptom: the map panel says Google Maps failed to load, or the console reports `RefererNotAllowedMapError`. Roster, agenda, and trip checker still work.

Fix: on the Google Cloud key, enable the Maps JavaScript API and allow these HTTP referrers:

- `naghdy.com/*`
- `naghdy.github.io/*`
- `http://localhost:5173/*` for local `npm run dev`

The secret name is `VITE_GOOGLE_MAPS_API_KEY`. After changing the secret, re-run **Deploy GitHub Pages** so the new value is baked into the bundle. Locally, put it in `.env.local` and restart Vite. Do not commit the key.
