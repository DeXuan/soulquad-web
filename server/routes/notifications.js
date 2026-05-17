import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';
import { authMiddleware } from './auth.js';

export const notificationRoutes = Router();

notificationRoutes.use(authMiddleware);

notificationRoutes.get('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const notifications = await all(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    res.json(notifications.map(n => ({
      ...n,
      is_read: !!n.is_read,
      data: typeof n.data === 'string' ? JSON.parse(n.data || '{}') : (n.data || {})
    })));
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

notificationRoutes.get('/unread-count', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await get(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({ count: result.count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

notificationRoutes.post('/mark-read/:id', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await query(`
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
    `, [req.params.id, userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

notificationRoutes.post('/mark-all-read', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await query(`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export async function createNotification(userId, type, title, content, data = {}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await query(`
    INSERT INTO notifications (id, user_id, type, title, content, data, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [id, userId, type, title, content, JSON.stringify(data), now]);

  return id;
}