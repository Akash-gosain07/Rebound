import { useState, useEffect, useCallback } from 'react';
import apiClient from '../apiClient';

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await apiClient.get('/notifications');
            const data = response.data;
            // Handle both { notifications: [] } and [] formats
            const notifs = data.notifications || data || [];

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Poll every 5 seconds
        const intervalId = setInterval(fetchNotifications, 5000);

        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            fetchNotifications(); // Revert on error
        }
    };

    return { notifications, unreadCount, markAsRead, refresh: fetchNotifications };
}
