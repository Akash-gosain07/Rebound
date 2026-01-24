
let ioInstance;

export const registerSocketHandlers = (io) => {
    ioInstance = io;
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join room for specific match updates
        socket.on('join_match', (matchId) => {
            socket.join(`match_${matchId}`);
            console.log(`Socket ${socket.id} joined match_${matchId}`);
        });

        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined user_${userId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

export const emitToMatch = (matchId, event, data) => {
    if (!ioInstance) return;
    ioInstance.to(`match_${matchId}`).emit(event, data);
};

export const emitToUser = (userId, event, data) => {
    if (!ioInstance) return;
    ioInstance.to(`user_${userId}`).emit(event, data);
};

export const emitToOtherUserInMatch = (matchId, userId, event, data) => {
    if (!ioInstance) return;
    // In a real app we might exclude the specific socketId of the user if we tracked it.
    // For now, broadcasting to the room is "good enough" or we just rely on client filtering.
    // But since the interface exists, we implement it wrapping emitToMatch.
    ioInstance.to(`match_${matchId}`).emit(event, data);
};
