// Runs after `vite build` (see package.json). Writes the search pages into dist/:
// /comedians/<id>/ for each comedian, /comedians/, 404.html and sitemap.xml, and
// adds structured data, a fuller description and crawlable links to dist/index.html.
// Nights before the build day are left out, so the Pages workflow rebuilds daily.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_COMEDIANS, SEED_SHOWS } from "../src/lib/seedData";
import {
  comedianPageHtml,
  comediansIndexHtml,
  escapeHtml,
  homeHeadAndNoscript,
  notFoundHtml,
  sitemapXml,
  SITE_TAGLINE,
  type SeoOptions,
} from "../src/lib/seo";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

function write(rel: string, html: string) {
  const file = join(dist, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

/** Newest `generatedAt` across the seed files: when the dates last changed. */
function dataLastModified() {
  const dataDir = join(root, "data");
  let newest = "";
  for (const name of readdirSync(dataDir)) {
    if (!name.endsWith(".json")) continue;
    const parsed = JSON.parse(readFileSync(join(dataDir, name), "utf8")) as { generatedAt?: unknown };
    if (typeof parsed.generatedAt === "string" && parsed.generatedAt > newest) newest = parsed.generatedAt;
  }
  return newest;
}

const today = process.env.SEO_TODAY ?? new Date().toISOString().slice(0, 10);
const opts: SeoOptions = {
  today,
  gaId: process.env.VITE_GA_MEASUREMENT_ID,
  clarityId: process.env.VITE_CLARITY_PROJECT_ID,
};
const roster = SEED_COMEDIANS;
const shows = SEED_SHOWS;

for (const comedian of roster) {
  write(`comedians/${comedian.id}/index.html`, comedianPageHtml(comedian, shows, roster, opts));
}
write("comedians/index.html", comediansIndexHtml(roster, shows, opts));
write("404.html", notFoundHtml(roster, opts));
write("sitemap.xml", sitemapXml(roster, dataLastModified() || today));

// The app's own page: fuller description, structured data, links for crawlers
// that don't run JavaScript. The visible app is untouched.
const indexFile = join(dist, "index.html");
let index = readFileSync(indexFile, "utf8");
const home = homeHeadAndNoscript(roster, shows, today);
const tagline = `<meta name="description" content="${escapeHtml(SITE_TAGLINE)}" />`;
if (!index.includes(tagline)) throw new Error("index.html description tag not found");
index = index.replace(tagline, `<meta name="description" content="${escapeHtml(home.description)}" />`);
index = index.replace("</head>", `  ${home.jsonLd}\n  </head>`);
index = index.replace('<div id="root"></div>', `${home.noscript}\n    <div id="root"></div>`);
writeFileSync(indexFile, index);

console.log(`SEO pages: ${roster.length} comedians, sitemap, 404 (dates from ${today})`);
