import { Router } from 'express';
import crypto from 'crypto';
import { getDb, saveDb } from '../db/database.js';

export const notificationRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

notificationRoutes.get('/', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `);
  stmt.bind([userId]);

  const notifications = [];
  while (stmt.step()) {
    const n = stmt.getAsObject();
    notifications.push({
      ...n,
      read: !!n.read,
      data: n.data ? JSON.parse(n.data) : {}
    });
  }
  stmt.free();

  res.json(notifications);
});

notificationRoutes.get('/unread-count', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND read = 0
  `);
  stmt.bind([userId]);
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();

  res.json({ count: result.count });
});

notificationRoutes.post('/mark-read/:id', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    UPDATE notifications
    SET read = 1
    WHERE id = ? AND user_id = ?
  `);
  stmt.bind([req.params.id, userId]);
  stmt.step();
  stmt.free();
  saveDb();

  res.json({ success: true });
});

notificationRoutes.post('/mark-all-read', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    UPDATE notifications
    SET read = 1
    WHERE user_id = ? AND read = 0
  `);
  stmt.bind([userId]);
  stmt.step();
  stmt.free();
  saveDb();

  res.json({ success: true });
});

export function createNotification(db, userId, type, title, content, data = {}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, data, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.bind([id, userId, type, title, content, JSON.stringify(data), now]);
  stmt.step();
  stmt.free();

  saveDb();
  return id;
}
