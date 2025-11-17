import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '../../../app/store';

const selectDesignState = (state: RootState) => state.design;

export const selectDesigns = createSelector([selectDesignState], (design) => design.items);

export const selectActiveDesignId = createSelector(
  [selectDesignState],
  (design) => design.activeDesignId
);

export const selectActiveDesign = createSelector(
  [selectDesigns, selectActiveDesignId],
  (designs, activeId) => designs.find((design) => design._id === activeId)
);

