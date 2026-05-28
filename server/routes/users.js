import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';
import { authMiddleware } from './auth.js';

export const userRoutes = Router();

userRoutes.use(authMiddleware);

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password_salt, ...rest } = user;
  return rest;
}

function isValidGender(gender) {
  return ['male', 'female', 'other'].includes(gender);
}

function isValidPurpose(purpose) {
  return ['relationship', 'friendship', 'activity'].includes(purpose);
}

function isValidMode(mode) {
  return ['date', 'friend', 'partner'].includes(mode);
}

userRoutes.get('/', async (req, res) => {
  try {
    const users = await all(`
      SELECT id, username, nickname, age, gender, avatar_url, avatar_data, bio, mbti, soul_quadrant, soul_score, user_tier, is_verified, profile_completed, ai_description, created_at
      FROM users WHERE id != $1
    `, [req.userId]);

    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

userRoutes.get('/:id', async (req, res) => {
  try {
    const user = await get(`
      SELECT id, username, nickname, age, gender, avatar_url, avatar_data, bio, mbti, soul_quadrant, soul_score, user_tier, is_verified, profile_completed, ai_description, created_at
      FROM users WHERE id = $1
    `, [req.params.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

userRoutes.put('/profile', async (req, res) => {
  const { nickname, age, gender, bio, avatar_url, avatar_data, city, height, education, occupation, annual_income, has_house, has_car, purpose, mode } = req.body;

  if (nickname !== undefined && (nickname.length < 1 || nickname.length > 50)) {
    return res.status(400).json({ error: 'Nickname must be 1-50 characters' });
  }
  if (age !== undefined && (typeof age !== 'number' || age < 18 || age > 100)) {
    return res.status(400).json({ error: 'Age must be 18-100' });
  }
  if (gender !== undefined && !isValidGender(gender)) {
    return res.status(400).json({ error: 'Invalid gender' });
  }
  if (bio !== undefined && bio.length > 500) {
    return res.status(400).json({ error: 'Bio must be under 500 characters' });
  }
  if (purpose !== undefined && !isValidPurpose(purpose)) {
    return res.status(400).json({ error: 'Invalid purpose' });
  }
  if (mode !== undefined && !isValidMode(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (nickname !== undefined) { updates.push(`nickname = $${paramIndex++}`); values.push(nickname); }
  if (age !== undefined) { updates.push(`age = $${paramIndex++}`); values.push(age); }
  if (gender !== undefined) { updates.push(`gender = $${paramIndex++}`); values.push(gender); }
  if (bio !== undefined) { updates.push(`bio = $${paramIndex++}`); values.push(bio); }
  if (avatar_url !== undefined) { updates.push(`avatar_url = $${paramIndex++}`); values.push(avatar_url); }
  if (avatar_data !== undefined) { updates.push(`avatar_data = $${paramIndex++}`); values.push(avatar_data); }
  if (city !== undefined) { updates.push(`city = $${paramIndex++}`); values.push(city); }
  if (height !== undefined) { updates.push(`height = $${paramIndex++}`); values.push(height); }
  if (education !== undefined) { updates.push(`education = $${paramIndex++}`); values.push(education); }
  if (occupation !== undefined) { updates.push(`occupation = $${paramIndex++}`); values.push(occupation); }
  if (annual_income !== undefined) { updates.push(`annual_income = $${paramIndex++}`); values.push(annual_income); }
  if (has_house !== undefined) { updates.push(`has_house = $${paramIndex++}`); values.push(has_house); }
  if (has_car !== undefined) { updates.push(`has_car = $${paramIndex++}`); values.push(has_car); }
  if (purpose !== undefined) { updates.push(`purpose = $${paramIndex++}`); values.push(purpose); }
  if (mode !== undefined) { updates.push(`mode = $${paramIndex++}`); values.push(mode); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push(`updated_at = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(req.userId);

  try {
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const user = await get('SELECT * FROM users WHERE id = $1', [req.userId]);
    res.json({ ...sanitizeUser(user), success: true, message: '保存成功' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

userRoutes.post('/avatar', async (req, res) => {
  const { avatar_data } = req.body;
  if (!avatar_data) {
    return res.status(400).json({ error: 'Avatar data is required' });
  }

  if (avatar_data.length > 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large (max 1MB)' });
  }

  const validImageTypes = ['data:image/jpeg;', 'data:image/png;', 'data:image/webp;', 'data:image/gif;'];
  const isValidImage = validImageTypes.some(type => avatar_data.startsWith(type));
  if (!isValidImage) {
    return res.status(400).json({ error: 'Invalid image format' });
  }

  try {
    await query('UPDATE users SET avatar_data = $1, updated_at = $2 WHERE id = $3', [avatar_data, new Date().toISOString(), req.userId]);
    res.json({ success: true, avatar_data });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

userRoutes.get('/leaderboard', async (req, res) => {
  const type = req.query.type || 'hot';

  const allowedOrderBy = {
    hot: 'soul_score DESC',
    new: 'created_at DESC'
  };
  const orderBy = allowedOrderBy[type] || 'soul_score DESC';

  let limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 30);

  try {
    let sql = `
      SELECT id, nickname, avatar_data, avatar_url, mbti, soul_quadrant, soul_score, user_tier, match_count,
             (SELECT COUNT(*) FROM matches WHERE (oder_a_id = users.id OR oder_b_id = users.id) AND mutual_liked = true) as like_count
      FROM users
      WHERE profile_completed = true
    `;

    if (type === 'new') {
      sql += ' AND created_at > $1';
    }

    sql += ` ORDER BY ${orderBy} LIMIT 50`;

    const leaders = type === 'new'
      ? await all(sql, [limitDate.toISOString()])
      : await all(sql);

    res.json(leaders);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

userRoutes.get('/tier/leaderboard', async (req, res) => {
  const tier = req.query.tier || 'all';
  const type = req.query.type || 'hot';
  const city = req.query.city;

  const validTiers = ['legend', 'top', 'excellent', 'ordinary', 'all'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const allowedOrderBy = {
    hot: 'soul_score DESC',
    new: 'created_at DESC',
    city: 'soul_score DESC'
  };
  const orderBy = allowedOrderBy[type] || 'soul_score DESC';

  let limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 30);

  try {
    let sql = `
      SELECT id, nickname, avatar_data, avatar_url, mbti, soul_quadrant, soul_score, user_tier, match_count,
             (SELECT COUNT(*) FROM matches WHERE (oder_a_id = users.id OR oder_b_id = users.id) AND mutual_liked = true) as like_count
      FROM users
      WHERE profile_completed = true
    `;

    const params = [];

    if (type === 'new') {
      sql += ' AND created_at > $1';
      params.push(limitDate.toISOString());
    }

    if (tier !== 'all') {
      const paramIdx = params.length + 1;
      sql += ` AND user_tier = $${paramIdx}`;
      params.push(tier);
    }

    if (city) {
      const paramIdx = params.length + 1;
      sql += ` AND city = $${paramIdx}`;
      params.push(city);
    }

    sql += ` ORDER BY ${orderBy} LIMIT 20`;

    const leaders = await all(sql, params);

    res.json(leaders);
  } catch (err) {
    console.error('Tier leaderboard error:', err);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

userRoutes.get('/likes', async (req, res) => {
  try {
    const likes = await all(`
      SELECT u.* FROM matches m
      JOIN users u ON (
        (m.oder_a_id = $1 AND m.oder_b_id = u.id) OR
        (m.oder_b_id = $1 AND m.oder_a_id = u.id)
      )
      WHERE ((m.oder_a_id = $1 AND m.user_a_liked = true) OR (m.oder_b_id = $1 AND m.user_b_liked = true))
      AND m.mutual_liked = false
    `, [req.userId]);

    res.json(likes.map(sanitizeUser));
  } catch (err) {
    console.error('Get likes error:', err);
    res.status(500).json({ error: 'Failed to get likes' });
  }
});

userRoutes.delete('/likes/:userId', async (req, res) => {
  const targetId = req.params.userId;
  if (!targetId || targetId.length < 1) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    await query(`
      UPDATE matches
      SET user_a_liked = false, user_b_liked = false
      WHERE (oder_a_id = $1 AND oder_b_id = $2) OR (oder_a_id = $2 AND oder_b_id = $1)
    `, [req.userId, targetId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Cancel like error:', err);
    res.status(500).json({ error: 'Failed to cancel like' });
  }
});

userRoutes.get('/blocklist', async (req, res) => {
  try {
    const blockedUsers = await all(`
      SELECT u.id, u.nickname, u.avatar_url, u.mbti, u.soul_quadrant, u.user_tier
      FROM user_blocklist b
      JOIN users u ON b.blocked_user_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.userId]);

    res.json(blockedUsers);
  } catch (err) {
    console.error('Get blocklist error:', err);
    res.status(500).json({ error: 'Failed to get blocklist' });
  }
});

userRoutes.post('/block/:userId', async (req, res) => {
  const targetId = req.params.userId;
  if (!targetId || targetId === req.userId) {
    return res.status(400).json({ error: 'Invalid target user' });
  }

  try {
    const targetUser = await get('SELECT id FROM users WHERE id = $1', [targetId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query(`
      INSERT INTO user_blocklist (id, user_id, blocked_user_id, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, blocked_user_id) DO NOTHING
    `, [crypto.randomUUID(), req.userId, targetId, new Date().toISOString()]);

    res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    console.error('Block user error:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

userRoutes.delete('/block/:userId', async (req, res) => {
  const targetId = req.params.userId;
  if (!targetId) {
    return res.status(400).json({ error: 'Invalid target user' });
  }

  try {
    await query(`
      DELETE FROM user_blocklist
      WHERE user_id = $1 AND blocked_user_id = $2
    `, [req.userId, targetId]);

    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    console.error('Unblock user error:', err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});