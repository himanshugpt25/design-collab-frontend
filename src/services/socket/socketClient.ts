import { io, type Socket } from 'socket.io-client';

import { env } from '../../shared/config/env';
import type { ClientToServerEvents, ServerToClientEvents } from './events';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const createSocket = () => {
  if (!socket) {
    socket = io(env.socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call createSocket() first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

