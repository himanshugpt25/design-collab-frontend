import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { commentsApi } from '../api/commentsApi';
import { designsApi } from '../api/designsApi';
import historyReducer from '../features/design/historySlice';
import presenceReducer from '../features/design/presenceSlice';
import designReducer from '../features/design/designSlice';

export const store = configureStore({
  reducer: {
    [designsApi.reducerPath]: designsApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    design: designReducer,
    history: historyReducer,
    presence: presenceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(designsApi.middleware, commentsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);

