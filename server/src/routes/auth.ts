import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { comparePassword, hashPassword, signToken } from '../auth';
import { requireAuth } from '../middleware/auth';
import { ROLE } from '../constants';
import { publicUser } from '../serializers';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum([ROLE.RIDER, ROLE.DRIVER]),
  vehicle: z
    .object({
      model: z.string().min(1),
      plate: z.string().min(1),
      color: z.string().optional(),
      seats: z.number().int().optional(),
    })
    .optional(),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
  }
  const { email, password, name, phone, role, vehicle } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  if (role === ROLE.DRIVER && !vehicle) {
    return res.status(400).json({ error: 'Drivers must provide vehicle details' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone,
      role,
      wallet: { create: {} },
      ...(role === ROLE.DRIVER && vehicle
        ? {
            driver: {
              create: {
                vehicleModel: vehicle.model,
                plate: vehicle.plate,
                color: vehicle.color ?? 'Black',
                seats: vehicle.seats ?? 4,
              },
            },
          }
        : {}),
    },
    include: { driver: true, wallet: true },
  });

  const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
  res.json({ token, user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { driver: true, wallet: true },
  });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { driver: true, wallet: true },
  });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user: publicUser(user) });
});

export default router;
