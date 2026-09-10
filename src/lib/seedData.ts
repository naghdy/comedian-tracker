import type { Comedian, Show } from "../types";
import comedianSeed from "../../data/comedians.json";
import showSeed from "../../data/shows.json";
import jeffArcuriShows from "../../data/jeff-arcuri-shows.json";
import chrisDeliaShows from "../../data/chris-delia-shows.json";

export const SEED_COMEDIANS = comedianSeed.comedians as Comedian[];
export const SEED_SHOWS = [
  ...(showSeed.shows as Show[]),
  ...(jeffArcuriShows.shows as Show[]),
  ...(chrisDeliaShows.shows as Show[]),
];
