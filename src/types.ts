export type Comedian = {
  id: string;
  name: string;
  aliases?: string[];
  color: string;
  tourUrl?: string;
  notes?: string;
};

export type Show = {
  id: string;
  comedianId: string;
  title: string;
  venue: string;
  city: string;
  region?: string;
  country?: string;
  date: string;
  time?: string;
  ticketUrl?: string;
  sample?: boolean;
  notes?: string;
  source?: "listed" | "sample" | "user";
};

export type CityCoord = {
  city: string;
  lat: number;
  lng: number;
  aliases?: string[];
};

export type TripQuery = {
  city: string;
  start: string;
  end: string;
};

export type StoredState = {
  comedians: Comedian[];
  shows: Show[];
};
