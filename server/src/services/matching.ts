import { prisma } from '../prisma';
import { haversineKm } from './routing';
import { MATCH_RADIUS_KM } from '../constants';

export interface NearbyDriver {
  userId: string;
  driverId: string;
  name: string;
  vehicleModel: string;
  plate: string;
  color: string;
  ratingAvg: number;
  lat: number;
  lng: number;
  distanceKm: number;
}

/** Online drivers within MATCH_RADIUS_KM of a point, nearest first. */
export async function findNearbyDrivers(
  point: { lat: number; lng: number },
  excludeUserIds: string[] = []
): Promise<NearbyDriver[]> {
  const drivers = await prisma.driver.findMany({
    where: { isOnline: true, lat: { not: null }, lng: { not: null } },
    include: { user: true },
  });

  return drivers
    .filter((d) => !excludeUserIds.includes(d.userId))
    .map((d) => ({
      userId: d.userId,
      driverId: d.id,
      name: d.user.name,
      vehicleModel: d.vehicleModel,
      plate: d.plate,
      color: d.color,
      ratingAvg: d.user.ratingAvg,
      lat: d.lat as number,
      lng: d.lng as number,
      distanceKm: haversineKm(point, { lat: d.lat as number, lng: d.lng as number }),
    }))
    .filter((d) => d.distanceKm <= MATCH_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
