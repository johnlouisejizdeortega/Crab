import { Server } from 'socket.io';
import { prisma } from '../prisma';
import { findNearbyDrivers } from '../services/matching';
import { getRoute, fixedFare } from '../services/routing';
import { publicRide, publicBid } from '../serializers';
import { RIDE_MODEL, RIDE_STATUS, BID_STATUS, TXN_KIND } from '../constants';

export interface RequestRidePayload {
  pickup: { lat: number; lng: number; label: string };
  drop: { lat: number; lng: number; label: string };
  model: 'FIXED' | 'BID';
  offerFare?: number;
}

const room = (userId: string) => `user:${userId}`;
const rideRoom = (rideId: string) => `ride:${rideId}`;

function includeFull() {
  return {
    rider: true,
    driver: { include: { driver: true } },
    bids: { include: { driver: { include: { driver: true } } }, orderBy: { amount: 'asc' as const } },
    ratings: true,
  };
}

/**
 * Central ride engine. Both socket handlers (real users) and the simulated
 * fleet call these methods; the engine owns all DB writes and outbound emits.
 */
export class RideEngine {
  // rideId -> set of driver userIds who were offered the ride
  private offered = new Map<string, Set<string>>();
  private requestListeners: ((info: { rideId: string; ride: any; nearbyDriverIds: string[] }) => void)[] = [];
  private matchListeners: ((info: { rideId: string; driverUserId: string }) => void)[] = [];

  constructor(private io: Server) {}

  onRideRequested(cb: (info: { rideId: string; ride: any; nearbyDriverIds: string[] }) => void) {
    this.requestListeners.push(cb);
  }

  onRideMatched(cb: (info: { rideId: string; driverUserId: string }) => void) {
    this.matchListeners.push(cb);
  }

  private async loadRide(rideId: string) {
    return prisma.ride.findUnique({ where: { id: rideId }, include: includeFull() });
  }

  private emitRide(event: string, targets: string[], ride: any) {
    const payload = publicRide(ride);
    for (const t of new Set(targets)) this.io.to(room(t)).emit(event, payload);
  }

  async setOnline(driverUserId: string, online: boolean, lat?: number, lng?: number) {
    await prisma.driver.update({
      where: { userId: driverUserId },
      data: {
        isOnline: online,
        ...(lat !== undefined ? { lat } : {}),
        ...(lng !== undefined ? { lng } : {}),
      },
    });
  }

  async updateLocation(driverUserId: string, lat: number, lng: number) {
    await prisma.driver.update({ where: { userId: driverUserId }, data: { lat, lng } });
    // If this driver has an active ride, stream position to the rider.
    const ride = await prisma.ride.findFirst({
      where: {
        driverId: driverUserId,
        status: { in: [RIDE_STATUS.MATCHED, RIDE_STATUS.ARRIVING, RIDE_STATUS.IN_PROGRESS] },
      },
    });
    if (ride) {
      this.io.to(room(ride.riderId)).emit('driver:moved', { rideId: ride.id, lat, lng });
    }
  }

  async requestRide(riderId: string, payload: RequestRidePayload) {
    const { pickup, drop, model } = payload;
    const { distanceKm, durationMin } = await getRoute(pickup, drop);
    const fare = fixedFare(distanceKm, durationMin);

    const ride = await prisma.ride.create({
      data: {
        riderId,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupLabel: pickup.label,
        dropLat: drop.lat,
        dropLng: drop.lng,
        dropLabel: drop.label,
        model,
        distanceKm,
        durationMin,
        fixedFare: model === RIDE_MODEL.FIXED ? fare : null,
        offerFare: model === RIDE_MODEL.BID ? payload.offerFare ?? fare : null,
      },
      include: includeFull(),
    });

    // Notify nearby drivers.
    const nearby = await findNearbyDrivers(pickup, [riderId]);
    const set = new Set(nearby.map((d) => d.userId));
    this.offered.set(ride.id, set);
    const payloadOut = publicRide(ride);
    for (const d of nearby) {
      this.io.to(room(d.userId)).emit('ride:new', { ...payloadOut, driverDistanceKm: d.distanceKm });
    }

    this.io.to(room(riderId)).emit('ride:requested', payloadOut);
    for (const cb of this.requestListeners) {
      cb({ rideId: ride.id, ride: payloadOut, nearbyDriverIds: [...set] });
    }
    return { ride: payloadOut, nearbyDriverIds: [...set] };
  }

  /** Fixed-fare: first driver to accept wins. */
  async acceptFixed(driverUserId: string, rideId: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    if (ride.model !== RIDE_MODEL.FIXED) throw new Error('Not a fixed-fare ride');
    if (ride.status !== RIDE_STATUS.REQUESTED || ride.driverId) {
      throw new Error('Ride already taken');
    }
    await prisma.ride.update({
      where: { id: rideId },
      data: {
        driverId: driverUserId,
        agreedFare: ride.fixedFare,
        status: RIDE_STATUS.MATCHED,
        matchedAt: new Date(),
      },
    });
    await this.announceMatch(rideId, driverUserId);
  }

