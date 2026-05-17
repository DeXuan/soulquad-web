import { Router } from 'express';
import { query, get } from '../db/database.js';
import { authMiddleware } from './auth.js';

export const soulTestRoutes = Router();

soulTestRoutes.use(authMiddleware);

soulTestRoutes.post('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mbti, soul_quadrant, values, interests } = req.body;

  if (!mbti || !soul_quadrant) {
    return res.status(400).json({ error: 'MBTI and soul quadrant are required' });
  }

  try {
    await query(`
      UPDATE users
      SET mbti = $1,
          soul_quadrant = $2,
          values_json = $3,
          interests_json = $4,
          profile_completed = true,
          updated_at = $5
      WHERE id = $6
    `, [mbti, soul_quadrant, JSON.stringify(values || []), JSON.stringify(interests || []), new Date().toISOString(), userId]);

    const user = await get('SELECT * FROM users WHERE id = $1', [userId]);

    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('Soul test error:', err);
    res.status(500).json({ error: 'Failed to save soul test' });
  }
});