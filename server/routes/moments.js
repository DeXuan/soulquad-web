import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';

export const momentRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

function generateAnonymousName() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefixes = ['灵魂', '星辰', '月光', '微风', '晨曦', '薄雾', '流云', '夜星'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const c = chars[Math.floor(Math.random() * chars.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${p}${c}${num}`;
}

function formatMoment(moment) {
  return {
    ...moment,
    images: moment.images_json || [],
    images_json: undefined,
    user: moment.is_anonymous ? {
      id: 'anonymous',
      nickname: moment.anonymous_name || '匿名用户',
      avatar_url: '',
      user_tier: 'anonymous'
    } : {
      id: moment.user_id,
      nickname: moment.nickname,
      avatar_url: moment.avatar_url,
      user_tier: moment.user_tier
    }
  };
}

momentRoutes.get('/', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const moments = await all(`
      SELECT m.*, u.nickname, u.avatar_url, u.user_tier
      FROM moments m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const momentsWithImages = moments.map(formatMoment);

    const countResult = await get('SELECT COUNT(*) as count FROM moments');
    const total = countResult.count;

    res.json({ moments: momentsWithImages, hasMore: offset + moments.length < total });
  } catch (err) {
    console.error('Get moments error:', err);
    res.status(500).json({ error: 'Failed to get moments' });
  }
});

momentRoutes.get('/user/:userId', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const moments = await all(`
      SELECT m.*, u.nickname, u.avatar_url, u.user_tier
      FROM moments m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `, [req.params.userId]);

    const momentsWithImages = moments.map(formatMoment);

    res.json(momentsWithImages);
  } catch (err) {
    console.error('Get user moments error:', err);
    res.status(500).json({ error: 'Failed to get user moments' });
  }
});

momentRoutes.post('/', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, images, video_url, location, is_anonymous } = req.body;
  if (!content && !images && !video_url) {
    return res.status(400).json({ error: 'Content, images or video required' });
  }

  if (content && content.length > 2000) {
    return res.status(400).json({ error: 'Content too long (max 2000 chars)' });
  }
  if (location && location.length > 100) {
    return res.status(400).json({ error: 'Location too long (max 100 chars)' });
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const imagesJson = JSON.stringify(images || []);
    const anonymousName = is_anonymous ? generateAnonymousName() : '';

    await query(`
      INSERT INTO moments (id, user_id, content, images_json, video_url, location, is_anonymous, anonymous_name, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, userId, content || '', imagesJson, video_url || '', location || '', is_anonymous || false, anonymousName, now]);

    const moment = await get(`
      SELECT m.*, u.nickname, u.avatar_url, u.user_tier
      FROM moments m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [id]);

    res.json(formatMoment(moment));
  } catch (err) {
    console.error('Create moment error:', err);
    res.status(500).json({ error: 'Failed to create moment' });
  }
});

momentRoutes.delete('/:momentId', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const moment = await get('SELECT user_id FROM moments WHERE id = $1', [req.params.momentId]);

    if (!moment || moment.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query('DELETE FROM moments WHERE id = $1', [req.params.momentId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete moment error:', err);
    res.status(500).json({ error: 'Failed to delete moment' });
  }
});

momentRoutes.post('/:momentId/like', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const existing = await get(`
      SELECT id FROM moment_likes WHERE moment_id = $1 AND user_id = $2
    `, [req.params.momentId, userId]);

    if (existing) {
      await query('DELETE FROM moment_likes WHERE moment_id = $1 AND user_id = $2', [req.params.momentId, userId]);
    } else {
      await query(`
        INSERT INTO moment_likes (id, moment_id, user_id, created_at)
        VALUES ($1, $2, $3, $4)
      `, [crypto.randomUUID(), req.params.momentId, userId, new Date().toISOString()]);
    }

    const countResult = await get('SELECT COUNT(*) as count FROM moment_likes WHERE moment_id = $1', [req.params.momentId]);

    res.json({ liked: !existing, like_count: countResult.count });
  } catch (err) {
    console.error('Like moment error:', err);
    res.status(500).json({ error: 'Failed to like moment' });
  }
});

momentRoutes.get('/:momentId/comments', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const comments = await all(`
      SELECT c.*, u.nickname, u.avatar_url
      FROM moment_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.moment_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.momentId]);

    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

momentRoutes.post('/:momentId/comments', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }
  if (content.length > 500) {
    return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await query(`
      INSERT INTO moment_comments (id, moment_id, user_id, content, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, req.params.momentId, userId, content, now]);

    const comment = await get(`
      SELECT c.*, u.nickname, u.avatar_url
      FROM moment_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [id]);

    res.json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});