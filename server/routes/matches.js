import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';
import { createNotification } from './notifications.js';
import { authMiddleware } from './auth.js';

export const matchRoutes = Router();

matchRoutes.use(authMiddleware);

// MBTI dimension weights - I/E has highest impact on compatibility
const MBTI_WEIGHTS = {
  0: 15,  // I/E dimension - most important for relationship compatibility
  1: 8,   // S/N dimension - sensing vs intuition
  2: 8,   // T/F dimension - thinking vs feeling
  3: 5    // J/P dimension - judging vs perceiving, least impact
};

// MBTI personality letters
const MBTI_PAIRS = ['IE', 'SN', 'TF', 'JP'];

function calculateMBTIScore(mbtiA, mbtiB) {
  if (!mbtiA || !mbtiB) return 0;

  let score = 0;
  for (let i = 0; i < 4; i++) {
    if (mbtiA[i] === mbtiB[i]) {
      score += MBTI_WEIGHTS[i];
    }
  }
  return score;
}

function calculateSoulIndex(userA, userB) {
  let score = 50; // Base score

  // MBTI matching with weighted dimensions
  const mbtiScore = calculateMBTIScore(userA.mbti, userB.mbti);
  const maxMBTIScore = MBTI_WEIGHTS[0] + MBTI_WEIGHTS[1] + MBTI_WEIGHTS[2] + MBTI_WEIGHTS[3]; // 36
  score += (mbtiScore / maxMBTIScore) * 30; // Normalize to 0-30 range

  // Soul quadrant match
  if (userA.soul_quadrant && userB.soul_quadrant && userA.soul_quadrant === userB.soul_quadrant) {
    score += 12;
  }

  // Values matching
  const valuesA = typeof userA.values_json === 'string' ? JSON.parse(userA.values_json || '[]') : (userA.values_json || []);
  const valuesB = typeof userB.values_json === 'string' ? JSON.parse(userB.values_json || '[]') : (userB.values_json || []);
  const commonValues = valuesA.filter(v => valuesB.includes(v));
  score += Math.min(commonValues.length * 2.5, 15); // Max 15 points

  // Interests matching
  const interestsA = typeof userA.interests_json === 'string' ? JSON.parse(userA.interests_json || '[]') : (userA.interests_json || []);
  const interestsB = typeof userB.interests_json === 'string' ? JSON.parse(userB.interests_json || '[]') : (userB.interests_json || []);
  const commonInterests = interestsA.filter(i => interestsB.includes(i));
  score += Math.min(commonInterests.length * 1.5, 10); // Max 10 points

  return Math.min(100, Math.max(0, score));
}

function calculateUserQualityScore(user) {
  let quality = 0;

  // Profile completeness (0-20 points)
  const fields = ['nickname', 'avatar_url', 'avatar_data', 'bio', 'age', 'gender', 'mbti', 'soul_quadrant', 'city', 'education'];
  const filledFields = fields.filter(f => user[f]).length;
  quality += (filledFields / fields.length) * 20;

  // Activity score (0-20 points)
  if (user.last_active) {
    const hoursSinceActive = (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60 * 60);
    if (hoursSinceActive < 1) quality += 20;
    else if (hoursSinceActive < 24) quality += 15;
    else if (hoursSinceActive < 72) quality += 10;
    else if (hoursSinceActive < 168) quality += 5;
  } else {
    quality += 2; // Has some baseline activity
  }

  // Tier bonus (0-10 points)
  const tierBonus = { legend: 10, top: 8, excellent: 5, ordinary: 2 };
  quality += tierBonus[user.user_tier] || 2;

  // Soul score contribution (0-10 points)
  if (user.soul_score) {
    quality += Math.min(user.soul_score / 20, 10);
  }

  return Math.min(50, quality); // Max 50 points for quality
}

function calculateRecencyBoost(user) {
  if (!user.created_at) return 0;

  const daysSinceJoin = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);

  // New users (first 30 days) get a boost to help them get matches
  if (daysSinceJoin <= 7) return 8;
  if (daysSinceJoin <= 14) return 6;
  if (daysSinceJoin <= 30) return 4;
  if (daysSinceJoin <= 90) return 2;

  return 0;
}

function calculateDiversityScore(targetUser, currentUser, shownUsers) {
  if (!shownUsers || shownUsers.length === 0) return 0;

  let diversityPenalty = 0;

  // Penalize if same soul quadrant as recently shown users
  const recentQuadrants = shownUsers.slice(-3).map(u => u.soul_quadrant);
  if (recentQuadrants.includes(targetUser.soul_quadrant)) {
    diversityPenalty -= 5;
  }

  // Penalize if same MBTI first letter (I/E)
  const recentMBTIFirst = shownUsers.slice(-3).map(u => u.mbti ? u.mbti[0] : null);
  if (targetUser.mbti && recentMBTIFirst.includes(targetUser.mbti[0])) {
    diversityPenalty -= 3;
  }

  return diversityPenalty;
}

