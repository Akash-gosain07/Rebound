import { io as createClient } from 'socket.io-client';

export function createSocket(userId?: string) {
  const url = import.meta.env.VITE_SOCKET_URL || '';
  const socket = createClient(url || undefined, {
    query: userId ? { userId } : undefined,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
}
