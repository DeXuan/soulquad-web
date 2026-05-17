import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { initDb, query } from './db/database.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { matchRoutes } from './routes/matches.js';
import { messageRoutes } from './routes/messages.js';
import { aiRoutes } from './routes/ai.js';
import { notificationRoutes, createNotification } from './routes/notifications.js';
import { soulTestRoutes } from './routes/soulTest.js';
import { verifyToken } from './routes/auth.js';
import { cityRoutes } from './routes/cities.js';
import { momentRoutes } from './routes/moments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Secure CORS configuration - whitelist allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.) or from allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Initialize database and start server
async function start() {
  await initDb();
  console.log('Database initialized');

  // Make io available to routes
  app.set('io', io);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/soul-test', soulTestRoutes);
  app.use('/api/cities', cityRoutes);
  app.use('/api/moments', momentRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve frontend static files in production
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.use((req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });

  // Socket.io connection handling
  global.connectedUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.exp && Date.now() < payload.exp) {
        socket.userId = payload.id;
        return next();
      }
    }
    next(new Error('Authentication error'));
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth.token;
    if (token && socket.userId) {
      global.connectedUsers.set(socket.userId, socket.id);
    }

    socket.on('join_room', (matchId) => {
      // Validate UUID format (36 chars with hyphens)
      if (matchId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId)) {
        socket.join(matchId);
      }
    });

    socket.on('send_message', async (data) => {
      if (!socket.userId) {
        return;
      }
      const { match_id, content, message_type } = data;

      if (!content || content.length > 5000) {
        return;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await query(`
        INSERT INTO messages (id, match_id, sender_id, content, message_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, match_id, socket.userId, content, message_type || 'text', now]);

      const message = {
        id,
        match_id,
        sender_id: socket.userId,
        content,
        message_type: message_type || 'text',
        created_at: now,
        read_at: null
      };

      socket.to(match_id).emit('new_message', message);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        global.connectedUsers.delete(socket.userId);
      }
    });
  });

  const PORT = process.env.PORT || 3001;

  httpServer.listen(PORT, () => {
    console.log(`SoulQuad server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});