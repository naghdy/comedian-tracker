// Static pages for search engines, built after `vite build` by scripts/build-seo.ts.
// The app itself is one client-rendered page, so these give each comedian a real
// URL with their dates in the HTML and schema.org event data. Pure functions only,
// so they can be tested without a browser.

import type { Comedian, Show } from "../types";
import { clarityTagUrl } from "./clarity";
import { gaMeasurementId } from "./analytics";
import { bareCity, dayParts, formatTime, groupByMonth, placeLabel, tourTitle } from "./display";
import { sortChronological, upcomingShows } from "./filters";

export const SITE_URL = "https://comediantracker.com";
export const SITE_NAME = "Comedian Tracker";
export const SITE_TAGLINE = "Upcoming global tour dates for the comedians you love";

export type SeoOptions = {
  /** Build day, YYYY-MM-DD. Nights before it are left out. */
  today: string;
  gaId?: string;
  clarityId?: string;
};

export function comedianPath(id: string) {
  return `/comedians/${id}/`;
}

export function comedianUrl(id: string) {
  return `${SITE_URL}${comedianPath(id)}`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** JSON for a <script type="application/ld+json"> block, safe against "</script>". */
export function jsonLdScript(data: unknown) {
  const json = JSON.stringify(data, null, 0)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return `<script type="application/ld+json">${json}</script>`;
}

/** Upcoming, real (non-sample) nights for one comedian, in date order. */
export function upcomingFor(shows: Show[], comedianId: string, today: string) {
  return sortChronological(
    upcomingShows(shows, today).filter((s) => s.comedianId === comedianId && !s.sample),
  );
}

const COUNTRY_CODES: Record<string, string> = { US: "US", USA: "US", UK: "GB", CA: "CA" };

function addressCountry(country?: string) {
  if (!country) return undefined;
  return COUNTRY_CODES[country] ?? country;
}

/** "2026–2027", "2027", or "" when there are no dates. */
export function yearsLabel(shows: Show[]) {
  if (!shows.length) return "";
  const first = shows[0].date.slice(0, 4);
  const last = shows[shows.length - 1].date.slice(0, 4);
  return first === last ? first : `${first}–${last}`;
}

function eventName(comedian: Comedian, show: Show) {
  const tour = tourTitle(comedian.name, show.title);
  return tour ? `${comedian.name}: ${tour}` : comedian.name;
}

/** schema.org ComedyEvent for one night. Only fields the seed actually has. */
export function eventJsonLd(comedian: Comedian, show: Show) {
  const address: Record<string, string> = { "@type": "PostalAddress", addressLocality: bareCity(show) };
  if (show.region) address.addressRegion = show.region;
  const country = addressCountry(show.country);
  if (country) address.addressCountry = country;

  const event: Record<string, unknown> = {
    "@type": "ComedyEvent",
    name: eventName(comedian, show),
    startDate: show.time ? `${show.date}T${show.time}` : show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: show.venue, address },
    performer: { "@type": "Person", name: comedian.name },
    url: comedianUrl(comedian.id),
  };
  if (show.ticketUrl) event.offers = { "@type": "Offer", url: show.ticketUrl };
  return event;
}

function analyticsTags(opts: SeoOptions) {
  const tags: string[] = [];
  const ga = gaMeasurementId(opts.gaId);
  if (ga) {
    tags.push(
      `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script>`,
      `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${ga}");</script>`,
    );
  }
  const clarity = clarityTagUrl(opts.clarityId);
  if (clarity) {
    tags.push(
      `<script>window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};</script>`,
      `<script async src="${clarity}"></script>`,
    );
  }
  return tags.join("\n    ");
}

