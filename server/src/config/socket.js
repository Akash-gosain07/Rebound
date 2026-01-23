import { setupNotificationChannel } from '../services/notificationService.js';
import { setupChatChannel } from '../services/chatService.js';
import jwt from 'jsonwebtoken';

let ioInstance;

export function registerSocketHandlers(io) {
  ioInstance = io;

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      // Allow connection but mark as unauthenticated
      socket.userId = socket.handshake.query.userId;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      // Fallback to query userId if token invalid
      socket.userId = socket.handshake.query.userId;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User connected: ${userId}`);
    }

    setupNotificationChannel(io, socket);
    setupChatChannel(io, socket);

    // Handle match room joining
    socket.on('join:match', (matchId) => {
      socket.join(`match:${matchId}`);
      console.log(`User ${userId} joined match room: ${matchId}`);
    });

    // Handle leaving match room
    socket.on('leave:match', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`User ${userId} left match room: ${matchId}`);
    });

    // Handle location updates during tracking
    socket.on('location:update', (data) => {
      const { matchId, location } = data;
      // Broadcast to other user in the match
      socket.to(`match:${matchId}`).emit('location:updated', {
        userId: socket.userId,
        location,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
}

// Helper functions for emitting events
export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};

export const emitToUser = (userId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, data);
};

export const emitToMatch = (matchId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`match:${matchId}`).emit(event, data);
};

export const emitToOtherUserInMatch = (matchId, excludeUserId, event, data) => {
  if (!ioInstance) return;
  const room = ioInstance.sockets.adapter.rooms.get(`match:${matchId}`);
  if (!room) return;

  room.forEach((socketId) => {
    const socket = ioInstance.sockets.sockets.get(socketId);
    if (socket && socket.userId !== excludeUserId) {
      socket.emit(event, data);
    }
  });
};

