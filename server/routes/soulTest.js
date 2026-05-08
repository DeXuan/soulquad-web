import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';

export const soulTestRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

soulTestRoutes.post('/', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mbti, soul_quadrant, values, interests } = req.body;

  if (!mbti || !soul_quadrant) {
    return res.status(400).json({ error: 'MBTI and soul quadrant are required' });
  }

  const db = getDb();

  const stmt = db.prepare(`
    UPDATE users
    SET mbti = ?,
        soul_quadrant = ?,
        values_json = ?,
        interests_json = ?,
        profile_completed = 1
    WHERE id = ?
  `);
  stmt.bind([mbti, soul_quadrant, JSON.stringify(values || []), JSON.stringify(interests || []), userId]);
  stmt.step();
  stmt.free();

  saveDb();

  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  userStmt.bind([userId]);
  userStmt.step();
  const user = userStmt.getAsObject();
  userStmt.free();

  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});