import { Router } from 'express';
import crypto from 'crypto';
import { getDb, saveDb } from '../db/database.js';

export const momentRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

momentRoutes.get('/', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const db = getDb();

  // Get moments with user info
  const stmt = db.prepare(`
    SELECT m.*, u.nickname, u.avatar_url, u.user_tier
    FROM moments m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `);
  stmt.bind([limit, offset]);
  const moments = [];
  while (stmt.step()) {
    const m = stmt.getAsObject();
    m.images = m.images_json ? JSON.parse(m.images_json) : [];
    delete m.images_json;
    moments.push(m);
  }
  stmt.free();

  // Get total count
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM moments');
  countStmt.step();
  const total = countStmt.getAsObject().count;
  countStmt.free();

  res.json({ moments, hasMore: offset + moments.length < total });
});

momentRoutes.get('/user/:userId', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT m.*, u.nickname, u.avatar_url, u.user_tier
    FROM moments m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `);
  stmt.bind([req.params.userId]);
  const moments = [];
  while (stmt.step()) {
    const m = stmt.getAsObject();
    m.images = m.images_json ? JSON.parse(m.images_json) : [];
    delete m.images_json;
    moments.push(m);
  }
  stmt.free();

  res.json(moments);
});

momentRoutes.post('/', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, images, video_url, location } = req.body;
  if (!content && !images && !video_url) {
    return res.status(400).json({ error: 'Content, images or video required' });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO moments (id, user_id, content, images_json, video_url, location, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.bind([id, userId, content || '', JSON.stringify(images || []), video_url || '', location || '', now]);
  stmt.step();
  stmt.free();
  saveDb();

  // Get the created moment with user info
  const getStmt = db.prepare(`
    SELECT m.*, u.nickname, u.avatar_url, u.user_tier
    FROM moments m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `);
  getStmt.bind([id]);
  getStmt.step();
  const moment = getStmt.getAsObject();
  getStmt.free();

  res.json(moment);
});

momentRoutes.delete('/:momentId', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  // Check ownership
  const checkStmt = db.prepare('SELECT user_id FROM moments WHERE id = ?');
  checkStmt.bind([req.params.momentId]);
  checkStmt.step();
  const moment = checkStmt.getAsObject();
  checkStmt.free();

  if (!moment || moment.user_id !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const deleteStmt = db.prepare('DELETE FROM moments WHERE id = ?');
  deleteStmt.bind([req.params.momentId]);
  deleteStmt.step();
  deleteStmt.free();
  saveDb();

  res.json({ success: true });
});

momentRoutes.post('/:momentId/like', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  // Toggle like
  const checkStmt = db.prepare('SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?');
  checkStmt.bind([req.params.momentId, userId]);
  checkStmt.step();
  const existing = checkStmt.getAsObject();
  checkStmt.free();

  if (existing.id) {
    // Unlike
    const deleteStmt = db.prepare('DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?');
    deleteStmt.bind([req.params.momentId, userId]);
    deleteStmt.step();
    deleteStmt.free();
  } else {
    // Like
    const insertStmt = db.prepare('INSERT INTO moment_likes (id, moment_id, user_id, created_at) VALUES (?, ?, ?, ?)');
    insertStmt.bind([crypto.randomUUID(), req.params.momentId, userId, new Date().toISOString()]);
    insertStmt.step();
    insertStmt.free();
  }
  saveDb();

  // Get like count
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM moment_likes WHERE moment_id = ?');
  countStmt.bind([req.params.momentId]);
  countStmt.step();
  const likeCount = countStmt.getAsObject().count;
  countStmt.free();

  res.json({ liked: !existing.id, like_count: likeCount });
});

momentRoutes.get('/:momentId/comments', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT c.*, u.nickname, u.avatar_url
    FROM moment_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.moment_id = ?
    ORDER BY c.created_at ASC
  `);
  stmt.bind([req.params.momentId]);
  const comments = [];
  while (stmt.step()) {
    comments.push(stmt.getAsObject());
  }
  stmt.free();

  res.json(comments);
});

momentRoutes.post('/:momentId/comments', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO moment_comments (id, moment_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.bind([id, req.params.momentId, userId, content, now]);
  stmt.step();
  stmt.free();
  saveDb();

  // Get the created comment with user info
  const getStmt = db.prepare(`
    SELECT c.*, u.nickname, u.avatar_url
    FROM moment_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `);
  getStmt.bind([id]);
  getStmt.step();
  const comment = getStmt.getAsObject();
  getStmt.free();

  res.json(comment);
});