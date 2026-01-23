import { Notification } from '../models/Notification.js';

export function setupNotificationChannel(io, socket) {
  socket.on('notifications:markRead', async ({ notificationId }) => {
    if (!socket.handshake.query.userId) return;
    await Notification.findByIdAndUpdate(notificationId, { read: true });
  });
}

export async function createNotification({ user, type, title, body, data, io }) {
  const notification = await Notification.create({ user, type, title, body, data });
  if (io) {
    io.to(`user:${user}`).emit('notification:new', notification);
  }
  return notification;
}
