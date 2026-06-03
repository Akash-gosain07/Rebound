import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import matchRoutes from './routes/matches.js';
import uploadRoutes from './routes/upload.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import userRoutes from './routes/users.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildAllowedOrigins() {
  const configuredOrigins = [
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean);

  return new Set(configuredOrigins);
}

export function createApp() {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (/^http:\/\/localhost:\d+$/.test(origin) || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '10mb' }));

  const uploadsPath = path.join(__dirname, '../uploads');
  app.use(['/uploads', '/api/uploads'], express.static(uploadsPath));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'rebound' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/chat', chatRoutes);

  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