// Same palette and type as src/index.css: navy and white with one blue,
// a serif for names and headings, dark by default, light if the visitor
// picked it on the main page (shared localStorage key).
const PAGE_CSS = `
:root,:root[data-theme="dark"]{color-scheme:dark;--bg:#0e1630;--ink:#eef2fb;--ink-2:#b6bfd8;--ink-3:#8994b3;--accent:#8cafff;--rule:rgba(238,242,251,.12);--rule-strong:rgba(238,242,251,.28);--btn-bg:#eef2fb;--btn-fg:#0e1630}
:root[data-theme="light"]{color-scheme:light;--bg:#fff;--ink:#0e1630;--ink-2:#47506f;--ink-3:#69728f;--accent:#2148b8;--rule:rgba(14,22,48,.12);--rule-strong:rgba(14,22,48,.3);--btn-bg:#0e1630;--btn-fg:#fff}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "Public Sans",ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:.2em}
.wrap{max-width:880px;margin:0 auto;padding:0 clamp(16px,4vw,48px) 64px}
.bar{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:22px 0 14px;border-bottom:1px solid var(--rule-strong)}
.brand{display:inline-flex;align-items:center;gap:8px;font:650 22px/1.1 "Source Serif 4",Georgia,serif;letter-spacing:-.01em;text-decoration:none}
.brand svg{width:1.05em;height:1.05em;color:var(--accent)}
.bar a.home{color:var(--ink-2);font-size:14px}
h1{font:600 clamp(34px,6vw,56px)/1.05 "Source Serif 4",Georgia,serif;letter-spacing:-.02em;margin:36px 0 12px}
.lede{color:var(--ink-2);max-width:36em;margin:0 0 20px;font:400 19px/1.4 "Source Serif 4",Georgia,serif}
.actions{display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin:0 0 32px}
.btn{display:inline-block;padding:10px 18px;border-radius:2px;background:var(--btn-bg);color:var(--btn-fg);font-weight:600;text-decoration:none}
.btn-quiet{padding:0;background:none;color:var(--ink-2);font-weight:500;text-decoration:underline}
h2{position:sticky;top:0;background:var(--bg);font:600 19px/1.2 "Source Serif 4",Georgia,serif;margin:32px 0 0;padding:10px 0 8px;border-bottom:1px solid var(--rule-strong)}
h2 span{font-weight:400;color:var(--ink-3)}
ol{list-style:none;margin:0;padding:0}
li.row{display:grid;grid-template-columns:64px 1fr auto;gap:18px;align-items:baseline;padding:12px 0;border-bottom:1px solid var(--rule)}
.date{margin:0;line-height:1.1}
.date small{display:block;color:var(--ink-3);font-size:12px;font-weight:600}
.date strong{font:500 26px/1 "Source Serif 4",Georgia,serif}
.where p{margin:0}
.venue{font-weight:500}
.place{color:var(--ink-2);font-size:14px}
.tickets{font-weight:600;font-size:14px;white-space:nowrap;color:var(--accent);text-decoration:underline}
.empty{color:var(--ink-2)}
.others{margin-top:48px}
.others h2{position:static}
.others ul{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}
.foot{margin-top:48px;color:var(--ink-3);font-size:13px}
`.trim();

const THEME_SCRIPT = `<script>try{var t=localStorage.getItem("comedian-tracker:theme");if(t!=="light"&&t!=="dark")t="dark";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}</script>`;

const MIC_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g fill="currentColor" transform="translate(16 16) scale(1.2) translate(-17 -16.4) rotate(35 16 17)"><circle cx="16" cy="9.6" r="6.4"/><rect x="11.6" y="16.6" width="8.8" height="2.2" rx="0.6"/><path d="M12.3 19.6h7.4l-1.9 9.1a1.2 1.2 0 0 1-1.2 1h-1.2a1.2 1.2 0 0 1-1.2-1Z"/></g></svg>`;

type PageParts = {
  title: string;
  description: string;
  canonical: string;
  body: string;
  jsonLd?: unknown;
  noindex?: boolean;
};

function page(parts: PageParts, opts: SeoOptions) {
  const t = escapeHtml(parts.title);
  const d = escapeHtml(parts.description);
  const c = escapeHtml(parts.canonical);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    ${parts.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${c}" />`}
    <meta name="theme-color" content="#0e1630" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${c}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..600&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
    ${THEME_SCRIPT}
    <style>${PAGE_CSS}</style>
    ${analyticsTags(opts)}
    ${parts.jsonLd ? jsonLdScript(parts.jsonLd) : ""}
  </head>
  <body>
    <div class="wrap">
      <header class="bar">
        <a class="brand" href="/">${MIC_SVG}${SITE_NAME}</a>
        <a class="home" href="/">All dates and the map</a>
      </header>
