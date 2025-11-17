import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DesignElement } from '../../../entities/design/model/types';

export interface HistoryEntry {
  designId: string;
  snapshot: DesignElement[];
  timestamp: string;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

const initialState: HistoryState = {
  past: [],
  future: [],
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushSnapshot(state, action: PayloadAction<HistoryEntry>) {
      state.past.push(action.payload);
      state.future = [];
    },
    undo(state) {
      const entry = state.past.pop();
      if (entry) {
        state.future.unshift(entry);
      }
    },
    redo(state) {
      const entry = state.future.shift();
      if (entry) {
        state.past.push(entry);
      }
    },
    clearHistory(state) {
      state.past = [];
      state.future = [];
    },
  },
});

export const { pushSnapshot, undo, redo, clearHistory } = historySlice.actions;
export default historySlice.reducer;

