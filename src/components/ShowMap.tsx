import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Comedian, Show } from "../types";
import { coordsForShow } from "../lib/geo";
import { formatShowDate } from "../lib/filters";
import "leaflet/dist/leaflet.css";

type Props = {
  shows: Show[];
  comedians: Comedian[];
};

function pinIcon(color: string) {
  return L.divIcon({
    className: "pin",
    html: `<span style="background:${color};--pin:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function FitShows({ shows }: { shows: Show[] }) {
  const map = useMap();
  const points = useMemo(
    () =>
      shows
        .map(coordsForShow)
        .filter((c): c is { lat: number; lng: number } => Boolean(c)),
    [shows],
  );

  useEffect(() => {
    if (points.length === 0) {
      map.setView([39.5, -45], 3);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 6);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.18));
  }, [map, points]);

  return null;
}

function offsetFor(index: number, total: number) {
  if (total <= 1) return { lat: 0, lng: 0 };
  const angle = (index / total) * Math.PI * 2;
  return {
    lat: Math.cos(angle) * 0.08,
    lng: Math.sin(angle) * 0.08,
  };
}

export function ShowMap({ shows, comedians }: Props) {
  const byId = Object.fromEntries(comedians.map((c) => [c.id, c]));
  const grouped = new Map<string, Show[]>();
  for (const show of shows) {
    const key = `${show.city.toLowerCase()}|${show.comedianId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), show]);
  }

  const markers = [...grouped.values()].flatMap((group) =>
    group.map((show, index) => {
      const base = coordsForShow(show);
      if (!base) return null;
      const delta = offsetFor(index, group.length);
      return { show, lat: base.lat + delta.lat, lng: base.lng + delta.lng };
    }),
  );

  const plotted = markers.filter(Boolean).length;
  const missing = shows.length - plotted;

  return (
    <section className="panel map-wrap">
      <div className="map-head">
        <div>
          <h2>Map</h2>
          <p className="lede">
            Color-coded pins on OpenStreetMap / Carto.
            {missing > 0
              ? ` ${missing} show${missing === 1 ? "" : "s"} skipped — city not in the static lat/lng table.`
              : ""}
          </p>
        </div>
      </div>
      <div className="leaflet-host">
        <MapContainer
          center={[39.5, -45]}
          zoom={3}
          scrollWheelZoom
          worldCopyJump
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitShows shows={shows} />
          {markers.map((marker) => {
            if (!marker) return null;
            const comedian = byId[marker.show.comedianId];
            return (
              <Marker
                key={marker.show.id}
                position={[marker.lat, marker.lng]}
                icon={pinIcon(comedian?.color ?? "#c4f542")}
              >
                <Popup>
                  <div className="popup">
                    <h3>
                      {comedian?.name ?? "Unknown"}{" "}
                      {marker.show.sample ? (
                        <span className="badge">Sample</span>
                      ) : null}
                    </h3>
                    <p>{marker.show.title}</p>
                    <p>
                      {marker.show.venue}, {marker.show.city}
                      {marker.show.region ? `, ${marker.show.region}` : ""}
                    </p>
                    <p>{formatShowDate(marker.show.date, marker.show.time)}</p>
                    {marker.show.ticketUrl ? (
                      <p>
                        <a href={marker.show.ticketUrl} target="_blank" rel="noreferrer">
                          Tickets
                        </a>
                      </p>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