${parts.body}
      <footer class="foot">
        <p>Dates come from official tour pages and venue listings, checked weekly.</p>
      </footer>
    </div>
  </body>
</html>
`;
}

function cityList(shows: Show[], limit: number) {
  const seen: string[] = [];
  for (const s of shows) {
    if (!seen.includes(s.city)) seen.push(s.city);
  }
  return { cities: seen.slice(0, limit), total: seen.length };
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function comedianDescription(comedian: Comedian, shows: Show[]) {
  if (!shows.length) {
    return `${comedian.name} has no upcoming shows announced right now. Check back here for new tour dates, venues and ticket links.`;
  }
  const { cities, total } = cityList(shows, 3);
  const where = total > cities.length ? `${cities.join(", ")} and more` : joinNames(cities);
  const n = shows.length;
  return `${comedian.name} tour dates: ${n} upcoming ${n === 1 ? "show" : "shows"} in ${where}. Venues, times and ticket links, checked weekly against official tour pages.`;
}

function othersBlock(all: Comedian[], currentId: string | null) {
  const links = all
    .filter((c) => c.id !== currentId)
    .map((c) => `<li><a href="${comedianPath(c.id)}">${escapeHtml(c.name)}</a></li>`)
    .join("");
  return `      <nav class="others" aria-labelledby="others-title">
        <h2 id="others-title">${currentId ? "More comedians" : "Comedians"}</h2>
        <ul>${links}</ul>
      </nav>`;
}

function rowsHtml(comedian: Comedian, shows: Show[]) {
  return groupByMonth(shows)
    .map((group) => {
      const rows = group.shows
        .map((show) => {
          const { day, weekday } = dayParts(show.date);
          const time = formatTime(show.time);
          const tour = tourTitle(comedian.name, show.title);
          const tickets = show.ticketUrl
            ? `<a class="tickets" href="${escapeHtml(show.ticketUrl)}" target="_blank" rel="noopener noreferrer">Tickets</a>`
            : "";
          return `          <li class="row">
            <p class="date"><small>${weekday}</small><strong>${day}</strong></p>
            <div class="where">
              <p class="venue">${escapeHtml(show.venue)}</p>
              <p class="place">${escapeHtml(placeLabel(show))}${time ? ` · ${time}` : ""}${tour ? ` · ${escapeHtml(tour)}` : ""}</p>
            </div>
            ${tickets}
          </li>`;
        })
        .join("\n");
      const [month, year] = [group.label.replace(/ \d{4}$/, ""), group.label.slice(-4)];
      return `      <h2>${month} <span>${year}</span></h2>
      <ol>
