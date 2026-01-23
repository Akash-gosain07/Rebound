import { ChatMessage } from '../models/ChatMessage.js';

export function setupChatChannel(io, socket) {
  socket.on('chat:join', ({ matchId }) => {
    socket.join(`match:${matchId}`);
  });

  socket.on('chat:message', async ({ matchId, itemId, senderId, text }) => {
    const message = await ChatMessage.create({ match: matchId, item: itemId, sender: senderId, text });
    io.to(`match:${matchId}`).emit('chat:message', message);
  });
}
