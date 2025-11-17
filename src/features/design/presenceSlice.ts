import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CollaboratorPresence {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  lastActiveAt: string;
}

interface PresenceState {
  collaborators: Record<string, CollaboratorPresence>;
  isConnected: boolean;
}

const initialState: PresenceState = {
  collaborators: {},
  isConnected: false,
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setConnectionState(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    upsertCollaborator(state, action: PayloadAction<CollaboratorPresence>) {
      state.collaborators[action.payload.id] = action.payload;
    },
    removeCollaborator(state, action: PayloadAction<string>) {
      delete state.collaborators[action.payload];
    },
    resetPresence() {
      return initialState;
    },
  },
});

export const { setConnectionState, upsertCollaborator, removeCollaborator, resetPresence } =
  presenceSlice.actions;
export default presenceSlice.reducer;

