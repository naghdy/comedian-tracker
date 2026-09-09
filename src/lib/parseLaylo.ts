const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export type LayloNight = {
  date: string;
  venue: string;
  city: string;
  region?: string;
  country?: string;
  ticketUrl?: string;
  title?: string;
  lat?: number;
  lng?: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** Expand "Stress Factory - Sept 11-12, 2026 - SOLD OUT" into one row per night. */
export function nightsFromLayloTitle(title: string): { venue: string; dates: string[] } | null {
  const match = title.match(
    /^(.+?)\s+-\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:-(\d{1,2}))?,\s+(\d{4})/i,
  );
  if (!match) return null;
  const venue = match[1].trim();
  const month = MONTHS[match[2].toLowerCase()];
  const year = Number(match[5]);
  const startDay = Number(match[3]);
  const endDay = match[4] ? Number(match[4]) : startDay;
  if (!month || !year || !startDay) return null;
  const dates: string[] = [];
  const last = Math.min(endDay, daysInMonth(year, month));
  for (let day = startDay; day <= last; day += 1) {
    dates.push(isoDate(year, month, day));
  }
  return dates.length ? { venue, dates } : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function coords(location: Record<string, unknown>) {
  let lat = Number(location.latitude);
  let lng = Number(location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  const looksLikeUsLng = (value: number) => value < -60 && value > -130;
  const looksLikeUsLat = (value: number) => value > 20 && value < 55;
  if (looksLikeUsLng(lat) && looksLikeUsLat(lng)) {
    const swap = lat;
    lat = lng;
    lng = swap;
  } else if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const swap = lat;
    lat = lng;
    lng = swap;
  }
  return { lat, lng };
}

function regionCode(stateName: string) {
  const map: Record<string, string> = {
    alabama: "AL",
    indiana: "IN",
    "new jersey": "NJ",
    "new york": "NY",
    "north carolina": "NC",
    ohio: "OH",
    texas: "TX",
  };
  return map[stateName.toLowerCase()] || stateName;
}

function cityName(location: Record<string, unknown>) {
  const name = typeof location.name === "string" ? location.name : "";
  const state = asRecord(location.state);
  const stateName = typeof state?.name === "string" ? state.name : "";
  if (name === "Birmingham" && stateName === "Alabama") return "Birmingham, AL";
  return name;
}

export function parseLayloDrop(json: unknown): LayloNight[] {
  const root = asRecord(json);
  if (!root) return [];
  const products = Array.isArray(root.orderedSubProducts)
    ? root.orderedSubProducts
    : [];
  const nights: LayloNight[] = [];
  const seen = new Set<string>();
  for (const item of products) {
    const rec = asRecord(item);
    if (!rec) continue;
    const title = typeof rec.title === "string" ? rec.title : "";
    const parsed = nightsFromLayloTitle(title);
    const location = asRecord(rec.location) ?? {};
    const venue = parsed?.venue || title.split(" - ")[0] || "";
    const city = cityName(location);
    const state = asRecord(location.state);
    const region = typeof state?.name === "string" ? regionCode(state.name) : undefined;
    const countryRec = asRecord(location.country);
    const country =
      typeof countryRec?.name === "string"
        ? countryRec.name === "United States"
          ? "US"
          : countryRec.name
        : "US";
    const ticketUrl = typeof rec.link === "string" ? rec.link.split("?")[0] : undefined;
    const { lat, lng } = coords(location);
    const dates = parsed?.dates ?? [];
    for (const date of dates) {
      const key = `${date}|${venue}|${city}`;
      if (seen.has(key) || !venue || !city) continue;
      seen.add(key);
      nights.push({
        date,
        venue,
        city,
        region,
        country,
        ticketUrl,
        title: venue,
        lat,
        lng,
      });
    }
  }
  return nights.sort((a, b) => a.date.localeCompare(b.date));
}
