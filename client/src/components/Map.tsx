import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: 'pickup' | 'drop' | 'car' | 'me';
  label?: string;
}

// Inline SVG glyphs (white, drawn inside the colored pin/badge).
const GLYPH: Record<MapMarker['kind'], string> = {
  pickup: '<circle cx="12" cy="12" r="3.2" fill="#fff"/>',
  drop: '<path d="M12 6.5a3.2 3.2 0 0 0-3.2 3.2c0 2.2 3.2 5 3.2 5s3.2-2.8 3.2-5A3.2 3.2 0 0 0 12 6.5Z" fill="#fff"/>',
  car: '<path d="M17.5 15.2h1.3c.4 0 .7-.3.7-.7v-2c0-.6-.4-1.1-1-1.3-1.2-.4-3-.8-3-.8s-.9-.9-1.5-1.5c-.3-.3-.7-.4-1.2-.4H7.3c-.4 0-.8.2-.9.6l-.9 1.9c-.2.2-.3.5-.3.8v2.2c0 .4.3.7.7.7h.9" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="15.2" r="1.3" fill="#fff"/><circle cx="15" cy="15.2" r="1.3" fill="#fff"/>',
  me: '<circle cx="12" cy="9.5" r="2.4" fill="#fff"/><path d="M8 16a4 4 0 0 1 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
};

function icon(kind: MapMarker['kind']) {
  const bg =
    kind === 'car'
      ? '#0f172a'
      : kind === 'pickup'
      ? '#16a34a'
      : kind === 'drop'
      ? '#f1543f'
      : '#2563eb';
  return L.divIcon({
    className: 'crab-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff"><svg viewBox="0 0 24 24" width="20" height="20" style="transform:rotate(45deg)">${GLYPH[kind]}</svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
  });
}

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ markers, focus }: { markers: MapMarker[]; focus?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.setView(focus, Math.max(map.getZoom(), 14), { animate: true });
      return;
    }
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14, { animate: true });
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), focus?.[0], focus?.[1]]);
  return null;
}

interface Props {
  center?: [number, number];
  markers: MapMarker[];
  line?: { from: [number, number]; to: [number, number] } | null;
  onClick?: (lat: number, lng: number) => void;
  fit?: boolean;
  focus?: [number, number];
  className?: string;
}

export default function Map({
  center = [14.5995, 120.9842],
  markers,
  line,
  onClick,
  fit = true,
  focus,
  className,
}: Props) {
  const path = useMemo(
    () => (line ? [line.from, line.to] : null),
    [line?.from?.[0], line?.from?.[1], line?.to?.[0], line?.to?.[1]]
  );

  return (
    <div className={`relative overflow-hidden ${className ?? 'h-full w-full'}`}>
      <MapBackdrop />
      <MapContainer
        center={center}
        zoom={13}
        className="absolute inset-0 h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {onClick && <ClickHandler onClick={onClick} />}
        {path && (
          <Polyline positions={path} pathOptions={{ color: '#f1543f', weight: 5, opacity: 0.9 }} />
        )}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={icon(m.kind)} />
        ))}
        {fit && <FitBounds markers={markers} focus={focus} />}
      </MapContainer>
    </div>
  );
}

/**
 * A hand-designed vector map used as the base layer. Real raster tiles paint on
 * top of it when reachable; when they aren't (offline / blocked CDN), this still
 * reads as a real, modern map instead of a blank canvas.
 */
function MapBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 480 960"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="crab-streets" width="78" height="78" patternUnits="userSpaceOnUse">
          <path d="M0 0H78" stroke="#ffffff" strokeWidth="8" />
          <path d="M0 0V78" stroke="#ffffff" strokeWidth="8" />
        </pattern>
        <pattern id="crab-lanes" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M0 0H26" stroke="#eef2f8" strokeWidth="2.5" />
          <path d="M0 0V26" stroke="#eef2f8" strokeWidth="2.5" />
        </pattern>
      </defs>

      {/* land */}
      <rect width="480" height="960" fill="#e6ecf4" />
      {/* block subdivisions + street grid */}
      <rect width="480" height="960" fill="url(#crab-lanes)" />
      <rect width="480" height="960" fill="url(#crab-streets)" />

      {/* avenues (wider white with soft casing) */}
      <g strokeLinecap="round">
        <path d="M-40 250H520" stroke="#dbe3ee" strokeWidth="20" />
        <path d="M-40 250H520" stroke="#ffffff" strokeWidth="13" />
        <path d="M120 -40V1000" stroke="#dbe3ee" strokeWidth="20" />
        <path d="M120 -40V1000" stroke="#ffffff" strokeWidth="13" />
        <path d="M-60 -40L560 720" stroke="#dbe3ee" strokeWidth="22" />
        <path d="M-60 -40L560 720" stroke="#ffffff" strokeWidth="14" />
      </g>

      {/* park */}
      <rect x="255" y="560" width="185" height="150" rx="26" fill="#d6e9cf" />
      <rect x="255" y="560" width="185" height="150" rx="26" fill="none" stroke="#c4dcbb" strokeWidth="3" />

      {/* river across a corner */}
      <path d="M-40 780 C 90 720 150 900 300 880 C 400 866 450 940 520 900 L520 1000 -40 1000 Z" fill="#c4ddf3" />
      <path d="M-40 780 C 90 720 150 900 300 880 C 400 866 450 940 520 900" fill="none" stroke="#b2d2ee" strokeWidth="3" />
      {/* bridges */}
      <path d="M120 812V872" stroke="#ffffff" strokeWidth="13" />
    </svg>
  );
}
