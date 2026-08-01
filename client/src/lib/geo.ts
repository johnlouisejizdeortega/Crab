import type { Point } from '../types';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(q: string): Promise<Suggestion[]> {
  if (q.trim().length < 3) return [];
  try {
    const res = await fetch(
      `${NOMINATIM}/search?format=json&limit=6&addressdetails=0&q=${encodeURIComponent(q)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((d) => ({
      label: d.display_name as string,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) return shorten(data.display_name);
    }
  } catch {
    /* ignore */
  }
  return `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export function shorten(label: string): string {
  return label.split(',').slice(0, 3).join(',').trim();
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getCurrentPosition(): Promise<Point | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        resolve({ lat, lng, label: await reverseGeocode(lat, lng) });
      },
      () => resolve(null),
      { timeout: 6000 }
    );
  });
}