  async createBid(driverUserId: string, rideId: string, amount: number, note?: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    if (ride.model !== RIDE_MODEL.BID) throw new Error('Not a bidding ride');
    if (ride.status !== RIDE_STATUS.REQUESTED) throw new Error('Ride no longer open');

    const bid = await prisma.bid.upsert({
      where: { rideId_driverId: { rideId, driverId: driverUserId } },
      create: { rideId, driverId: driverUserId, amount, note },
      update: { amount, note, status: BID_STATUS.OPEN },
      include: { driver: { include: { driver: true } } },
    });
    this.io.to(room(ride.riderId)).emit('bid:new', publicBid(bid));
    return publicBid(bid);
  }

  async acceptBid(riderId: string, bidId: string) {
    const bid = await prisma.bid.findUnique({ where: { id: bidId }, include: { ride: true } });
    if (!bid) throw new Error('Bid not found');
    if (bid.ride.riderId !== riderId) throw new Error('Not your ride');
    if (bid.ride.status !== RIDE_STATUS.REQUESTED) throw new Error('Ride already matched');

    await prisma.$transaction([
      prisma.bid.update({ where: { id: bidId }, data: { status: BID_STATUS.ACCEPTED } }),
      prisma.bid.updateMany({
        where: { rideId: bid.rideId, id: { not: bidId } },
        data: { status: BID_STATUS.REJECTED },
      }),
      prisma.ride.update({
        where: { id: bid.rideId },
        data: {
          driverId: bid.driverId,
          agreedFare: bid.amount,
          status: RIDE_STATUS.MATCHED,
          matchedAt: new Date(),
        },
      }),
    ]);
    await this.announceMatch(bid.rideId, bid.driverId);
  }

  private async announceMatch(rideId: string, driverUserId: string) {
    const ride = await this.loadRide(rideId);
    if (!ride) return;
    // Join both parties to the ride room and notify.
    this.emitRide('ride:matched', [ride.riderId, driverUserId], ride);
    // Tell all other offered drivers the ride is gone.
    const others = this.offered.get(rideId);
    if (others) {
      for (const uid of others) {
        if (uid !== driverUserId) this.io.to(room(uid)).emit('ride:closed', { rideId });
      }
    }
    for (const cb of this.matchListeners) cb({ rideId, driverUserId });
  }

  private static NEXT: Record<string, string | undefined> = {
    [RIDE_STATUS.MATCHED]: RIDE_STATUS.ARRIVING,
    [RIDE_STATUS.ARRIVING]: RIDE_STATUS.IN_PROGRESS,
  };

  async setStatus(driverUserId: string, rideId: string, status: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    if (ride.driverId !== driverUserId) throw new Error('Not your ride');
    if (RideEngine.NEXT[ride.status] !== status) throw new Error('Invalid status transition');

    await prisma.ride.update({ where: { id: rideId }, data: { status } });
    const full = await this.loadRide(rideId);
    this.emitRide('ride:status', [ride.riderId, driverUserId], full);
  }

  /** Complete a ride and settle the fare between rider and driver wallets. */
  async completeRide(driverUserId: string, rideId: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    if (ride.driverId !== driverUserId) throw new Error('Not your ride');
    if (ride.status !== RIDE_STATUS.IN_PROGRESS) throw new Error('Ride not in progress');

    const fare = ride.agreedFare ?? ride.fixedFare ?? 0;
    const riderWallet = await prisma.wallet.findUnique({ where: { userId: ride.riderId } });
    const driverWallet = await prisma.wallet.findUnique({ where: { userId: driverUserId } });

    const ops: any[] = [
      prisma.ride.update({
        where: { id: rideId },
        data: { status: RIDE_STATUS.COMPLETED, completedAt: new Date() },
      }),
    ];
    if (riderWallet) {
      ops.push(
        prisma.wallet.update({
          where: { id: riderWallet.id },
          data: {
            balance: { decrement: fare },
            transactions: {
              create: { amount: -fare, kind: TXN_KIND.RIDE_PAYMENT, note: 'Ride fare', rideId },
            },
          },
        })
      );
    }
    if (driverWallet) {
      ops.push(
        prisma.wallet.update({
          where: { id: driverWallet.id },
          data: {
            balance: { increment: fare },
            transactions: {
              create: { amount: fare, kind: TXN_KIND.RIDE_EARNING, note: 'Ride earning', rideId },
            },
          },
        })
      );
    }
    await prisma.$transaction(ops);

    const full = await this.loadRide(rideId);
    this.emitRide('ride:completed', [ride.riderId, driverUserId], full);
  }

  async cancelRide(userId: string, rideId: string) {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    if (ride.riderId !== userId && ride.driverId !== userId) throw new Error('Not your ride');
    if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(ride.status as any)) {
      throw new Error('Ride already finished');
    }
    await prisma.ride.update({ where: { id: rideId }, data: { status: RIDE_STATUS.CANCELLED } });
    const full = await this.loadRide(rideId);
    const targets = [ride.riderId, ride.driverId].filter(Boolean) as string[];
    this.emitRide('ride:cancelled', targets, full);
    // Also clear from any offered drivers.
    const others = this.offered.get(rideId);
    if (others) for (const uid of others) this.io.to(room(uid)).emit('ride:closed', { rideId });
  }

  getOfferedDrivers(rideId: string): Set<string> | undefined {
    return this.offered.get(rideId);
  }
}

export { room, rideRoom };
