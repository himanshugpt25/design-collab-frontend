import { useEffect } from 'react';

import { useAppDispatch } from '../../../app/hooks';
import { createSocket } from '../../../services/socket/socketClient';
import type { CollaboratorPresence } from '../model/presenceSlice';
import {
  removeCollaborator,
  setConnectionState,
  upsertCollaborator,
} from '../model/presenceSlice';

export const useCanvasRealtime = (designId?: string) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!designId) return undefined;

    const socket = createSocket();

    const handleConnect = () => dispatch(setConnectionState(true));
    const handleDisconnect = () => dispatch(setConnectionState(false));
    const handlePresence = (payload: CollaboratorPresence) => {
      dispatch(upsertCollaborator(payload));
    };
    const handleLeave = (id: string) => {
      dispatch(removeCollaborator(id));
    };

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
      dispatch(setConnectionState(false));
    };
  }, [designId, dispatch]);
};

