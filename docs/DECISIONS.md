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

## 2026-11-12 — Refresh: Gervais 2027, D'Elia additions, Schulz Stardome

Ricky Gervais gained 16 "Ricky Gervais: Legend" nights in 2027 from Live Nation UK, all 19:30: Guildford G Live 5–6 Jan, Bournemouth International Centre 11–12 Jan, Utilita Arena Cardiff 2–3 Feb, O2 Apollo Manchester 8–9 Feb, York Barbican 15–16 Feb, Motorpoint Arena Nottingham 4 Mar, Glasgow SEC Armadillo 17–18 May, Leeds first direct bank arena 24 Jun, New Theatre Oxford 26–27 Jul. The page's International tab could not be read; no international nights were added. Gervais is 38.

Chris D'Elia gained 18 nights from chrisdelia.com: St. Louis Helium 4–5 Dec 2026, Hollywood Dolby Theatre 31 Dec 2026, Timonium Magoobys Joke House 11–13 Mar 2027, Calgary Yuk Yuk's 18–20 Mar, San Antonio Laugh Out Loud 8–10 Apr, Bloomington MN House of Comedy 6–9 May, Oklahoma City Bricktown 10–11 Sep 2027. San Diego 28 Nov moved from AleSmith Brewery to The Legacy Performance Institute (new Buy Tickets link). D'Elia is 84.

Andrew Schulz's Laylo drop now lists Stardome Comedy Club Birmingham as 7 Nov 2026 only, so the 6 Nov row was removed. Schulz is 15; the `refresh-tours` assertion and tests moved from 16 to 15.

Checked and unchanged: Jeff Arcuri (Seated widget matches all 2027 nights; 2026 club runs show only their first night there, so the hand-verified runs stay), Mark Gagnon (Detroit 17–18 Dec, Salt Lake City 8–9 Jan; "more dates coming soon"), Dave Chappelle (Live Nation lists only a past 11 Nov Yellow Springs event presenting Yasiin Bey, not added).

