import express from 'express';
import authRoutes from './auth.routes.js';
import itemRoutes from './items.routes.js';
import matchRoutes from './matches.routes.js';
import notificationRoutes from './notifications.routes.js';
import userRoutes from './users.routes.js';
import adminRoutes from './admin.routes.js';
import chatRoutes from './chat.routes.js';
import uploadRoutes from './upload.routes.js';

export function registerRoutes(app) {
  const router = express.Router();

  router.use('/auth', authRoutes);
  router.use('/items', itemRoutes);
  router.use('/matches', matchRoutes);
  router.use('/notifications', notificationRoutes);
  router.use('/users', userRoutes);
  router.use('/admin', adminRoutes);
  router.use('/chat', chatRoutes);
  router.use('/upload', uploadRoutes);

  app.use('/api', router);
}
