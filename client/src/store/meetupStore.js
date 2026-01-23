import { create } from 'zustand';

export const useMeetupStore = create((set) => ({
    activeMeetups: [],
    currentMeetup: null,
    trackingActive: false,
    userLocation: null,
    otherUserLocation: null,
    distance: null,
    eta: null,

    setActiveMeetups: (meetups) => set({ activeMeetups: meetups }),

    setCurrentMeetup: (meetup) => set({ currentMeetup: meetup }),

    updateUserLocation: (location) => set({ userLocation: location }),

    updateOtherUserLocation: (location) => set({ otherUserLocation: location }),

    updateDistance: (distance, eta) => set({ distance, eta }),

    startTracking: () => set({ trackingActive: true }),

    stopTracking: () => set({
        trackingActive: false,
        userLocation: null,
        otherUserLocation: null,
        distance: null,
        eta: null,
    }),

    clearMeetup: () => set({
        currentMeetup: null,
        trackingActive: false,
        userLocation: null,
        otherUserLocation: null,
        distance: null,
        eta: null,
    }),
}));
