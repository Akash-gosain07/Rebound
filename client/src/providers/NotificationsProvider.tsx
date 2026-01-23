import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import type { Notification } from '../lib/types';
import { useAuth } from './AuthProvider';
import { createSocket } from '../lib/socket';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

  const refresh = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (user) {
      void refresh();
    } else {
      setNotifications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Socket.io real-time notifications
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = createSocket(user.userId);
    socketRef.current = socket;

    socket.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // POLLING FALLBACK (For Cross-Server Communication)
    const intervalId = setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      clearInterval(intervalId);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
