import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { registerSocketHandlers } from './config/socket.js';
import app from './app.js';
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = new Set(
        [process.env.CLIENT_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null].filter(Boolean)
      );
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Register WebSocket handlers
registerSocketHandlers(io);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Rebound API listening on port ${PORT}`);
      console.log(`WebSocket server ready`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });

