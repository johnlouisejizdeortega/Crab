import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './env';
import authRoutes from './routes/auth';
import rideRoutes from './routes/rides';
import walletRoutes from './routes/wallet';
import userRoutes from './routes/users';
import { initSockets } from './sockets';

const app = express();
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'crab', time: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/users', userRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const server = http.createServer(app);
initSockets(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🦀 Crab server on http://localhost:${env.PORT}  (fleet: ${env.SIMULATED_FLEET ? 'on' : 'off'})`);
});
