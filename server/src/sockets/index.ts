import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { verifyToken } from '../auth';
import { env } from '../env';
import { ROLE } from '../constants';
import { RideEngine, room } from './engine';
import { startSimulatedFleet } from './simulation';

export function initSockets(httpServer: HttpServer): { io: Server; engine: RideEngine } {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  // Authenticate every socket with the JWT passed in the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = token ? verifyToken(token) : null;
    if (!payload) return next(new Error('Unauthorized'));
    (socket.data as any).user = payload;
    next();
  });

  const engine = new RideEngine(io);

  const wrap =
    (fn: (...a: any[]) => Promise<any>) =>
    async (arg: any, ack?: (res: any) => void) => {
      try {
        const result = await fn(arg);
        ack?.({ ok: true, ...(result ? { data: result } : {}) });
      } catch (err: any) {
        ack?.({ ok: false, error: err?.message ?? 'Something went wrong' });
      }
    };

  io.on('connection', (socket) => {
    const user = (socket.data as any).user as { id: string; role: string };
    socket.join(room(user.id));

    // --- Driver events ---
    if (user.role === ROLE.DRIVER) {
      socket.on(
        'driver:online',
        wrap((p: { online: boolean; lat?: number; lng?: number }) =>
          engine.setOnline(user.id, p.online, p.lat, p.lng)
        )
      );
      socket.on(
        'driver:location',
        wrap((p: { lat: number; lng: number }) => engine.updateLocation(user.id, p.lat, p.lng))
      );
      socket.on('ride:accept', wrap((p: { rideId: string }) => engine.acceptFixed(user.id, p.rideId)));
      socket.on(
        'bid:create',
        wrap((p: { rideId: string; amount: number; note?: string }) =>
          engine.createBid(user.id, p.rideId, p.amount, p.note)
        )
      );
      socket.on(
        'ride:status',
        wrap((p: { rideId: string; status: string }) =>
          engine.setStatus(user.id, p.rideId, p.status)
        )
      );
      socket.on('ride:complete', wrap((p: { rideId: string }) => engine.completeRide(user.id, p.rideId)));
    }

    // --- Rider events ---
    if (user.role === ROLE.RIDER) {
      socket.on('ride:request', wrap((p: any) => engine.requestRide(user.id, p)));
      socket.on('bid:accept', wrap((p: { bidId: string }) => engine.acceptBid(user.id, p.bidId)));
    }

    // --- Shared ---
    socket.on('ride:cancel', wrap((p: { rideId: string }) => engine.cancelRide(user.id, p.rideId)));
  });

  if (env.SIMULATED_FLEET) {
    startSimulatedFleet(engine).catch((e) => console.error('[fleet] failed to start', e));
  }

  return { io, engine };
}
