import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import type { Comedian, Show } from "../types";
import { coordsForShow } from "../lib/geo";
import { cityAndRegion } from "../lib/display";
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

// One pin colour for everyone, so the page stays blue and white. Overlapping
// pins build up where a city is busy; the popup says who it is.
function pinIcon(theme: "dark" | "light"): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 5.5,
    fillColor: theme === "dark" ? "#a9c1ff" : "#2148b8",
    fillOpacity: 0.85,
    strokeColor: theme === "dark" ? "#0e1630" : "#ffffff",
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
    backgroundColor: theme === "dark" ? "#0b1226" : "#eef2fa",
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
      <MapFallback title="The map didn’t load">
        <p>Every night is still in the listings below.</p>
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
            icon={pinIcon(theme)}
            title={`${comedian?.name ?? "Unknown"}, ${marker.show.venue}`}
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
              {active.show.venue}, {cityAndRegion(active.show)}
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
    <section className="map-section" aria-label="Map of upcoming nights">
      {apiKey ? (
        <GoogleMapCanvas
          apiKey={apiKey}
          shows={shows}
          comedians={comedians}
          theme={theme}
        />
      ) : (
        // Setup steps for the key live in docs/OPERATIONS.md, not on the page.
        <MapFallback title="No map here">
          <p>Every night is still in the listings below.</p>
        </MapFallback>
      )}
      <p className="map-caption">
        {plotted.length} {plotted.length === 1 ? "night" : "nights"} in {cities}{" "}
        {cities === 1 ? "city" : "cities"}. Tap a pin for the venue and tickets.
        {missing > 0 ? ` ${missing} not pinned yet.` : ""}
      </p>
    </section>
  );
}
