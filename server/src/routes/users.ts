import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { publicUser } from '../serializers';
import { RIDE_STATUS } from '../constants';

const router = Router();

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  vehicle: z
    .object({
      model: z.string().min(1).optional(),
      plate: z.string().min(1).optional(),
      color: z.string().optional(),
      seats: z.number().int().optional(),
    })
    .optional(),
});

router.patch('/me', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { name, phone, avatar, vehicle } = parsed.data;

  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(vehicle
        ? {
            driver: {
              update: {
                ...(vehicle.model ? { vehicleModel: vehicle.model } : {}),
                ...(vehicle.plate ? { plate: vehicle.plate } : {}),
                ...(vehicle.color ? { color: vehicle.color } : {}),
                ...(vehicle.seats ? { seats: vehicle.seats } : {}),
              },
            },
          }
        : {}),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { driver: true, wallet: true },
  });
  res.json({ user: publicUser(user) });
});

const rateSchema = z.object({
  rideId: z.string(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Rate the other party of a completed ride. Recomputes their rating average.
router.post('/rate', requireAuth, async (req, res) => {
  const parsed = rateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { rideId, stars, comment } = parsed.data;
  const me = req.user!.id;

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) return res.status(404).json({ error: 'Ride not found' });
  if (ride.status !== RIDE_STATUS.COMPLETED) {
    return res.status(400).json({ error: 'Ride is not completed' });
  }
  if (ride.riderId !== me && ride.driverId !== me) {
    return res.status(403).json({ error: 'Not your ride' });
  }
  const toUserId = ride.riderId === me ? ride.driverId : ride.riderId;
  if (!toUserId) return res.status(400).json({ error: 'No counterparty to rate' });

  await prisma.rating.upsert({
    where: { rideId_byUserId: { rideId, byUserId: me } },
    create: { rideId, byUserId: me, toUserId, stars, comment },
    update: { stars, comment },
  });

  // Recompute recipient's average from all ratings they received.
  const agg = await prisma.rating.aggregate({
    where: { toUserId },
    _avg: { stars: true },
    _count: true,
  });
  await prisma.user.update({
    where: { id: toUserId },
    data: {
      ratingAvg: Math.round((agg._avg.stars ?? 5) * 100) / 100,
      ratingCount: agg._count,
    },
  });

  res.json({ ok: true });
});

export default router;
