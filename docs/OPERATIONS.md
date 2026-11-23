# Operations

Owner: Nabil (GitHub [naghdy](https://github.com/naghdy)), timezone Europe/Zurich.

Verified new tour dates go straight to production: open a PR, merge it, let GitHub Pages deploy, and tell Nabil what changed. Do not wait for a confirmation before shipping a date that is on the comedian’s source of truth. Still send the summary (who, which nights, which URLs).

Never invent a date. If the official page does not list it, leave it out.

## Adding a comedian

The curator names the person. The agent finds official dates, then:

1. Add a roster row to `data/comedians.json` (`id`, `name`, `color`, `tourUrl`, `notes`, `aliases` when spellings differ). Sidebar order follows this array.
2. Add shows to `data/shows.json`, or to a dedicated file imported from `src/lib/seedData.ts` (Jeff, Chris, Mo Amer, Aaron Chen, Jimmy O. Yang, Zarna Garg and Andrew Santino use dedicated files). One row per calendar night, `source: "listed"`, id `{prefix}-{YYYY-MM-DD}-{city-slug}`. See [DATA.md](DATA.md).
3. Add any new city to `data/cities.json` (`city`, `lat`, `lng`, `aliases`) so the map can pin it. A show with no city match and no lat/lng still appears on the agenda.
4. Bump the seed key in `src/lib/storage.ts`. Today that is `comedian-tracker:v20`. Set `KEY` to the next version and append the old key to `LEGACY_KEYS`. A browser that already has the current key will not re-read the JSON until the key changes.
5. Update tests that assert counts and migration: `src/lib/storage.test.ts`, and `src/lib/lookupShows.test.ts` if the new or changed comedian is covered there. `npm run refresh-tours` also exits 1 unless Andrew Schulz still has 15 nights — update that assertion when his official calendar actually changes length.
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

`hydrateSeedShows` replaces `listed` rows for each seed comedian and keeps `user` and `lookup` rows. People who already stored `v20` need the key bump; **Reset seed** is the manual escape hatch.

## Deploy

Push or merge to `main` runs **Deploy GitHub Pages** (`.github/workflows/pages.yml`). `workflow_dispatch` can re-run it. Concurrency group `pages` cancels an in-progress deploy.

The build job checks out the repo, uses Node 22, `npm ci`, and `npm run build` with:

- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_TICKETMASTER_API_KEY`
- `VITE_SEATGEEK_CLIENT_ID`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_CLARITY_PROJECT_ID`

from Actions secrets, then uploads `dist`. The deploy job uses `actions/deploy-pages`.

If the live URL 404s: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then re-run the workflow.

### Custom domain

The site is served at `comediantracker.com` as a GitHub Pages custom domain on this repo. Because the workflow publishes with GitHub Actions, the domain lives only in **Settings → Pages → Custom domain**; there is no `CNAME` file (Pages ignores one in this mode). Keep **Enforce HTTPS** on.

DNS for `comediantracker.com` (GitHub's documented Pages values):

- `A` on `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `AAAA` on `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- `CNAME` on `www`: `naghdy.github.io` (no repo name). With the apex set as the custom domain, Pages redirects `www` to the apex.
- `TXT` on `_github-pages-challenge-naghdy`: the value GitHub shows when the domain is verified under the account's **Settings → Pages**. Keep it, it stops anyone else claiming the domain on Pages.

`vite.config.ts` uses a relative `base` (`./`), so the same build also works under a sub-path. localStorage is per origin, so a browser that used the old address starts fresh on the new one (seed roster and dark theme by default).

### Microsoft Clarity

Clarity records sessions and heatmaps on the live site. `src/main.tsx` calls `loadClarity` from `src/lib/clarity.ts` only in production builds, which adds Clarity's official async tag (`https://www.clarity.ms/tag/<id>`) to the page head. `npm run dev` never loads it. An empty or malformed ID loads nothing.

The project for `comediantracker.com` is `zf9s1pvnn4`. The ID is public (it ships in the page source), so it sits in `.github/workflows/pages.yml` as the default for `VITE_CLARITY_PROJECT_ID`. A repo Actions secret with the same name overrides it.

To change project: set the secret `VITE_CLARITY_PROJECT_ID` (**Settings → Secrets and variables → Actions**), or edit the default in `pages.yml`, then re-run **Deploy GitHub Pages** so the new ID is baked into the bundle.

Check: the live page's Network tab shows a request to `www.clarity.ms/tag/zf9s1pvnn4`, and Clarity's dashboard shows the first sessions within about two hours.

To turn it off, remove the default from `pages.yml` (and the secret, if set) and redeploy.

### Verify the live bundle

After the workflow is green, confirm the new ids and the new seed key are in the published JavaScript, not only in the git tree.

1. Open [https://comediantracker.com/](https://comediantracker.com/).
2. In the HTML, follow the module script under `./assets/`.
3. Search that bundle for a new show id (for example `dc-2026-10-27-austin`) and for the seed key (`comedian-tracker:v20`, or the version you just bumped to).

Vite inlines the JSON seed and the storage key, so both strings are in the JS. A stale Pages deploy will still show the previous ids and key.

### Google Analytics

GA4 loads from `src/lib/analytics.ts`, called once in `src/main.tsx`. It reads the measurement ID from `VITE_GA_MEASUREMENT_ID` and adds Google's gtag.js snippet only in production builds and only when the value looks like `G-` followed by letters and digits. Dev servers and builds without the secret send nothing.

The live ID is `G-7674VEF3BQ` (the comediantracker.com web stream). It is set in `.github/workflows/pages.yml` as the default for `VITE_GA_MEASUREMENT_ID`, since a measurement ID is public anyway. A repo Actions secret with the same name overrides it.

To change the ID:

1. In Google Analytics, open the GA4 property's **Web** data stream for `https://comediantracker.com` and copy its measurement ID (`G-...`).
2. Either edit the default in `pages.yml`, or add a repo secret `VITE_GA_MEASUREMENT_ID` (**Settings → Secrets and variables → Actions**).
3. Re-run **Deploy GitHub Pages** so the ID is baked into the bundle.
4. Check: the live page source has a script from `googletagmanager.com/gtag/js?id=G-...`, and GA's **Realtime** report shows your visit.

The site has no client-side router, so the page view sent on load is the only one. Enhanced measurement in the stream settings adds scrolls and outbound clicks (ticket links) without code changes.

## Weekly digest

An external assistant routine runs **Mondays at 08:57 Europe/Zurich**. It is not a workflow in this repo.

It checks every comedian’s source of truth ([DATA.md](DATA.md)), diffs that list against the seed, notifies Nabil of new dates, and ships them: PR, merge, Pages. The same rules apply (no invented dates, bump the seed key, one row per night, remove a one-off only when the source drops it).

`npm run refresh-tours` is a local helper for Laylo and club HTML. It is not that Monday routine.

## Troubleshooting

### Stale localStorage

Symptom: the live site is new, this browser still shows old nights or an old roster.

Cause: `load()` returns whatever is already stored under the current key and does not merge seed JSON again.

Fix: **Reset seed** in the sidebar (confirms, then replaces `comedian-tracker:v20` with the bundled seed and clears filters). A fresh profile does the same. If seed JSON changed and the key was not bumped, existing browsers will stay stale until someone resets or a later bump migrates them.

Theme lives in `comedian-tracker:theme` and is not cleared by Reset seed.

### Map key referrer errors

Symptom: the map panel says Google Maps failed to load, or the console reports `RefererNotAllowedMapError`. Roster, agenda, and trip checker still work.

Fix: on the Google Cloud key, enable the Maps JavaScript API and allow these HTTP referrers:

- `comediantracker.com/*`
- `www.comediantracker.com/*`
- `naghdy.com/*` and `naghdy.github.io/*` (old addresses, harmless to keep)
- `http://localhost:5173/*` for local `npm run dev`

The secret name is `VITE_GOOGLE_MAPS_API_KEY`. After changing the secret, re-run **Deploy GitHub Pages** so the new value is baked into the bundle. Locally, put it in `.env.local` and restart Vite. Do not commit the key.
