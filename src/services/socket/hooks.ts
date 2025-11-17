import { useEffect } from 'react';

import type { Socket } from 'socket.io-client';

import { createSocket } from './socketClient';
import type { ClientToServerEvents, ServerToClientEvents } from './events';

export const useSocketEvent = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: (...args: Parameters<ServerToClientEvents[K]>) => void,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const socket = createSocket() as Socket<ServerToClientEvents, ClientToServerEvents>;
    const listener = ((...args: Parameters<ServerToClientEvents[K]>) => {
      handler(...args);
    }) as ServerToClientEvents[K];
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event, handler, enabled]);
};

