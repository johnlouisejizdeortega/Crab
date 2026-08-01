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

const EMOJI: Record<MapMarker['kind'], string> = {
  pickup: '🟢',
  drop: '📍',
  car: '🚗',
  me: '🧍',
};

function icon(kind: MapMarker['kind']) {
  const bg =
    kind === 'car' ? '#0f172a' : kind === 'pickup' ? '#00c46f' : kind === 'drop' ? '#ef4444' : '#3b82f6';
  return L.divIcon({
    className: 'crab-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff"><span style="transform:rotate(45deg);font-size:16px;line-height:1">${EMOJI[kind]}</span></div>`,
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
    <MapContainer
      center={center}
      zoom={13}
      className={className ?? 'h-full w-full'}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {onClick && <ClickHandler onClick={onClick} />}
      {path && (
        <Polyline positions={path} pathOptions={{ color: '#00c46f', weight: 5, opacity: 0.8 }} />
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={icon(m.kind)} />
      ))}
      {fit && <FitBounds markers={markers} focus={focus} />}
    </MapContainer>
  );
}