New city pins: Bournemouth, York (named `York, England` so trip searches for New York don't match it), Nottingham, Glasgow, Leeds, Oxford, Hollywood, Timonium, Calgary, Bloomington MN, Oklahoma City. Seed key `v12` → `v13`.

Rationale: the official sources listed these nights on 2026-11-12. Existing listed nights those sources still show were kept; past nights were not pruned for being past.

## 2026-11-13 — Add Mo Amer

Mo Amer joins the roster (last in the sidebar) with 18 nights from his official tour page, moamer.com/shows: San Jose Improv 13–14 Nov 2026, Comedy Works Downtown Denver 19–21 Nov, Blue Note Hawaii Honolulu 11–12 Dec, Emerald City Comedy Club Seattle 8–10 Jan 2027, Stand Up Live Phoenix 22–23 Jan, Cap City Comedy Club Austin 29–31 Jan, American Comedy Co. San Diego 11–13 Feb 2027. His rows live in `data/mo-amer-shows.json` (prefix `ma`).

The official page prints month and day without a year. Years and earliest start times were confirmed on each venue's ticket page. Honolulu 12 Dec and San Diego 13 Feb carry no time because neither could be confirmed on the venue side; 13 Feb stays because the official page lists it. Nights earlier in 2026 still printed on the page were not seeded.

New city pins: Honolulu, San Jose. Seed key `v13` → `v14`.

## 2026-11-13 — Add Aaron Chen and Jimmy O. Yang

Aaron Chen (Australian stand-up from Sydney, now in New York) and Jimmy O. Yang join the end of the roster, in that order. Rows live in `data/aaron-chen-shows.json` (prefix `ac`) and `data/jimmy-o-yang-shows.json` (prefix `jy`).

Aaron Chen: 24 nights from aaronchencomedy.com, the Technology tour. Australia 26 Nov–17 Dec 2026 (Newcastle, Thirroul, Canberra, Darwin, Brisbane 10–11 Dec, Melbourne, Sydney), US 15 Jan–10 Apr 2027 (Dallas, Houston, Boston, Philadelphia, Portland, Seattle, Irvine 18–20 Feb, Chicago, Honolulu, Sacramento, San Francisco, New York), Canada 16–17 Apr 2027 (Calgary, Vancouver). The site gives no years; Live Nation and venue pages do. Thirroul follows the venue and Live Nation (27 Nov) rather than the site (28 Nov).

Jimmy O. Yang: 39 nights from jimmycomedy.com/shows, the Has No Friends Tour, 15 Jan–30 May 2027 across the US plus Toronto and Vancouver. No years printed; every night is upcoming, so 2027, and Live Nation/Ticketmaster and the venue pages that could be read agree.

New city pins: Brisbane, Canberra, Darwin, Grand Rapids, Jersey City, Kahului (Maui), Medford, Melbourne, Newcastle NSW (named `Newcastle, NSW` so it doesn't capture Newcastle upon Tyne), Reno, Sydney, Thirroul, Tucson. Seed key `v14` → `v15`.

## 2026-11-16 — Fix map pins for rows with a region

24 seed nights were pinned in the wrong place: 19 Ricky Gervais England nights and Chris D'Elia's Manchester night in Los Angeles, Jeff Arcuri's Portland ME night in Los Angeles, and three Birmingham, AL nights in Birmingham, England. `coordsForShow` joined city and region (`"Sheffield, England"`, `"Portland, ME, ME"`) and ran the fuzzy substring match on that string, where the Los Angeles alias `la` sits inside "England" and "Portland", and `Birmingham` is a substring of `"Birmingham, AL, AL"`.

Fix: the joined string is only tried as an exact city or alias; otherwise the city alone is used. The substring fallback in `findCity` now needs whole words. No other seed night moved (checked all 349). Display-only, so no seed-key bump.

## 2026-11-16 — Add Zarna Garg

Zarna Garg joins the end of the roster with 26 nights from her official site, zarnagarg.com/tickets (a Bandsintown list): Australia 21 Nov–6 Dec 2026 (Sydney Opera House, Seymour Centre York Theatre 24–28 Nov, Brisbane, Melbourne National Theatre and Palais, Adelaide), Canada 11–12 Dec (Montreal, Halifax), then the US 18 Dec 2026–27 Mar 2027 (Atlanta, Washington, New York Beacon 31 Dec, Kansas City 14–16 Jan, Ledyard, Portland ME, Charleston, Honolulu, Las Vegas, Anaheim, Bethlehem, Hershey). Rows live in `data/zarna-garg-shows.json` (prefix `zg`).

New city pins: Adelaide, Anaheim, Bethlehem, Halifax, Hershey, Ledyard, Montreal. Every new row's `city, region` matches a city or alias exactly, so it never falls through to substring matching. Seed key `v15` → `v16`.

## 2026-11-13 — Show only upcoming nights

The agenda opened on September 2026 because nothing filtered by date. Nabil asked for the list to start from today. `upcomingShows` now hides nights before the viewer's local date across the map, agenda, trip checker and roster counts.

Rationale: past nights are still useful as history in the seed files, and the data rules say not to prune a night only because it has passed, so this is a display filter. Seed JSON and the seed key are unchanged.

## 2026-11-16 — Move to comediantracker.com

Nabil bought `comediantracker.com` and wants it as the main address. Hosting stays on GitHub Pages: the repo already deploys there with Actions, and Pages supports a custom apex domain with a free HTTPS certificate, so there was no reason to move hosts.

Vite `base` goes from `/comedian-tracker/` to `./`. Relative asset paths work at the domain root and at the old `naghdy.com/comedian-tracker/` path, so this change can merge before or after the domain is switched without breaking the site. `og:url` and the `og:image`/`twitter:image` URLs now point at `https://comediantracker.com/`. The domain itself is set in **Settings → Pages**, not in a `CNAME` file, since Actions publishing ignores that file.

## 2026-11-16 — Redesign

Nabil asked for the site to feel smoother and less obviously AI-generated. What read as template: Sora + IBM Plex Sans, radial colour glows behind the page, a neon lime accent, a glass sidebar, every block in a rounded bordered card (cards inside cards), a stock microphone icon, a red **Remove** button on every row, rows that repeat the name ("Mo Amer — Mo Amer"), developer copy ("Color-coded pins on Google Maps", "case-insensitive partial match") and a trip checker that opened on past dates.

The new look takes its cue from the dates list on a tour poster: a tall condensed face (Big Shoulders Display) for the title, section heads, month headings and day numbers, Hanken Grotesk for the rest, a cool charcoal ground, and no accent colour of its own, so the comedians' colours are the only colour. Cards are gone; the agenda is grouped by month with a date chip per night. The roster shows each comedian's upcoming count as a thin bar in their colour. The map uses matching quiet tiles in both themes.

Motion (`motion`, Motion for React) handles the few animated moments: the list eases in after a filter change, removed rows collapse, the add-show dialog and trip results fade in. It respects reduced-motion settings and its animation code loads in a separate chunk after first paint (about 14 KB gzipped, plus about 18 KB in the main bundle). The 3D, video and canvas libraries were considered and left out as too heavy for a list page.

His first look: "Now it looks very similar." The first pass had restyled the old layout without changing it, so the second pass changes the structure. The sidebar is gone. The page is one centred column with a large title and a festival-style lineup, where a comedian's name is set larger the more upcoming nights they have. Dates are set as a bill: a large day number, the name in capitals, venue and place, time, and a **Tickets** pill. The palette moved from charcoal to midnight navy with bone text (light theme: off-white with navy ink), and the map tiles follow it. Light/Dark moved to the top bar and **Reset seed** to the footer.

His second look: he liked the colours but found the header too big, and the roster may grow to about 50 comedians. The title moved into a slim top bar, and the lineup became a compact grid of names (count and a share-of-busiest bar in each comedian's colour), sorted by upcoming nights and folded to the busiest 15 past 18 names.

Kept: map first in the content, trip checker at the bottom, dark by default, no roster add/remove/refresh controls, upcoming-only filter. `localStorage` reads and writes are now wrapped so a blocked storage doesn't blank the page. No seed data changed, so no seed-key bump.

## 2026-11-17 — Weekly refresh: Gervais in Europe, Aaron Chen Brisbane link

The first weekly check (16 Nov) found new dates that its run could not push, so they ship here. Ricky Gervais gets three 2027 European nights, each read on an official page: Paris Accor Arena 30 Apr 19:30 (Live Nation France), Amsterdam AFAS Live 2 Jul (afaslive.nl, which says the timetable isn't out yet, so no time), and Stockholm Avicii Arena 28 Aug 19:30 (aviciiarena.se). Antwerp, Barcelona, Lisbon, Vienna, Zagreb and Zurich are reported in the press but were not on an official page, so they are left out until they are.

Aaron Chen's Brisbane QPAC nights (10 and 11 Dec) now link to the QPAC encore page, which is where his official site points.

New city pin: Amsterdam. Tests that counted all Gervais rows as UK rows now count `country: "UK"` only. Seed key `v16` → `v17`.

Nabil said he doesn't need a human in the loop for updating dates, so this PR is merged without waiting for him.

## 2026-11-17 — Navy microphone favicon and title mark

Nabil asked for a favicon that fits the redesign: a microphone in the site's blue. The old icon was a lime studio mic on near-black from the first palette. The first draft put a navy mic on a bone tile; he read the bone as yellow and asked for the site's blue and white only, the mic next to the title too, and smooth transparent edges.

The icon is a tilted handheld stage mic in navy `#0e1630` on a transparent background, with a white keyline so it still shows on dark tabs. `favicon.svg` also carries a `prefers-color-scheme: dark` rule, so browsers that honour it in SVG favicons draw a plain white mic on dark tabs instead. Every PNG is rendered straight from the SVG at its own size (no downscaling) with anti-aliased alpha: `favicon.ico` (16, 32, 48), `favicon-32.png`, `icon-512.png`. `apple-touch-icon.png` (180) has a solid white background with a navy mic, since iOS fills transparency with black.

The same mic sits before the "Comedian Tracker" wordmark (`src/components/MicIcon.tsx`), 1em tall and drawn in `currentColor`, so it takes the title's ink: bone on navy in dark mode, navy in light mode. Preview: [docs/images/favicon-preview.png](images/favicon-preview.png).

## 2026-11-17 — City suggestions use the map's place logic

Nabil asked for the city search to autocomplete, using the same destination logic as the map. Suggestions come from the tracker's own `data/cities.json` places, grouped the way the map pins shows (`placeForShow`), rather than from Google Places Autocomplete: every suggestion then has nights behind it, the counts match what the map shows, and no extra Google API or key change is needed.

The text filter now matches the same way. It used to match any substring, so "la" brought up Atlanta, Portland and Orlando, and "Birmingham, AL" also showed Birmingham, England. Exact place names keep only that place, and partial text matches the start of a word. `findExact` now prefers a place's own name over another place's alias (Phoenix over Mesa's `phoenix` alias); no seed pin moved. The trip checker gets the same box, limited to places with a night in the chosen dates. No seed data changed, so no seed-key bump.

## 2026-11-17 — Add Bobby Lee, Andrew Santino and Theo Von

Nabil asked for Bobby Lee, Andrew Santino and Theo Von. They join the end of the roster in that order.

Andrew Santino has 15 nights from his official site, andrewsantino.com: Milwaukee Improv 5–6 Feb, Palm Beach Improv 19–20 Feb, Miami Improv 26–27 Feb, Comedy on State Madison 5–6 Mar, Funny Bone Columbus 12–13 Mar, Comedy Works Downtown Denver 18–21 Mar, and The Chelsea at The Cosmopolitan Las Vegas 27 Mar 2027. Rows live in `data/andrew-santino-shows.json` (prefix `sa`). Madison and Columbus have no `time` because their ticket pages did not load.

Bobby Lee and Theo Von have no upcoming nights anywhere official right now, so they are on the roster with none rather than with guessed dates. Theo Von's tour page says new dates are coming soon. Bobby Lee's Live Nation page lists no upcoming shows, and his own site refuses automated fetches.

New city pins: Milwaukee, West Palm Beach. Seed key `v17` → `v18`.

## 2026-11-17 — Google Analytics

Nabil asked for Google Analytics on the site. GA4's gtag.js is added from `src/lib/analytics.ts` with the measurement ID from the build-time env var `VITE_GA_MEASUREMENT_ID`. The ID (`G-7674VEF3BQ`) is public, so it sits in `pages.yml` as a default; a repo secret of the same name overrides it. It loads only in production builds and only with a well-formed `G-` ID, so local dev and forks without the secret send nothing. No router, so the default page view on load covers it. No seed data changed, so no seed-key bump.

## 2026-11-17 — Microsoft Clarity

Nabil asked to add Microsoft Clarity. The project ID is a build-time env var, `VITE_CLARITY_PROJECT_ID`, set in `.github/workflows/pages.yml` (project `zf9s1pvnn4`; the ID is public, since it ships in the page). A repo Actions secret of the same name overrides it. The tag loads only in production builds and does nothing when the ID is empty, so local dev sends no data. `src/lib/clarity.ts` adds Clarity's official async script tag and queue stub directly rather than pasting the inline snippet into `index.html`, so the ID can come from the build and be checked before use.

## 2026-11-19 — Weekly tour date check: 17 new nights, 7 start times

The Thursday check found new nights for three comedians, each confirmed on an official page:

- Ricky Gervais, 10 more 2027 Legend nights from the Live Nation US artist page and each night's Live Nation event page: Antwerp Lotto Arena 23 Jan, Badalona Olímpic Arena 27 Feb, Lisbon MEO Arena 19 Mar, New York Radio City Music Hall 9–10 Apr, Chicago United Center 12 Apr, Vienna Wiener Stadthalle 24 Apr, Zagreb Arena Zagreb 19 Jun, Zurich Hallenstadion 17 Jul, Toronto Scotiabank Arena 14 Aug. All 19:30 except Zagreb (no time yet). Amsterdam 2 Jul gets its 19:30 start.
- Chris D'Elia, HBG Comedy Zone, New Cumberland PA, 21–23 May 2027 (chrisdelia.com). Only 22 May has a time: the hub and the club page disagree on 21 and 23 May, so those stay untimed rather than guessed.
- Zarna Garg, Chicago The Vic Theatre 19 Feb and Nashville Zanies 6–8 May 2027 (zarnagarg.com/tickets). Portland ME 23 Jan now starts at 19:00.

Start times filled in from venue pages: Mo Amer Honolulu 12 Dec 18:30 (ticket link moved to the early show), Andrew Santino Columbus 12–13 Mar, Andrew Schulz Raleigh 4–5 Dec and Columbus 11–12 Dec. Nothing was removed.

New city pins: Antwerp, Badalona, Lisbon, Zagreb, Zurich, New Cumberland; `wien` alias on Vienna. Tests that read the Gervais non-UK rows as "Europe" now list them by id. Seed key `v18` → `v19`.

Nabil said he doesn't need a human in the loop for updating dates, so this PR is merged without waiting for him.
