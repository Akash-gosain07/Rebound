import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: sessionStorage.getItem('rebound_token') || null,
  isGuest: false,
  setAuth: ({ user, token }) => {
    if (token) {
      sessionStorage.setItem('rebound_token', token);
    }
    set({ user, token, isGuest: false });
  },
  continueAsGuest: () => {
    set({ user: null, token: null, isGuest: true });
  },
  logout: () => {
    sessionStorage.removeItem('rebound_token');
    set({ user: null, token: null, isGuest: false });
  },
}));

export const useMapStore = create((set) => ({
  center: { lat: 20.2961, lng: 85.8245 },
  radius: 3000,
  type: null, // null = show all, 'lost' = show only lost, 'found' = show only found
  category: 'all',
  search: '',
  setCenter: (center) => set({ center }),
  setFilters: (patch) => set((state) => ({ ...state, ...patch })),
}));

export const useToastStore = create((set) => ({
  toasts: [],
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now(), ...toast },
      ],
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
