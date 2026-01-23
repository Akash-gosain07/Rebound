import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

let socket = null;

export const initializeSocket = (token) => {
    if (socket) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: {
            token,
        },
        autoConnect: false,
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket not initialized. Call initializeSocket first.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
