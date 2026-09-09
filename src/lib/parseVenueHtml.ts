const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

export type ParsedVenueNight = {
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  region?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function monthNum(token: string) {
  return MONTHS[token.slice(0, 3).toLowerCase()] ?? "";
}

/** Unique calendar days from SeatEngine / Helium / Improv club pages. */
export function parseVenueNights(html: string): ParsedVenueNight[] {
  const byDate = new Map<string, ParsedVenueNight>();

  const heading =
    /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),\s+(\d{4})\b/gi;
  for (const match of html.matchAll(heading)) {
    const month = monthNum(match[1]);
    const day = pad(Number(match[2]));
    const date = `${match[3]}-${month}-${day}`;
    if (month && !byDate.has(date)) byDate.set(date, { date });
  }

  const jsonBlocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of jsonBlocks) {
    try {
      const parsed = JSON.parse(block[1] ?? "") as unknown;
      collectJsonLd(parsed, byDate);
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function collectJsonLd(value: unknown, byDate: Map<string, ParsedVenueNight>) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLd(item, byDate);
    return;
  }
  if (typeof value !== "object") return;
  const rec = value as Record<string, unknown>;
  const type = rec["@type"];
  const types = Array.isArray(type) ? type.map(String) : [String(type ?? "")];
  if (types.some((item) => item.toLowerCase() === "event")) {
    const start = typeof rec.startDate === "string" ? rec.startDate : "";
    const date = jsonLdDay(start);
    if (date && !byDate.has(date)) {
      const location = rec.location as Record<string, unknown> | undefined;
      const address = location?.address as Record<string, unknown> | undefined;
      byDate.set(date, {
        date,
        venue: typeof location?.name === "string" ? location.name : undefined,
        city:
          typeof address?.addressLocality === "string"
            ? address.addressLocality
            : undefined,
        region:
          typeof address?.addressRegion === "string"
            ? address.addressRegion
            : undefined,
      });
    }
  }
  if (rec["@graph"]) collectJsonLd(rec["@graph"], byDate);
}

function jsonLdDay(iso: string) {
  if (!iso) return "";
  const dayOnly = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dayOnly && !iso.includes("T")) return dayOnly[1];
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return dayOnly?.[1] ?? "";
  return parsed.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function isClubVenueUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("heliumcomedy.com") ||
      host.includes("improv.com") ||
      host.includes("improvftl.com") ||
      host.includes("summitcitycomedy.com") ||
      host.includes("levitylive.com") ||
      host.includes("funnybone.com") ||
      host.includes("punchline")
    );
  } catch {
    return false;
  }
}
