import type { CollaboratorPresence } from '../../features/canvas/model/presenceSlice';

export type ServerToClientEvents = {
  'presence:update': (payload: CollaboratorPresence) => void;
  'presence:leave': (collaboratorId: string) => void;
};

export type ClientToServerEvents = {
  'design:join': (payload: { designId: string }) => void;
  'design:leave': (payload: { designId: string }) => void;
};

