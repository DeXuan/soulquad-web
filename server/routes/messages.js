import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';

export const messageRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

messageRoutes.get('/:matchId', async (req, res) => {
  const userId = getCurrentUserId(req);
  const { matchId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const match = await get('SELECT * FROM matches WHERE id = $1', [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.oder_a_id !== userId && match.oder_b_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await all(`
      SELECT * FROM messages
      WHERE match_id = $1
      ORDER BY created_at ASC
    `, [matchId]);

    res.json(messages.map(m => ({
      ...m,
      read_at: m.read_at ? new Date(m.read_at).toISOString() : null
    })));
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

messageRoutes.post('/:matchId', async (req, res) => {
  const userId = getCurrentUserId(req);
  const { matchId } = req.params;
  const { content, message_type } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const match = await get('SELECT * FROM matches WHERE id = $1', [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!match.mutual_liked) {
      return res.status(403).json({ error: 'Can only message matched users' });
    }

    if (match.oder_a_id !== userId && match.oder_b_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const msgType = message_type || 'text';

    await query(`
      INSERT INTO messages (id, match_id, sender_id, content, message_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, matchId, userId, content.trim(), msgType, now]);

    const message = {
      id,
      match_id: matchId,
      sender_id: userId,
      content: content.trim(),
      message_type: msgType,
      created_at: now,
      read_at: null
    };

    // Emit socket event for real-time message delivery
    const io = req.app.get('io');
    if (io) {
      // Emit to the match room so both users get the message
      io.to(matchId).emit('new_message', message);

      // Also notify the other user directly if online
      const otherUserId = match.oder_a_id === userId ? match.oder_b_id : match.oder_a_id;
      const socketId = global.connectedUsers?.get(otherUserId);
      if (socketId) {
        io.to(socketId).emit('message_notification', {
          matchId,
          message
        });
      }
    }

    res.json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

messageRoutes.post('/:matchId/read', async (req, res) => {
  const userId = getCurrentUserId(req);
  const { matchId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();
    await query(`
      UPDATE messages
      SET read_at = $1
      WHERE match_id = $2 AND sender_id != $3 AND read_at IS NULL
    `, [now, matchId, userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});