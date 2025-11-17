import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { store } from './store';

export const Providers = ({ children }: PropsWithChildren) => (
  <Provider store={store}>{children}</Provider>
);

