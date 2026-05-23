import { useEffect, useState } from 'react';
import { socketClient } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    socketClient.connect(token || undefined);
    const socket = socketClient.getSocket();

    if (socket) {
      setIsConnected(socket.connected);

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    }

    return () => {
      // Clean up listeners if needed.
    };
  }, [isAuthenticated]);

  return {
    socket: socketClient.getSocket(),
    isConnected,
    socketClient,
  };
}
