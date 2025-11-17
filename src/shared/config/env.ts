const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const socketUrl = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

export const env = {
  apiUrl,
  socketUrl,
  isApiConfigured: Boolean(import.meta.env.VITE_API_URL),
};

