import { Router } from 'express';
import { getDb, saveDb } from '../db/database.js';

export const userRoutes = Router();

function getCurrentUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const userId = req.headers['x-user-id'];
  if (!userId) return null;

  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([userId]);

  let user = null;
  if (stmt.step()) {
    user = stmt.getAsObject();
  }
  stmt.free();
  return user;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

userRoutes.get('/', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, username, nickname, age, gender, avatar_url, avatar_data, bio, mbti, soul_quadrant, soul_score, user_tier, is_verified, profile_completed, ai_description, created_at
    FROM users
    WHERE id != ?
  `);
  stmt.bind([currentUser.id]);

  const users = [];
  while (stmt.step()) {
    users.push(stmt.getAsObject());
  }
  stmt.free();

  res.json(users);
});

userRoutes.get('/:id', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, username, nickname, age, gender, avatar_url, avatar_data, bio, mbti, soul_quadrant, soul_score, user_tier, is_verified, profile_completed, ai_description, created_at
    FROM users WHERE id = ?
  `);
  stmt.bind([req.params.id]);

  if (!stmt.step()) {
    stmt.free();
    return res.status(404).json({ error: 'User not found' });
  }

  const user = stmt.getAsObject();
  stmt.free();

  res.json(sanitizeUser(user));
});

userRoutes.put('/profile', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { nickname, age, gender, bio, avatar_url, avatar_data, city, height, education, has_house, has_car, purpose, mode } = req.body;
  const db = getDb();

  // Build dynamic update query - only update fields that are explicitly provided
  const updates = [];
  const values = [];

  if (nickname !== undefined) { updates.push('nickname = ?'); values.push(nickname); }
  if (age !== undefined) { updates.push('age = ?'); values.push(age); }
  if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
  if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
  if (avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(avatar_url); }
  if (avatar_data !== undefined) { updates.push('avatar_data = ?'); values.push(avatar_data); }
  if (city !== undefined) { updates.push('city = ?'); values.push(city); }
  if (height !== undefined) { updates.push('height = ?'); values.push(height); }
  if (education !== undefined) { updates.push('education = ?'); values.push(education); }
  if (has_house !== undefined) { updates.push('has_house = ?'); values.push(has_house ? 1 : 0); }
  if (has_car !== undefined) { updates.push('has_car = ?'); values.push(has_car ? 1 : 0); }
  if (purpose !== undefined) { updates.push('purpose = ?'); values.push(purpose); }
  if (mode !== undefined) { updates.push('mode = ?'); values.push(mode); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(currentUser.id);
  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
  stmt.bind(values);
  stmt.step();
  stmt.free();
  saveDb();

  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  userStmt.bind([currentUser.id]);
  userStmt.step();
  const user = userStmt.getAsObject();
  userStmt.free();

  res.json(sanitizeUser(user));
});

userRoutes.post('/avatar', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { avatar_data } = req.body;
  if (!avatar_data) {
    return res.status(400).json({ error: 'Avatar data is required' });
  }

  if (avatar_data.length > 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large (max 1MB)' });
  }

  const db = getDb();
  const stmt = db.prepare('UPDATE users SET avatar_data = ? WHERE id = ?');
  stmt.bind([avatar_data, currentUser.id]);
  stmt.step();
  stmt.free();
  saveDb();

  res.json({ success: true, avatar_data });
});

userRoutes.get('/leaderboard', (req, res) => {
  const db = getDb();
  const type = req.query.type || 'hot';

  let orderBy = 'soul_score DESC';
  let limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 30);

  if (type === 'new') {
    orderBy = 'created_at DESC';
  }

  let query = `
    SELECT id, nickname, avatar_data, mbti, soul_quadrant, soul_score, user_tier, match_count,
           (SELECT COUNT(*) FROM matches WHERE oder_a_id = users.id OR oder_b_id = users.id AND mutual_liked = 1) as like_count
    FROM users
    WHERE profile_completed = 1
  `;

  if (type === 'new') {
    query += ` AND created_at > '${limitDate.toISOString()}'`;
  }

  query += ` ORDER BY ${orderBy} LIMIT 50`;

  const stmt = db.prepare(query);

  const leaders = [];
  while (stmt.step()) {
    leaders.push(stmt.getAsObject());
  }
  stmt.free();

  res.json(leaders);
});

userRoutes.get('/tier/leaderboard', (req, res) => {
  const db = getDb();
  const tier = req.query.tier || 'all';

  let query = `
    SELECT id, nickname, avatar_data, mbti, soul_quadrant, soul_score, user_tier, match_count,
           (SELECT COUNT(*) FROM matches WHERE (oder_a_id = users.id OR oder_b_id = users.id) AND mutual_liked = 1) as like_count
    FROM users
    WHERE profile_completed = 1
  `;

  if (tier !== 'all') {
    query += ' AND user_tier = ?';
  }

  query += ' ORDER BY soul_score DESC LIMIT 20';

  const stmt = db.prepare(query);
  if (tier !== 'all') {
    stmt.bind([tier]);
  }

  const leaders = [];
  while (stmt.step()) {
    leaders.push(stmt.getAsObject());
  }
  stmt.free();

  res.json(leaders);
});

// Get user's liked列表 (users they liked but not matched)
userRoutes.get('/likes', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  // Get matches where current user liked the other
  const stmt = db.prepare(`
    SELECT m.*, u.id as target_id, u.nickname, u.avatar_data, u.mbti, u.soul_quadrant, u.age, u.gender
    FROM matches m
    JOIN users u ON (
      (m.oder_a_id = ? AND m.oder_b_id = u.id) OR
      (m.oder_b_id = ? AND m.oder_a_id = u.id)
    )
    WHERE ((m.oder_a_id = ? AND m.user_a_liked = 1) OR (m.oder_b_id = ? AND m.user_b_liked = 1))
    AND m.mutual_liked = 0
  `);
  stmt.bind([currentUser.id, currentUser.id, currentUser.id, currentUser.id]);

  const likes = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    // Get the target user info
    const targetId = row.oder_a_id === currentUser.id ? row.oder_b_id : row.oder_a_id;
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    userStmt.bind([targetId]);
    if (userStmt.step()) {
      likes.push(sanitizeUser(userStmt.getAsObject()));
    }
    userStmt.free();
  }
  stmt.free();

  res.json(likes);
});

// Cancel a like
userRoutes.delete('/likes/:userId', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetId = req.params.userId;
  const db = getDb();

  // Find and update the match record
  const stmt = db.prepare(`
    SELECT * FROM matches
    WHERE (oder_a_id = ? AND oder_b_id = ?) OR (oder_a_id = ? AND oder_b_id = ?)
  `);
  stmt.bind([currentUser.id, targetId, targetId, currentUser.id]);

  let match = null;
  if (stmt.step()) {
    match = stmt.getAsObject();
  }
  stmt.free();

  if (match) {
    const updateStmt = db.prepare(`
      UPDATE matches
      SET user_a_liked = 0, user_b_liked = 0
      WHERE id = ?
    `);
    updateStmt.bind([match.id]);
    updateStmt.step();
    updateStmt.free();
    saveDb();
  }

  res.json({ success: true });
});

// Get blocklist
userRoutes.get('/blocklist', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // This would need a blocklist table - for now return empty
  res.json([]);
});

// Block a user
userRoutes.post('/block/:userId', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ success: true });
});

// Unblock a user
userRoutes.delete('/block/:userId', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ success: true });
});