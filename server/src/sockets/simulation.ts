import { prisma } from '../prisma';
import { RideEngine } from './engine';
import { haversineKm } from '../services/routing';
import { RIDE_MODEL, RIDE_STATUS } from '../constants';

interface LatLng {
  lat: number;
  lng: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (v: number, amt: number) => v + (Math.random() - 0.5) * amt;

/**
 * Simulated driver fleet. Seeded "bot" drivers come online, drift around, and
 * auto-respond to ride requests (accepting fixed fares, bidding on offers) so a
 * single person can demo the entire matching + tracking flow in one browser.
 */
export async function startSimulatedFleet(engine: RideEngine) {
  const bots = await prisma.driver.findMany({
    where: { isSimulated: true },
    include: { user: true },
  });
  if (bots.length === 0) {
    console.log('[fleet] no simulated drivers seeded — run `npm run seed`');
    return;
  }

  const pos = new Map<string, LatLng>();
  const busy = new Set<string>();

  // Bring the fleet online at their seeded positions.
  for (const b of bots) {
    const p = { lat: b.lat ?? 14.5995, lng: b.lng ?? 120.9842 };
    pos.set(b.userId, p);
    await engine.setOnline(b.userId, true, p.lat, p.lng);
  }
  console.log(`[fleet] ${bots.length} simulated drivers online`);

  // Idle drift so markers feel alive.
  setInterval(async () => {
    for (const b of bots) {
      if (busy.has(b.userId)) continue;
      const p = pos.get(b.userId)!;
      const np = { lat: jitter(p.lat, 0.004), lng: jitter(p.lng, 0.004) };
      pos.set(b.userId, np);
      try {
        await engine.updateLocation(b.userId, np.lat, np.lng);
      } catch {
        /* ignore */
      }
    }
  }, 6000);

  const botIds = new Set(bots.map((b) => b.userId));

  // Respond to new ride requests.
  engine.onRideRequested(async ({ rideId, ride, nearbyDriverIds }) => {
    const candidates = nearbyDriverIds.filter((id) => botIds.has(id) && !busy.has(id));
    if (candidates.length === 0) return;

    if (ride.model === RIDE_MODEL.FIXED) {
      // Closest bot accepts after a short, human-ish delay.
      const closest = candidates
        .map((id) => ({ id, d: haversineKm(pos.get(id)!, ride.pickup) }))
        .sort((a, b) => a.d - b.d)[0];
      await sleep(1200 + Math.random() * 1500);
      try {
        await engine.acceptFixed(closest.id, rideId);
      } catch {
        /* a real driver may have taken it */
      }
    } else {
      // A few bots bid: some at the offer, some counter slightly higher.
      const offer = ride.offerFare ?? 0;
      const bidders = candidates.slice(0, 3);
      for (const id of bidders) {
        const counter = Math.random() < 0.5;
        const amount = counter
          ? Math.round(offer * (1.05 + Math.random() * 0.15) * 100) / 100
          : offer;
        const note = counter ? 'A bit more for this distance' : "I'll take your price";
        await sleep(1000 + Math.random() * 2500);
        try {
          await engine.createBid(id, rideId, amount, note);
        } catch {
          /* ride closed */
        }
      }
    }
  });

  // Drive a bot through the ride once it is matched.
  engine.onRideMatched(async ({ rideId, driverUserId }) => {
    if (!botIds.has(driverUserId)) return;
    busy.add(driverUserId);
    try {
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      if (!ride) return;
      const pickup = { lat: ride.pickupLat, lng: ride.pickupLng };
      const drop = { lat: ride.dropLat, lng: ride.dropLng };

      // En route to pickup.
      await engine.setStatus(driverUserId, rideId, RIDE_STATUS.ARRIVING).catch(() => {});
      await animate(engine, driverUserId, pos, pos.get(driverUserId)!, pickup, () =>
        isCancelled(rideId)
      );
      if (await isCancelled(rideId)) return;

      // Passenger onboard, heading to destination.
      await engine.setStatus(driverUserId, rideId, RIDE_STATUS.IN_PROGRESS).catch(() => {});
      await sleep(800);
      await animate(engine, driverUserId, pos, pos.get(driverUserId)!, drop, () =>
        isCancelled(rideId)
      );
      if (await isCancelled(rideId)) return;

      await engine.completeRide(driverUserId, rideId).catch(() => {});
    } finally {
      busy.delete(driverUserId);
    }
  });
}

async function isCancelled(rideId: string): Promise<boolean> {
  const r = await prisma.ride.findUnique({ where: { id: rideId }, select: { status: true } });
  return !r || r.status === RIDE_STATUS.CANCELLED;
}

async function animate(
  engine: RideEngine,
  userId: string,
  pos: Map<string, LatLng>,
  from: LatLng,
  to: LatLng,
  cancelled: () => Promise<boolean>
) {
  const km = haversineKm(from, to);
  const steps = Math.min(20, Math.max(6, Math.round(km * 5)));
  for (let i = 1; i <= steps; i++) {
    if (await cancelled()) return;
    const lat = from.lat + (to.lat - from.lat) * (i / steps);
    const lng = from.lng + (to.lng - from.lng) * (i / steps);
    pos.set(userId, { lat, lng });
    try {
      await engine.updateLocation(userId, lat, lng);
    } catch {
      /* ignore */
    }
    await sleep(900);
  }
}
