import { PRICING } from '../constants';

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
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

/**
 * Resolve distance + duration between two points.
 * Tries the public OSRM demo server for real road routing; falls back to a
 * straight-line estimate (× road factor) if the network is unavailable.
 */
export async function getRoute(
  pickup: { lat: number; lng: number },
  drop: { lat: number; lng: number }
): Promise<RouteInfo> {
  const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=false`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (res.ok) {
      const data: any = await res.json();
      const route = data?.routes?.[0];
      if (route) {
        return {
          distanceKm: route.distance / 1000,
          durationMin: route.duration / 60,
        };
      }
    }
  } catch {
    // fall through to estimate
  }
  const straight = haversineKm(pickup, drop);
  const distanceKm = straight * 1.35; // road winding factor
  const durationMin = (distanceKm / 30) * 60; // assume ~30 km/h urban avg
  return { distanceKm, durationMin };
}

export function fixedFare(distanceKm: number, durationMin: number): number {
  const raw = PRICING.BASE + distanceKm * PRICING.PER_KM + durationMin * PRICING.PER_MIN;
  return Math.max(PRICING.MIN_FARE, Math.round(raw * 100) / 100);
}
