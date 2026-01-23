import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    notifications: [],
    unreadCount: 0,
    showPopup: false,
    currentPopup: null,

    addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
    })),

    markAsRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
    })),

    showNotificationPopup: (notification) => set({
        showPopup: true,
        currentPopup: notification,
    }),

    dismissPopup: () => set({
        showPopup: false,
        currentPopup: null,
    }),

    clearAll: () => set({
        notifications: [],
        unreadCount: 0,
    }),

    setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
    }),
}));