function rankUsers(candidates, currentUser, shownUsers = []) {
  const ScoredUsers = candidates.map(user => {
    // Base soul index
    const soulIndex = calculateSoulIndex(currentUser, user);

    // User quality bonus
    const qualityScore = calculateUserQualityScore(user);

    // Recency boost for new users
    const recencyBoost = calculateRecencyBoost(user);

    // Diversity adjustment
    const diversityAdj = calculateDiversityScore(user, currentUser, shownUsers);

    // Final score: weighted combination
    const finalScore = Math.round(
      (soulIndex * 0.5) +      // Soul compatibility (50%)
      (qualityScore * 0.3) +    // User quality (30%)
      (recencyBoost * 0.1) +    // Recency (10%)
      (diversityAdj * 0.1)      // Diversity (10%)
    );

    return {
      ...user,
      _soulIndex: soulIndex,
      _qualityScore: qualityScore,
      _recencyBoost: recencyBoost,
      _finalScore: finalScore
    };
  });

  // Sort by final score descending, then by recency for same scores
  ScoredUsers.sort((a, b) => {
    if (b._finalScore !== a._finalScore) {
      return b._finalScore - a._finalScore;
    }
    return b._recencyBoost - a._recencyBoost;
  });

  return ScoredUsers;
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
  // Viewer can see targets that are at most 1 tier below them, or any lower tier
  // ordinary(0) can see ordinary(0)
  // excellent(1) can see excellent(1) and ordinary(0)
  // top(2) can see top(2), excellent(1), ordinary(0)
  // legend(3) can see all tiers
  return tierRank[viewerTier] >= tierRank[targetTier] - 1 || tierRank[viewerTier] >= 3;
}

matchRoutes.get('/', async (req, res) => {
  const userId = req.userId;
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
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { location_mode, city_code, gender, age_min, age_max, education, mode } = req.query;

  try {
    const currentUser = await get('SELECT * FROM users WHERE id = $1', [userId]);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all passed/liked users
    const userMatches = await all(`
      SELECT * FROM matches
      WHERE oder_a_id = $1 OR oder_b_id = $1
    `, [userId]);

    const passedUserIds = new Set();
    userMatches.forEach(m => {
      if (m.oder_a_id === userId) passedUserIds.add(m.oder_b_id);
      if (m.oder_b_id === userId) passedUserIds.add(m.oder_a_id);
    });

    // Get blocked users
    const blockedUsers = await all(`
      SELECT blocked_user_id FROM user_blocklist WHERE user_id = $1
    `, [userId]);
    blockedUsers.forEach(b => passedUserIds.add(b.blocked_user_id));

    // Get potential users
    let allUsers = await all('SELECT * FROM users WHERE profile_completed = true AND id != $1', [userId]);

    // Filter out passed/blocked users
    allUsers = allUsers.filter(u => !passedUserIds.has(u.id));

    // Apply location filter
    if (location_mode === 'city' && city_code) {
      // city_code now contains city name (passed from frontend as selectedCity.name)
      allUsers = allUsers.filter(u => u.city && u.city.includes(city_code));
    }

    // Apply gender filter
    if (gender && gender !== 'all') {
      allUsers = allUsers.filter(u => u.gender === gender);
    }

    // Apply age filter
    if (age_min) {
      allUsers = allUsers.filter(u => u.age && u.age >= parseInt(age_min));
    }
    if (age_max) {
      allUsers = allUsers.filter(u => u.age && u.age <= parseInt(age_max));
    }

    // Apply education filter
    if (education && education !== '不限') {
      allUsers = allUsers.filter(u => u.education === education);
    }

    // Apply profile visibility filter
    const visibleUsers = allUsers.filter(u => canSeeProfile(currentUser, u));

    // Rank users with multi-factor scoring
    const rankedUsers = rankUsers(visibleUsers, currentUser);

    // Filter: only show users with soulmate_index >= 75
    const qualifiedUsers = rankedUsers.filter(u => u._soulIndex >= 75);

    // Return top 20 with ranking info
    const top20 = qualifiedUsers.slice(0, 20).map(u => {
      const { _soulIndex, _qualityScore, _recencyBoost, _finalScore, password_hash, ...rest } = u;
      return {
        ...rest,
        soulmate_index: _soulIndex,
        _debug: {
          soulScore: _soulIndex,
          qualityScore: _qualityScore,
          recencyBoost: _recencyBoost,
          finalScore: _finalScore
        }
      };
    });

    res.json(top20);
  } catch (err) {
    console.error('Get potential matches error:', err);
    res.status(500).json({ error: 'Failed to get potential matches' });
  }
});

matchRoutes.post('/like/:userId', async (req, res) => {
  const userId = req.userId;
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

    // Include matchId in the liked notification so user can navigate to chat
    await createNotification(targetId, 'like', '有人喜欢你', `${currentUser.nickname} 对你发送了喜欢`, { userId, matchId: match.id, targetUserId: userId });

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
  const userId = req.userId;
  const targetId = req.params.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!targetId) {
    return res.status(400).json({ error: 'Target user ID required' });
  }

  try {
    // Check if match record exists, if not create one with pass status
    const existingMatch = await get(`
      SELECT * FROM matches
      WHERE (oder_a_id = $1 AND oder_b_id = $2) OR (oder_a_id = $2 AND oder_b_id = $1)
    `, [userId, targetId]);

    if (!existingMatch) {
      // Create a passed record so we don't show this user again
      const matchId = crypto.randomUUID();
      const now = new Date().toISOString();

      await query(`
        INSERT INTO matches (id, oder_a_id, oder_b_id, soulmate_index, user_a_liked, user_b_liked, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [matchId, userId, targetId, 0, false, false, now]);
    }
    // If exists, we just ignore the pass (user already liked/passed)

    res.json({ success: true });
  } catch (err) {
    console.error('Pass error:', err);
    res.status(500).json({ error: 'Failed to process pass' });
  }
});