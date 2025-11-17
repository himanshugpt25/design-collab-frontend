import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Design, DesignElement } from '../../types/design';

interface DesignState {
  items: Design[];
  activeDesignId?: string;
}

const seedDesign: Design = {
  _id: 'seed-design',
  name: 'Marketing Launch',
  width: 1080,
  height: 1080,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  elements: [
    {
      id: 'headline',
      type: 'text',
      x: 120,
      y: 120,
      width: 600,
      height: 120,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      text: 'Design Collaboration Demo',
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 'bold',
      fill: '#f8fafc',
      align: 'left',
    },
    {
      id: 'cta',
      type: 'rect',
      x: 120,
      y: 360,
      width: 320,
      height: 96,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      fill: '#2563eb',
      stroke: '#60a5fa',
      strokeWidth: 2,
      radius: 20,
    },
    {
      id: 'accent-circle',
      type: 'circle',
      x: 720,
      y: 540,
      width: 320,
      height: 320,
      rotation: 0,
      zIndex: 0,
      opacity: 0.25,
      fill: '#a855f7',
      stroke: '#f472b6',
      strokeWidth: 6,
      radius: 160,
    },
  ],
};

const initialState: DesignState = {
  items: [seedDesign],
  activeDesignId: seedDesign._id,
};

const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    setActiveDesignId(state, action: PayloadAction<string | undefined>) {
      state.activeDesignId = action.payload;
    },
    upsertDesign(state, action: PayloadAction<Design>) {
      const existingIndex = state.items.findIndex((d) => d._id === action.payload._id);
      if (existingIndex >= 0) {
        state.items[existingIndex] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
    updateElement(
      state,
      action: PayloadAction<{ designId: string; element: DesignElement }>
    ) {
      const design = state.items.find((d) => d._id === action.payload.designId);
      if (!design) return;
      const elementIndex = design.elements.findIndex((el) => el.id === action.payload.element.id);
      if (elementIndex >= 0) {
        design.elements[elementIndex] = action.payload.element;
      } else {
        design.elements.push(action.payload.element);
      }
      design.updatedAt = new Date().toISOString();
    },
  },
});

export const { setActiveDesignId, upsertDesign, updateElement } = designSlice.actions;
export default designSlice.reducer;

