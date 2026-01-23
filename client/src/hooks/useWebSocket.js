import { useEffect, useRef } from 'react';
import { initializeSocket, getSocket, disconnectSocket } from '../lib/socketClient';
import { useNotificationStore } from '../store/notificationStore';
import { useMeetupStore } from '../store/meetupStore';
import { useAuthStore } from '../store';

export const useWebSocket = () => {
    const socketRef = useRef(null);
    const { user, token } = useAuthStore();
    const { addNotification, showNotificationPopup } = useNotificationStore();
    const { updateOtherUserLocation, updateDistance } = useMeetupStore();

    useEffect(() => {
        if (!token || !user) {
            return;
        }

        // Initialize socket
        const socket = initializeSocket(token);
        socketRef.current = socket;

        // Connect
        socket.connect();

        // Connection events
        socket.on('connect', () => {
            console.log('WebSocket connected');
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        // Match events
        socket.on('match:found', (data) => {
            console.log('Match found:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'MATCH_FOUND',
                title: 'Match Found!',
                body: "Someone thinks your item is theirs!",
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
            showNotificationPopup(notification);
        });

        // Location events
        socket.on('location:change_requested', (data) => {
            console.log('Location change requested:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'LOCATION_CHANGE_REQUEST',
                title: 'Location Change Requested',
                body: 'The other user wants to change the meetup location',
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
            showNotificationPopup(notification);
        });

        socket.on('location:approved', (data) => {
            console.log('Location approved:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'LOCATION_APPROVED',
                title: 'Location Approved',
                body: 'Meetup location has been updated',
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
            showNotificationPopup(notification);
        });

        socket.on('location:rejected', (data) => {
            console.log('Location rejected:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'LOCATION_REJECTED',
                title: 'Location Change Rejected',
                body: 'The other user rejected the location change',
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
        });

        // Tracking events
        socket.on('tracking:started', (data) => {
            console.log('Tracking started:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'TRACKING_STARTED',
                title: 'Tracking Started',
                body: 'The other user started live tracking',
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
            showNotificationPopup(notification);
        });

        socket.on('location:updated', (data) => {
            console.log('Location updated:', data);
            updateOtherUserLocation(data.location);
            if (data.distance && data.eta) {
                updateDistance(data.distance, data.eta);
            }
        });

        socket.on('tracking:stopped', (data) => {
            console.log('Tracking stopped:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'TRACKING_STOPPED',
                title: 'Tracking Stopped',
                body: 'Live tracking has ended',
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
        });

        // OTP events
        socket.on('otp:generated', (data) => {
            console.log('OTP generated:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'OTP_READY',
                title: 'OTP Ready',
                body: `Your OTP: ${data.yourOTP}`,
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
            showNotificationPopup(notification);
        });

        socket.on('otp:verified', (data) => {
            console.log('OTP verified:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'OTP_VERIFIED',
                title: 'OTP Verified',
                body: 'The other user verified their OTP',
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
        });

        socket.on('match:completed', (data) => {
            console.log('Match completed:', data);
            const notification = {
                _id: Date.now().toString(),
                type: 'MEETUP_COMPLETED',
                title: 'Item Successfully Returned! 🎉',
                body: data.message,
                data,
                read: false,
                createdAt: new Date(),
            };
            addNotification(notification);
            showNotificationPopup(notification);
        });

        // Cleanup
        return () => {
            disconnectSocket();
        };
    }, [token, user, addNotification, showNotificationPopup, updateOtherUserLocation, updateDistance]);

    const joinMatchRoom = (matchId) => {
        if (socketRef.current) {
            socketRef.current.emit('join:match', matchId);
        }
    };

    const leaveMatchRoom = (matchId) => {
        if (socketRef.current) {
            socketRef.current.emit('leave:match', matchId);
        }
    };

    const updateLocation = (matchId, location) => {
        if (socketRef.current) {
            socketRef.current.emit('location:update', { matchId, location });
        }
    };

    return {
        socket: socketRef.current,
        joinMatchRoom,
        leaveMatchRoom,
        updateLocation,
    };
};
