import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb, getDb } from './db/database.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { matchRoutes } from './routes/matches.js';
import { messageRoutes } from './routes/messages.js';
import { aiRoutes } from './routes/ai.js';
import { notificationRoutes, createNotification } from './routes/notifications.js';
import { soulTestRoutes } from './routes/soulTest.js';
import { cityRoutes } from './routes/cities.js';
import { momentRoutes } from './routes/moments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize database
initDb();

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
const connectedUsers = new Map();

io.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  if (token) {
    connectedUsers.set(token, socket.id);
  }

  socket.on('join_room', (matchId) => {
    socket.join(matchId);
  });

  socket.on('send_message', async (data) => {
    const { match_id, content, message_type } = data;
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO messages (id, match_id, sender_id, content, message_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      match_id,
      socket.handshake.auth.userId,
      content,
      message_type || 'text',
      new Date().toISOString()
    );

    const message = {
      id: result.lastInsertRowid.toString(),
      match_id,
      sender_id: socket.handshake.auth.userId,
      content,
      message_type: message_type || 'text',
      created_at: new Date().toISOString(),
      read_at: null
    };

    socket.to(match_id).emit('new_message', message);
  });

  socket.on('disconnect', () => {
    if (token) {
      connectedUsers.delete(token);
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`SoulQuad server running on http://localhost:${PORT}`);
});