${rows}
      </ol>`;
    })
    .join("\n");
}

/** One comedian's page: their upcoming nights as HTML plus event data. */
export function comedianPageHtml(
  comedian: Comedian,
  allShows: Show[],
  roster: Comedian[],
  opts: SeoOptions,
) {
  const shows = upcomingFor(allShows, comedian.id, opts.today);
  const years = yearsLabel(shows);
  const title = `${comedian.name} Tour Dates${years ? ` ${years}` : ""} | ${SITE_NAME}`;
  const description = comedianDescription(comedian, shows);
  const name = escapeHtml(comedian.name);

  const { total } = cityList(shows, 0);
  const lede = shows.length
    ? `${shows.length} upcoming ${shows.length === 1 ? "night" : "nights"} in ${total} ${total === 1 ? "city" : "cities"}. Every date is from an official tour page or venue listing.`
    : `No upcoming dates are announced right now. New nights show up here once they're on an official tour page.`;

  const actions = [
    shows.length
      ? `<a class="btn" href="/?comedian=${encodeURIComponent(comedian.id)}">See ${name} on the map</a>`
      : "",
    comedian.tourUrl
      ? `<a class="btn btn-quiet" href="${escapeHtml(comedian.tourUrl)}" target="_blank" rel="noopener noreferrer">Their official tour page</a>`
      : "",
  ]
    .filter(Boolean)
    .join("\n        ");

  const body = `      <main>
        <h1>${name} tour dates</h1>
        <p class="lede">${lede}</p>
        <div class="actions">
        ${actions}
        </div>
${shows.length ? rowsHtml(comedian, shows) : `      <p class="empty">No dates announced right now.</p>`}
      </main>
${othersBlock(roster, comedian.id)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Comedians", item: `${SITE_URL}/comedians/` },
          { "@type": "ListItem", position: 3, name: comedian.name, item: comedianUrl(comedian.id) },
        ],
      },
      ...shows.map((show) => eventJsonLd(comedian, show)),
    ],
  };

  return page({ title, description, canonical: comedianUrl(comedian.id), body, jsonLd }, opts);
}

/** Upcoming night counts per comedian, busiest first (ties keep roster order). */
export function rosterByNights(roster: Comedian[], shows: Show[], today: string) {
  return roster
    .map((c, index) => ({ c, index, n: upcomingFor(shows, c.id, today).length }))
    .sort((a, b) => b.n - a.n || a.index - b.index);
}

/** /comedians/: every comedian with a count, linking to their page. */
export function comediansIndexHtml(roster: Comedian[], shows: Show[], opts: SeoOptions) {
  const items = rosterByNights(roster, shows, opts.today)
    .map(
      ({ c, n }) => `          <li class="row">
            <p class="date"><strong>${n || "–"}</strong><small>${n === 1 ? "night" : "nights"}</small></p>
            <div class="where"><p class="venue"><a href="${comedianPath(c.id)}">${escapeHtml(c.name)} tour dates</a></p></div>
          </li>`,
    )
    .join("\n");
  const body = `      <main>
        <h1>Comedians on tour</h1>
        <p class="lede">Upcoming stand-up tour dates for ${roster.length} comedians, from official tour pages and venue listings.</p>
        <ol>
${items}
        </ol>
      </main>`;
  return page(
    {
      title: `Comedians on Tour: Upcoming Stand-Up Dates | ${SITE_NAME}`,
      description: `Tour dates for ${rosterByNights(roster, shows, opts.today)
        .slice(0, 4)
        .map((e) => e.c.name)
        .join(", ")} and more comedians, with venues, times and ticket links.`,
      canonical: `${SITE_URL}/comedians/`,
      body,
    },
    opts,
  );
}

export function notFoundHtml(roster: Comedian[], opts: SeoOptions) {
  const body = `      <main>
        <h1>Not on the bill</h1>
        <p class="lede">There's no page at this address. The full list of dates and the map are on the main page.</p>
        <div class="actions"><a class="btn" href="/">Go to all dates</a></div>
      </main>
${othersBlock(roster, null)}`;
  return page(
    {
      title: `Page not found | ${SITE_NAME}`,
      description: SITE_TAGLINE,
      canonical: `${SITE_URL}/`,
      body,
      noindex: true,
    },
    opts,
  );
}

export function sitemapXml(roster: Comedian[], lastmod: string) {
  const urls = [`${SITE_URL}/`, `${SITE_URL}/comedians/`, ...roster.map((c) => comedianUrl(c.id))];
  const entries = urls
    .map((loc) => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

/** Structured data and crawlable links for the app's own index.html. */
export function homeHeadAndNoscript(roster: Comedian[], shows: Show[], today: string) {
  const ordered = rosterByNights(roster, shows, today);
  const busiest = ordered.filter((e) => e.n > 0).slice(0, 4).map((e) => e.c.name);
  const description = busiest.length
    ? `${SITE_TAGLINE}: ${busiest.join(", ")} and more, with venues, times and ticket links.`
    : SITE_TAGLINE;

  const jsonLd = jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_TAGLINE,
      },
      {
        "@type": "ItemList",
        name: "Comedians on tour",
        itemListElement: ordered.map(({ c }, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${c.name} tour dates`,
          url: comedianUrl(c.id),
        })),
      },
    ],
  });

  const links = ordered
    .map(({ c }) => `<li><a href="${comedianPath(c.id)}">${escapeHtml(c.name)} tour dates</a></li>`)
    .join("");
  const noscript = `<noscript><p>${escapeHtml(SITE_TAGLINE)}.</p><ul>${links}</ul></noscript>`;

  return { description, jsonLd, noscript };
}
