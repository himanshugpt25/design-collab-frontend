import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useAppDispatch } from '../app/hooks';
import {
  removeCollaborator,
  setConnectionState,
  upsertCollaborator,
} from '../features/design/presenceSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

interface PresencePayload {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  lastActiveAt: string;
}

export const useRealtime = (designId?: string) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!designId) return undefined;

    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    const handleConnect = () => dispatch(setConnectionState(true));
    const handleDisconnect = () => dispatch(setConnectionState(false));
    const handlePresence = (payload: PresencePayload) => dispatch(upsertCollaborator(payload));
    const handleLeave = (id: string) => dispatch(removeCollaborator(id));

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('presence:update', handlePresence);
    socket.on('presence:leave', handleLeave);

    socket.emit('design:join', { designId });

    return () => {
      socket.emit('design:leave', { designId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence:update', handlePresence);
      socket.off('presence:leave', handleLeave);
      socket.disconnect();
      dispatch(setConnectionState(false));
    };
  }, [designId, dispatch]);
};

