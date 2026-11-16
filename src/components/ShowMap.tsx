import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import type { Comedian, Show } from "../types";
import { coordsForShow } from "../lib/geo";
import { formatShowDate } from "../lib/filters";
import { DARK_MAP_STYLES, LIGHT_MAP_STYLES } from "../lib/mapStyles";

type Props = {
  shows: Show[];
  comedians: Comedian[];
  theme: "dark" | "light";
};

type Plotted = {
  show: Show;
  lat: number;
  lng: number;
};

const DEFAULT_CENTER = { lat: 39.5, lng: -45 };

function offsetFor(index: number, total: number) {
  if (total <= 1) return { lat: 0, lng: 0 };
  const angle = (index / total) * Math.PI * 2;
  return {
    lat: Math.cos(angle) * 0.08,
    lng: Math.sin(angle) * 0.08,
  };
}

function plotShows(shows: Show[]): Plotted[] {
  const grouped = new Map<string, Show[]>();
  for (const show of shows) {
    const key = `${show.city.toLowerCase()}|${show.comedianId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), show]);
  }

  return [...grouped.values()].flatMap((group) =>
    group.flatMap((show, index) => {
      const base = coordsForShow(show);
      if (!base) return [];
      const delta = offsetFor(index, group.length);
      return [{ show, lat: base.lat + delta.lat, lng: base.lng + delta.lng }];
    }),
  );
}

function pinIcon(color: string, theme: "dark" | "light"): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 6.5,
    fillColor: color,
    fillOpacity: 0.95,
    strokeColor: theme === "dark" ? "#14161b" : "#f5f6f7",
    strokeWeight: 1.5,
  };
}

function fitMap(map: google.maps.Map, markers: Plotted[]) {
  if (markers.length === 0) {
    map.setCenter(DEFAULT_CENTER);
    map.setZoom(3);
    return;
  }
  if (markers.length === 1) {
    map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
    map.setZoom(6);
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  for (const marker of markers) {
    bounds.extend({ lat: marker.lat, lng: marker.lng });
  }
  map.fitBounds(bounds, 56);
}

function mapOptions(theme: "dark" | "light"): google.maps.MapOptions {
  return {
    styles: theme === "dark" ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
    backgroundColor: theme === "dark" ? "#111318" : "#e9ebee",
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: "greedy",
  };
}

function MapFallback({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="map-host map-fallback" role="status">
      <p>
        <strong>{title}</strong>
      </p>
      {children}
    </div>
  );
}

function GoogleMapCanvas({
  apiKey,
  shows,
  comedians,
  theme,
}: Props & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "comedian-tracker-maps",
    googleMapsApiKey: apiKey,
  });
  const byId = useMemo(
    () => Object.fromEntries(comedians.map((c) => [c.id, c])),
    [comedians],
  );
  const markers = useMemo(() => plotShows(shows), [shows]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const onLoad = useCallback((next: google.maps.Map) => {
    setMap(next);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!map) return;
    fitMap(map, markers);
  }, [map, markers]);

  useEffect(() => {
    if (!map) return;
    map.setOptions(mapOptions(theme));
  }, [map, theme]);

  if (loadError) {
    return (
      <MapFallback title="Google Maps failed to load">
        <p>
          Check that the Maps JavaScript API is enabled and that{" "}
          <code>VITE_GOOGLE_MAPS_API_KEY</code> is valid for this host.
        </p>
      </MapFallback>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-host map-fallback" role="status">
        Loading map…
      </div>
    );
  }

  const active = markers.find((m) => m.show.id === activeId);

  return (
    <GoogleMap
      mapContainerClassName="map-host"
      center={DEFAULT_CENTER}
      zoom={3}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={() => setActiveId(null)}
      options={mapOptions(theme)}
    >
      {markers.map((marker) => {
        const comedian = byId[marker.show.comedianId];
        return (
          <Marker
            key={marker.show.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={pinIcon(comedian?.color ?? "#888888", theme)}
            title={`${comedian?.name ?? "Unknown"} — ${marker.show.title}`}
            onClick={() => setActiveId(marker.show.id)}
          />
        );
      })}
      {active ? (
        <InfoWindow
          position={{ lat: active.lat, lng: active.lng }}
          onCloseClick={() => setActiveId(null)}
        >
          <div className="popup">
            <h3>
              {byId[active.show.comedianId]?.name ?? "Unknown"}{" "}
              {active.show.sample ? <span className="tag">Sample</span> : null}
            </h3>
            <p>{active.show.title}</p>
            <p>
              {active.show.venue}, {active.show.city}
              {active.show.region ? `, ${active.show.region}` : ""}
            </p>
            <p>{formatShowDate(active.show.date, active.show.time)}</p>
            {active.show.ticketUrl ? (
              <p>
                <a href={active.show.ticketUrl} target="_blank" rel="noreferrer">
                  Tickets
                </a>
              </p>
            ) : null}
          </div>
        </InfoWindow>
      ) : null}
    </GoogleMap>
  );
}

export function ShowMap({ shows, comedians, theme }: Props) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const plotted = plotShows(shows);
  const missing = shows.length - plotted.length;
  const cities = new Set(plotted.map((p) => p.show.city.toLowerCase())).size;

  return (
    <section className="section map-section" aria-labelledby="map-title">
      <header className="section-head">
        <h2 id="map-title">On the map</h2>
        <p className="section-meta">
          {plotted.length} {plotted.length === 1 ? "night" : "nights"} in {cities}{" "}
          {cities === 1 ? "city" : "cities"}
          {missing > 0 ? ` · ${missing} not pinned (city not in the table)` : ""}
        </p>
      </header>
      {apiKey ? (
        <GoogleMapCanvas
          apiKey={apiKey}
          shows={shows}
          comedians={comedians}
          theme={theme}
        />
      ) : (
        <MapFallback title="No map in this build">
          <p>
            The Google Maps key isn’t set, so the map is off. Everything else
            works without it.
          </p>
          <details>
            <summary>How to turn it on</summary>
          <ul>
            <li>
              GitHub Pages: repo <strong>Settings → Secrets and variables → Actions</strong>,
              secret name <code>VITE_GOOGLE_MAPS_API_KEY</code>, then re-run{" "}
              <strong>Deploy GitHub Pages</strong>.
            </li>
            <li>
              Local: copy <code>.env.example</code> to <code>.env.local</code> and
              restart <code>npm run dev</code>.
            </li>
          </ul>
          </details>
        </MapFallback>
      )}
    </section>
  );
}
