import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const { accessToken } = useAuthStore.getState();
    socket = io('/', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (): Socket => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const reconnectSocket = () => {
  disconnectSocket();
  return connectSocket();
};
