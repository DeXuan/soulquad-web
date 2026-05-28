import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';
import { createNotification } from './notifications.js';
import { authMiddleware } from './auth.js';

export const momentRoutes = Router();

momentRoutes.use(authMiddleware);

function generateAnonymousName() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefixes = ['灵魂', '星辰', '月光', '微风', '晨曦', '薄雾', '流云', '夜星'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const c = chars[Math.floor(Math.random() * chars.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${p}${c}${num}`;
}

function formatMoment(moment, userId) {
  return {
    ...moment,
    images: moment.images_json || [],
    images_json: undefined,
    is_liked: !!moment.is_liked,
    like_count: moment.like_count || 0,
    comment_count: moment.comment_count || 0,
    user: moment.is_anonymous ? {
      id: 'anonymous',
      nickname: moment.anonymous_name || '匿名用户',
      avatar_url: '',
      avatar_data: '',
      user_tier: 'anonymous'
    } : {
      id: moment.user_id,
      nickname: moment.nickname,
      avatar_url: moment.avatar_url,
      avatar_data: moment.avatar_data || '',
      user_tier: moment.user_tier
    }
  };
}

momentRoutes.get('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const moments = await all(`
      SELECT m.*, u.nickname, u.avatar_url, u.avatar_data, u.user_tier,
             (SELECT COUNT(*) FROM moment_likes WHERE moment_id = m.id) as like_count,
             (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count,
             EXISTS(SELECT 1 FROM moment_likes WHERE moment_id = m.id AND user_id = $1) as is_liked
      FROM moments m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // Batch load comments for all moments (avoids N+1 queries)
    const momentIds = moments.map(m => m.id);
    let allComments = [];
    if (momentIds.length > 0) {
      allComments = await all(`
        SELECT c.*, u.nickname, u.avatar_url
        FROM moment_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.moment_id = ANY($1)
        ORDER BY c.created_at ASC
      `, [momentIds]);
    }

    // Group comments by moment_id, limit to 3 per moment
    const commentsByMoment = {};
    for (const c of allComments) {
      if (!commentsByMoment[c.moment_id]) commentsByMoment[c.moment_id] = [];
      if (commentsByMoment[c.moment_id].length < 3) {
        commentsByMoment[c.moment_id].push(c);
      }
    }

    const momentsWithComments = moments.map(m => ({
      ...formatMoment(m, userId),
      comments: commentsByMoment[m.id] || []
    }));

    const countResult = await get('SELECT COUNT(*) as count FROM moments');
    const total = countResult.count;

    res.json({ moments: momentsWithComments, hasMore: offset + moments.length < total });
  } catch (err) {
    console.error('Get moments error:', err);
    res.status(500).json({ error: 'Failed to get moments' });
  }
});

momentRoutes.get('/user/:userId', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const moments = await all(`
      SELECT m.*, u.nickname, u.avatar_url, u.avatar_data, u.user_tier,
             (SELECT COUNT(*) FROM moment_likes WHERE moment_id = m.id) as like_count,
             (SELECT COUNT(*) FROM moment_comments WHERE moment_id = m.id) as comment_count,
             EXISTS(SELECT 1 FROM moment_likes WHERE moment_id = m.id AND user_id = $1) as is_liked
      FROM moments m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = $2
      ORDER BY m.created_at DESC
    `, [userId, req.params.userId]);

    const momentsWithImages = moments.map(m => formatMoment(m, userId));

    res.json(momentsWithImages);
  } catch (err) {
    console.error('Get user moments error:', err);
    res.status(500).json({ error: 'Failed to get user moments' });
  }
});

momentRoutes.post('/', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, images, video_url, location, is_anonymous } = req.body;
  if (!content && !images && !video_url) {
    return res.status(400).json({ error: 'Content, images or video required' });
  }

  if (video_url && (video_url.length > 2000 || !/^https?:\/\//.test(video_url))) {
    return res.status(400).json({ error: 'Invalid video URL' });
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
      SELECT m.*, u.nickname, u.avatar_url, u.avatar_data, u.user_tier,
             0 as like_count, 0 as comment_count, false as is_liked
      FROM moments m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [id]);

    res.json(formatMoment(moment, userId));
  } catch (err) {
    console.error('Create moment error:', err);
    res.status(500).json({ error: 'Failed to create moment' });
  }
});

momentRoutes.delete('/:momentId', async (req, res) => {
  const userId = req.userId;
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
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const moment = await get('SELECT user_id FROM moments WHERE id = $1', [req.params.momentId]);
    if (!moment) {
      return res.status(404).json({ error: 'Moment not found' });
    }

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

      // Create notification for moment owner (if not self-like)
      if (moment.user_id !== userId) {
        const liker = await get('SELECT nickname FROM users WHERE id = $1', [userId]);
        await createNotification(
          moment.user_id,
          'moment_like',
          '有人赞了你的动态',
          `${liker?.nickname || '某人'} 赞了你的动态`,
          { momentId: req.params.momentId, type: 'moment_like', userId: userId }
        );

        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
          const socketId = global.connectedUsers?.get(moment.user_id);
          if (socketId) {
            io.to(socketId).emit('notification', { type: 'like', momentId: req.params.momentId });
          }
        }
      }
    }

    const countResult = await get('SELECT COUNT(*) as count FROM moment_likes WHERE moment_id = $1', [req.params.momentId]);

    res.json({ liked: !existing, like_count: countResult.count });
  } catch (err) {
    console.error('Like moment error:', err);
    res.status(500).json({ error: 'Failed to like moment' });
  }
});

momentRoutes.get('/:momentId/comments', async (req, res) => {
  const userId = req.userId;
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
  const userId = req.userId;
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
    const moment = await get('SELECT user_id FROM moments WHERE id = $1', [req.params.momentId]);
    if (!moment) {
      return res.status(404).json({ error: 'Moment not found' });
    }

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

    // Create notification for moment owner (if not self-comment)
    if (moment.user_id !== userId) {
      const commenter = await get('SELECT nickname FROM users WHERE id = $1', [userId]);
      await createNotification(
        moment.user_id,
        'moment_comment',
        '有人评论了你的动态',
        `${commenter?.nickname || '某人'} 评论了你的动态: ${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`,
        { momentId: req.params.momentId, commentId: id, type: 'moment_comment', userId: userId }
      );

      // Emit socket event for real-time notification
      const io = req.app.get('io');
      if (io) {
        const socketId = global.connectedUsers?.get(moment.user_id);
        if (socketId) {
          io.to(socketId).emit('notification', { type: 'comment', momentId: req.params.momentId });
        }
      }
    }

    res.json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});