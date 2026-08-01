import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { TXN_KIND } from '../constants';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.user!.id },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
  });
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json({
    balance: wallet.balance,
    transactions: wallet.transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      kind: t.kind,
      note: t.note,
      rideId: t.rideId,
      createdAt: t.createdAt,
    })),
  });
});

const topupSchema = z.object({ amount: z.number().positive().max(1000) });

router.post('/topup', requireAuth, async (req, res) => {
  const parsed = topupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid amount' });
  const { amount } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: amount },
      transactions: {
        create: { amount, kind: TXN_KIND.TOPUP, note: 'Wallet top-up' },
      },
    },
  });
  res.json({ balance: updated.balance });
});

export default router;
