import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { getRoute, fixedFare } from '../services/routing';
import { PRICING } from '../constants';
import { publicRide } from '../serializers';

const router = Router();

const point = z.object({ lat: z.number(), lng: z.number(), label: z.string().optional() });

const estimateSchema = z.object({ pickup: point, drop: point });

// Fare + route estimate for both ride models.
router.post('/estimate', requireAuth, async (req, res) => {
  const parsed = estimateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid coordinates' });
  const { pickup, drop } = parsed.data;

  const { distanceKm, durationMin } = await getRoute(pickup, drop);
  const fare = fixedFare(distanceKm, durationMin);

  res.json({
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: Math.round(durationMin),
    fixedFare: fare,
    suggestedBid: {
      low: Math.max(PRICING.MIN_FARE, Math.round(fare * PRICING.BID_LOW_FACTOR * 100) / 100),
      recommended: fare,
      high: Math.round(fare * PRICING.BID_HIGH_FACTOR * 100) / 100,
    },
  });
});

// Current user's ride history (as rider or driver), newest first.
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const rides = await prisma.ride.findMany({
    where: { OR: [{ riderId: userId }, { driverId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      rider: true,
      driver: { include: { driver: true } },
      ratings: true,
    },
  });
  res.json({ rides: rides.map(publicRide) });
});

router.get('/:id', requireAuth, async (req, res) => {
  const ride = await prisma.ride.findUnique({
    where: { id: req.params.id },
    include: {
      rider: true,
      driver: { include: { driver: true } },
      bids: { include: { driver: { include: { driver: true } } } },
      ratings: true,
    },
  });
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.riderId !== req.user!.id && ride.driverId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ ride: publicRide(ride) });
});

export default router;
