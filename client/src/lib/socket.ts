import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

let socket: Socket | null = null;

/** Lazily create (or reuse) the authenticated socket connection. */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (!socket) {
    socket = io({
      autoConnect: true,
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
  } else {
    socket.auth = { token: getToken() };
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

/** Promise-based emit that resolves with the server ack. */
export function emitAck<T = any>(event: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    getSocket().emit(event, payload, (res: any) => {
      if (res?.ok) resolve(res.data as T);
      else reject(new Error(res?.error || 'Request failed'));
    });
  });
}
