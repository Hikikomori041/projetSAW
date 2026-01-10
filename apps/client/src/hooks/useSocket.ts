import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import type { Message } from '../types';

export const useSocket = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const setupMessageListeners = (
    onNewMessage: (message: Message) => void,
    onMessageUpdated: (message: Message) => void,
    onMessageDeleted: (messageId: string) => void,
    onUserBanned: (data: { userId: string }) => void
  ) => {
    if (!socket) return;

    socket.on('newMessage', onNewMessage);
    socket.on('messageUpdated', onMessageUpdated);
    socket.on('messageDeleted', onMessageDeleted);
    socket.on('userBanned', onUserBanned);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('messageUpdated', onMessageUpdated);
      socket.off('messageDeleted', onMessageDeleted);
      socket.off('userBanned', onUserBanned);
    };
  };

  const joinChannel = (channelId: string) => {
    socket?.emit('joinChannel', channelId);
  };

  return { socket, setupMessageListeners, joinChannel };
};
