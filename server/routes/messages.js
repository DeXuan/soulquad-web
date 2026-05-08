import { Router } from 'express';
import crypto from 'crypto';
import { getDb, saveDb } from '../db/database.js';

export const messageRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

messageRoutes.get('/:matchId', (req, res) => {
  const userId = getCurrentUserId(req);
  const { matchId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  const matchStmt = db.prepare('SELECT * FROM matches WHERE id = ?');
  matchStmt.bind([matchId]);
  if (!matchStmt.step()) {
    matchStmt.free();
    return res.status(404).json({ error: 'Match not found' });
  }
  const match = matchStmt.getAsObject();
  matchStmt.free();

  if (match.oder_a_id !== userId && match.oder_b_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const msgStmt = db.prepare(`
    SELECT * FROM messages
    WHERE match_id = ?
    ORDER BY created_at ASC
  `);
  msgStmt.bind([matchId]);

  const messages = [];
  while (msgStmt.step()) {
    const m = msgStmt.getAsObject();
    messages.push({
      ...m,
      read_at: m.read_at ? new Date(m.read_at).toISOString() : null
    });
  }
  msgStmt.free();

  res.json(messages);
});

messageRoutes.post('/:matchId', (req, res) => {
  const userId = getCurrentUserId(req);
  const { matchId } = req.params;
  const { content } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const db = getDb();

  const matchStmt = db.prepare('SELECT * FROM matches WHERE id = ?');
  matchStmt.bind([matchId]);
  if (!matchStmt.step()) {
    matchStmt.free();
    return res.status(404).json({ error: 'Match not found' });
  }
  const match = matchStmt.getAsObject();
  matchStmt.free();

  if (!match.mutual_liked) {
    return res.status(403).json({ error: 'Can only message matched users' });
  }

  if (match.oder_a_id !== userId && match.oder_b_id !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO messages (id, match_id, sender_id, content, message_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertStmt.bind([id, matchId, userId, content.trim(), 'text', now]);
  insertStmt.step();
  insertStmt.free();

  saveDb();

  const message = {
    id,
    match_id: matchId,
    sender_id: userId,
    content: content.trim(),
    message_type: 'text',
    created_at: now,
    read_at: null
  };

  res.json(message);
});

messageRoutes.post('/:matchId/read', (req, res) => {
  const userId = getCurrentUserId(req);
  const { matchId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE messages
    SET read_at = ?
    WHERE match_id = ? AND sender_id != ? AND read_at IS NULL
  `);
  stmt.bind([now, matchId, userId]);
  stmt.step();
  stmt.free();

  saveDb();

  res.json({ success: true });
});
