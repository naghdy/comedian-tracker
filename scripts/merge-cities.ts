import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type City = { city: string; lat: number; lng: number; aliases?: string[] };

const extra: City[] = [
  { city: "Addison", lat: 32.9618, lng: -96.8292, aliases: ["addison, tx"] },
  { city: "Alpharetta", lat: 34.0754, lng: -84.2941, aliases: ["alpharetta, ga"] },
  { city: "Appleton", lat: 44.2619, lng: -88.4154, aliases: ["appleton, wi"] },
  { city: "Atlanta", lat: 33.749, lng: -84.388, aliases: ["atlanta, ga"] },
  { city: "Batavia", lat: 41.85, lng: -88.3126, aliases: ["batavia, il"] },
  { city: "Bensalem", lat: 40.1004, lng: -74.9516, aliases: ["bensalem, pa"] },
  { city: "Berlin", lat: 52.52, lng: 13.405, aliases: ["berlin, germany"] },
  { city: "Brussels", lat: 50.8503, lng: 4.3517, aliases: ["brussels, belgium"] },
  { city: "Buffalo", lat: 42.8864, lng: -78.8784, aliases: ["buffalo, ny"] },
  { city: "Copenhagen", lat: 55.6761, lng: 12.5683, aliases: ["copenhagen, denmark"] },
  { city: "Gothenburg", lat: 57.7089, lng: 11.9746, aliases: ["gothenburg, sweden", "goteborg"] },
  { city: "Hamburg", lat: 53.5511, lng: 9.9937, aliases: ["hamburg, germany"] },
  { city: "Irvine", lat: 33.6846, lng: -117.8265, aliases: ["irvine, ca"] },
  { city: "Naples", lat: 26.142, lng: -81.7948, aliases: ["naples, fl"] },
  { city: "Oslo", lat: 59.9139, lng: 10.7522, aliases: ["storsalen", "storsalen, oslo", "oslo, norway"] },
  { city: "Paris", lat: 48.8566, lng: 2.3522, aliases: ["paris, france"] },
  { city: "Rutherford", lat: 40.8265, lng: -74.1068, aliases: ["rutherford, nj"] },
  { city: "Stockholm", lat: 59.3293, lng: 18.0686, aliases: ["stockholm, sweden"] },
  { city: "Tampa", lat: 27.9506, lng: -82.4572, aliases: ["tampa, fl"] },
  { city: "Tempe", lat: 33.4255, lng: -111.94, aliases: ["tempe, az"] },
  { city: "Tyler", lat: 32.3513, lng: -95.3011, aliases: ["tyler, tx"] },
  { city: "Vienna", lat: 48.2082, lng: 16.3738, aliases: ["vienna, austria"] },
  { city: "Wellington, FL", lat: 26.6587, lng: -80.2414, aliases: ["wellington fl", "wellington, florida"] },
  { city: "Baltimore", lat: 39.2904, lng: -76.6122, aliases: ["baltimore, md"] },
  { city: "Brea", lat: 33.9169, lng: -117.9001, aliases: ["brea, ca"] },
  { city: "Birmingham, AL", lat: 33.5186, lng: -86.8104, aliases: ["birmingham al"] },
  { city: "Cedar Rapids", lat: 41.9779, lng: -91.6656, aliases: ["cedar rapids, ia"] },
  { city: "Charleston", lat: 32.7765, lng: -79.9311, aliases: ["charleston, sc"] },
  { city: "Charlotte", lat: 35.2271, lng: -80.8431, aliases: ["charlotte, nc"] },
  { city: "Cincinnati", lat: 39.1031, lng: -84.512, aliases: ["cincinnati, oh"] },
  { city: "Clearwater", lat: 27.9659, lng: -82.8001, aliases: ["clearwater, fl"] },
  { city: "Dania Beach", lat: 26.0523, lng: -80.1439, aliases: ["fort lauderdale", "dania", "dania beach, fl"] },
  { city: "Des Moines", lat: 41.5868, lng: -93.625, aliases: ["des moines, ia"] },
  { city: "Durham", lat: 35.994, lng: -78.8986, aliases: ["durham, nc"] },
  { city: "El Cajon", lat: 32.7948, lng: -116.9625, aliases: ["el cajon, ca"] },
  { city: "Fort Wayne", lat: 41.0793, lng: -85.1394, aliases: ["fort wayne, in"] },
  { city: "Huntsville", lat: 34.7304, lng: -86.5861, aliases: ["huntsville, al"] },
  { city: "Jacksonville", lat: 30.3322, lng: -81.6557, aliases: ["jacksonville, fl"] },
  { city: "Kansas City", lat: 39.0997, lng: -94.5786, aliases: ["kansas city, mo"] },
  { city: "Knoxville", lat: 35.9606, lng: -83.9207, aliases: ["knoxville, tn"] },
  { city: "Madison", lat: 43.0731, lng: -89.4012, aliases: ["madison, wi"] },
  { city: "Minneapolis", lat: 44.9778, lng: -93.265, aliases: ["minneapolis, mn"] },
  { city: "Nashville", lat: 36.1627, lng: -86.7816, aliases: ["nashville, tn"] },
  { city: "New Brunswick", lat: 40.4862, lng: -74.4518, aliases: ["new brunswick, nj"] },
  { city: "New Orleans", lat: 29.9511, lng: -90.0715, aliases: ["new orleans, la"] },
  { city: "Orlando", lat: 28.5383, lng: -81.3792, aliases: ["orlando, fl"] },
  { city: "Pensacola", lat: 30.4213, lng: -87.2169, aliases: ["pensacola, fl"] },
  { city: "Portland, ME", lat: 43.6591, lng: -70.2568, aliases: ["portland maine", "portland me"] },
  { city: "Providence", lat: 41.824, lng: -71.4128, aliases: ["providence, ri"] },
  { city: "Richmond", lat: 37.5407, lng: -77.436, aliases: ["richmond, va"] },
  { city: "Sacramento", lat: 38.5816, lng: -121.4944, aliases: ["sacramento, ca"] },
  { city: "Saginaw", lat: 43.4195, lng: -83.9508, aliases: ["saginaw, mi"] },
  { city: "San Antonio", lat: 29.4241, lng: -98.4936, aliases: ["san antonio, tx"] },
  { city: "St. Louis", lat: 38.627, lng: -90.1994, aliases: ["st louis", "saint louis", "st. louis, mo"] },
  { city: "Sugar Land", lat: 29.6196, lng: -95.6349, aliases: ["sugarland", "sugar land, tx"] },
  { city: "Tallahassee", lat: 30.4383, lng: -84.2807, aliases: ["tallahassee, fl"] },
  { city: "Tulsa", lat: 36.154, lng: -95.9928, aliases: ["tulsa, ok"] },
  { city: "Victoria", lat: 48.4284, lng: -123.3656, aliases: ["victoria, bc"] },
  { city: "Washington", lat: 38.9072, lng: -77.0369, aliases: ["washington, dc", "dc", "d.c.", "washington dc"] },
  { city: "Westbury", lat: 40.7557, lng: -73.5876, aliases: ["westbury, ny"] },
  { city: "Wichita", lat: 37.6872, lng: -97.3301, aliases: ["wichita, ks"] },
  { city: "Wilmington", lat: 34.2257, lng: -77.9447, aliases: ["wilmington, nc"] },
];

const root = dirname(fileURLToPath(import.meta.url));
const path = resolve(root, "../data/cities.json");
const current = JSON.parse(readFileSync(path, "utf8")) as City[];
const byName = new Map(current.map((city) => [city.city.toLowerCase(), city]));
for (const city of extra) {
  if (!byName.has(city.city.toLowerCase())) byName.set(city.city.toLowerCase(), city);
}
const merged = [...byName.values()].sort((a, b) => a.city.localeCompare(b.city));
const body = merged
  .map((city) => `  ${JSON.stringify(city)}`)
  .join(",\n");
writeFileSync(path, `[\n${body}\n]\n`);
console.log(`Wrote ${merged.length} cities`);
