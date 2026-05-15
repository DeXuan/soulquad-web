import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';
import { createNotification } from './notifications.js';

export const matchRoutes = Router();

function getCurrentUserId(req) {
  return req.headers['x-user-id'];
}

function calculateSoulIndex(userA, userB) {
  let score = 50;

  if (userA.mbti && userB.mbti) {
    let matches = 0;
    for (let i = 0; i < 4; i++) {
      if (userA.mbti[i] === userB.mbti[i]) matches++;
    }
    score += matches * 10;
  }

  if (userA.soul_quadrant && userB.soul_quadrant && userA.soul_quadrant === userB.soul_quadrant) {
    score += 15;
  }

  const valuesA = typeof userA.values_json === 'string' ? JSON.parse(userA.values_json || '[]') : (userA.values_json || []);
  const valuesB = typeof userB.values_json === 'string' ? JSON.parse(userB.values_json || '[]') : (userB.values_json || []);
  const commonValues = valuesA.filter(v => valuesB.includes(v));
  score += commonValues.length * 3;

  const interestsA = typeof userA.interests_json === 'string' ? JSON.parse(userA.interests_json || '[]') : (userA.interests_json || []);
  const interestsB = typeof userB.interests_json === 'string' ? JSON.parse(userB.interests_json || '[]') : (userB.interests_json || []);
  const commonInterests = interestsA.filter(i => interestsB.includes(i));
  score += commonInterests.length * 2;

  return Math.min(100, Math.max(0, score));
}

function calculateTier(soulScore, matchCount, activity) {
  if (soulScore >= 95 && matchCount >= 50) return 'legend';
  if (soulScore >= 85 && matchCount >= 30) return 'top';
  if (soulScore >= 70 && matchCount >= 10) return 'excellent';
  return 'ordinary';
}

const tierRank = { ordinary: 0, excellent: 1, top: 2, legend: 3 };

function canSeeProfile(viewer, target) {
  const viewerTier = viewer.user_tier || 'ordinary';
  const targetTier = target.user_tier || 'ordinary';
  return tierRank[viewerTier] >= tierRank[targetTier] - 1;
}

matchRoutes.get('/', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userMatches = await all(`
      SELECT * FROM matches
      WHERE oder_a_id = $1 OR oder_b_id = $1
    `, [userId]);

    res.json(userMatches.map(m => ({
      ...m,
      user_a_liked: !!m.user_a_liked,
      user_b_liked: !!m.user_b_liked,
      mutual_liked: !!m.mutual_liked
    })));
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

matchRoutes.get('/potential', async (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const currentUser = await get('SELECT * FROM users WHERE id = $1', [userId]);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userMatches = await all(`
      SELECT * FROM matches
      WHERE oder_a_id = $1 OR oder_b_id = $1
    `, [userId]);

    const passedUserIds = new Set();
    userMatches.forEach(m => {
      if (m.oder_a_id === userId) passedUserIds.add(m.oder_b_id);
      if (m.oder_b_id === userId) passedUserIds.add(m.oder_a_id);
    });

    const allUsers = await all('SELECT * FROM users WHERE profile_completed = true');

    const potentialUsers = allUsers.filter(u =>
      u.id !== userId && !passedUserIds.has(u.id)
    );

    const visibleUsers = potentialUsers.filter(u => canSeeProfile(currentUser, u));

    res.json(visibleUsers.slice(0, 20));
  } catch (err) {
    console.error('Get potential matches error:', err);
    res.status(500).json({ error: 'Failed to get potential matches' });
  }
});

matchRoutes.post('/like/:userId', async (req, res) => {
  const userId = getCurrentUserId(req);
  const targetId = req.params.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const targetUser = await get('SELECT * FROM users WHERE id = $1', [targetId]);
    const currentUser = await get('SELECT * FROM users WHERE id = $1', [userId]);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingMatch = await get(`
      SELECT * FROM matches
      WHERE (oder_a_id = $1 AND oder_b_id = $2) OR (oder_a_id = $2 AND oder_b_id = $1)
    `, [userId, targetId]);

    const soulIndex = calculateSoulIndex(currentUser, targetUser);
    let matchedNow = false;
    let match = existingMatch;

    if (!match) {
      const matchId = crypto.randomUUID();
      const now = new Date().toISOString();

      await query(`
        INSERT INTO matches (id, oder_a_id, oder_b_id, soulmate_index, user_a_liked, user_b_liked, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [matchId, userId, targetId, soulIndex, true, false, now]);

      await createNotification(targetId, 'like', '有人喜欢你', `${currentUser.nickname} 对你发送了喜欢`, { userId });

      match = await get('SELECT * FROM matches WHERE id = $1', [matchId]);
    } else {
      const isUserA = match.oder_a_id === userId;
      const field = isUserA ? 'user_a_liked' : 'user_b_liked';

      await query(`UPDATE matches SET ${field} = true WHERE id = $1`, [match.id]);

      const otherLiked = isUserA ? match.user_b_liked : match.user_a_liked;
      if (otherLiked) {
        await query('UPDATE matches SET mutual_liked = true, matched_at = $1 WHERE id = $2', [new Date().toISOString(), match.id]);
        match.mutual_liked = true;
        matchedNow = true;
      }

      match = await get('SELECT * FROM matches WHERE id = $1', [match.id]);
    }

    if (matchedNow) {
      await query('UPDATE users SET match_count = match_count + 1 WHERE id = $1', [userId]);
      await query('UPDATE users SET match_count = match_count + 1 WHERE id = $1', [targetId]);

      const updatedCurrent = await get('SELECT * FROM users WHERE id = $1', [userId]);
      const updatedTarget = await get('SELECT * FROM users WHERE id = $1', [targetId]);

      const newTierCurrent = calculateTier(updatedCurrent.soul_score, updatedCurrent.match_count, updatedCurrent.activity_score);
      const newTierTarget = calculateTier(updatedTarget.soul_score, updatedTarget.match_count, updatedTarget.activity_score);

      await query('UPDATE users SET user_tier = $1 WHERE id = $2', [newTierCurrent, userId]);
      await query('UPDATE users SET user_tier = $1 WHERE id = $2', [newTierTarget, targetId]);

      await createNotification(userId, 'match', '匹配成功！', `你与 ${targetUser.nickname} 成功匹配`, { matchId: match.id, userId: targetId });
      await createNotification(targetId, 'match', '匹配成功！', `你与 ${currentUser.nickname} 成功匹配`, { matchId: match.id, userId });
    }

    res.json({
      matched: !!match.mutual_liked,
      match: {
        ...match,
        user_a_liked: !!match.user_a_liked,
        user_b_liked: !!match.user_b_liked,
        mutual_liked: !!match.mutual_liked
      }
    });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to process like' });
  }
});

matchRoutes.post('/pass/:userId', async (req, res) => {
  const userId = getCurrentUserId(req);
  const targetId = req.params.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ success: true });
});