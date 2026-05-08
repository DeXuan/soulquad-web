import { Router } from 'express';
import crypto from 'crypto';
import { getDb, saveDb } from '../db/database.js';
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

  const valuesA = JSON.parse(userA.values_json || '[]');
  const valuesB = JSON.parse(userB.values_json || '[]');
  const commonValues = valuesA.filter(v => valuesB.includes(v));
  score += commonValues.length * 3;

  const interestsA = JSON.parse(userA.interests_json || '[]');
  const interestsB = JSON.parse(userB.interests_json || '[]');
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

function getAllMatches(db) {
  const stmt = db.prepare('SELECT * FROM matches');
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function getAllUsers(db) {
  const stmt = db.prepare('SELECT * FROM users WHERE profile_completed = 1');
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

matchRoutes.get('/', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  const allMatches = getAllMatches(db);
  const userMatches = allMatches.filter(m => m.oder_a_id === userId || m.oder_b_id === userId);

  res.json(userMatches.map(m => ({
    ...m,
    user_a_liked: !!m.user_a_liked,
    user_b_liked: !!m.user_b_liked,
    mutual_liked: !!m.mutual_liked
  })));
});

matchRoutes.get('/potential', (req, res) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  // Get current user
  const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  userStmt.bind([userId]);
  userStmt.step();
  const currentUser = userStmt.getAsObject();
  userStmt.free();

  // Get all matches involving this user
  const allMatches = getAllMatches(db);
  const userMatches = allMatches.filter(m => m.oder_a_id === userId || m.oder_b_id === userId);

  // Get IDs of users already shown/liked
  const passedUserIds = new Set();
  userMatches.forEach(m => {
    if (m.oder_a_id === userId) {
      passedUserIds.add(m.oder_b_id);
    }
    if (m.oder_b_id === userId) {
      passedUserIds.add(m.oder_a_id);
    }
  });

  // Get all users who completed profile
  const allUsers = getAllUsers(db);

  // Filter out current user and already shown users
  const potentialUsers = allUsers.filter(u =>
    u.id !== userId && !passedUserIds.has(u.id)
  );

  // Apply tier visibility filter
  const visibleUsers = potentialUsers.filter(u => canSeeProfile(currentUser, u));

  res.json(visibleUsers.slice(0, 20));
});

matchRoutes.post('/like/:userId', (req, res) => {
  const userId = getCurrentUserId(req);
  const targetId = req.params.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  const targetStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  targetStmt.bind([targetId]);
  targetStmt.step();
  const targetUser = targetStmt.getAsObject();
  targetStmt.free();

  const currentStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  currentStmt.bind([userId]);
  currentStmt.step();
  const currentUser = currentStmt.getAsObject();
  currentStmt.free();

  const allMatches = getAllMatches(db);
  let match = allMatches.find(m =>
    (m.oder_a_id === userId && m.oder_b_id === targetId) ||
    (m.oder_a_id === targetId && m.oder_b_id === userId)
  );

  const soulIndex = calculateSoulIndex(currentUser, targetUser);
  let matchedNow = false;

  if (!match) {
    const matchId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO matches (id, oder_a_id, oder_b_id, soulmate_index, user_a_liked, user_b_liked, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.bind([matchId, userId, targetId, soulIndex, 1, 0, now]);
    insertStmt.step();
    insertStmt.free();

    createNotification(db, targetId, 'like', '有人喜欢你', `${currentUser.nickname} 对你发送了喜欢`, { userId });

    const getMatchStmt = db.prepare('SELECT * FROM matches WHERE id = ?');
    getMatchStmt.bind([matchId]);
    getMatchStmt.step();
    match = getMatchStmt.getAsObject();
    getMatchStmt.free();
  } else {
    const isUserA = match.oder_a_id === userId;
    const updateStmt = db.prepare(`UPDATE matches SET ${isUserA ? 'user_a_liked' : 'user_b_liked'} = 1 WHERE id = ?`);
    updateStmt.bind([match.id]);
    updateStmt.step();
    updateStmt.free();

    const otherLiked = isUserA ? match.user_b_liked : match.user_a_liked;
    if (otherLiked) {
      const matchUpdateStmt = db.prepare('UPDATE matches SET mutual_liked = 1, matched_at = ? WHERE id = ?');
      matchUpdateStmt.bind([new Date().toISOString(), match.id]);
      matchUpdateStmt.step();
      matchUpdateStmt.free();
      match.mutual_liked = 1;
      matchedNow = true;
    }
  }

  if (matchedNow) {
    const updateCountStmt = db.prepare('UPDATE users SET match_count = match_count + 1 WHERE id = ?');
    updateCountStmt.bind([userId]);
    updateCountStmt.step();
    updateCountStmt.free();

    updateCountStmt.bind([targetId]);
    updateCountStmt.step();
    updateCountStmt.free();

    const updatedCurrentStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    updatedCurrentStmt.bind([userId]);
    updatedCurrentStmt.step();
    const updatedCurrent = updatedCurrentStmt.getAsObject();
    updatedCurrentStmt.free();

    const updatedTargetStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    updatedTargetStmt.bind([targetId]);
    updatedTargetStmt.step();
    const updatedTarget = updatedTargetStmt.getAsObject();
    updatedTargetStmt.free();

    const newTierCurrent = calculateTier(updatedCurrent.soul_score, updatedCurrent.match_count, updatedCurrent.activity_score);
    const newTierTarget = calculateTier(updatedTarget.soul_score, updatedTarget.match_count, updatedTarget.activity_score);

    const tierUpdateStmt = db.prepare('UPDATE users SET user_tier = ? WHERE id = ?');

    tierUpdateStmt.bind([newTierCurrent, userId]);
    tierUpdateStmt.step();
    tierUpdateStmt.free();

    tierUpdateStmt.bind([newTierTarget, targetId]);
    tierUpdateStmt.step();
    tierUpdateStmt.free();

    createNotification(db, userId, 'match', '匹配成功！', `你与 ${targetUser.nickname} 成功匹配`, { matchId: match.id, userId: targetId });
    createNotification(db, targetId, 'match', '匹配成功！', `你与 ${currentUser.nickname} 成功匹配`, { matchId: match.id, userId });
  }

  saveDb();

  res.json({
    matched: !!match.mutual_liked,
    match: {
      ...match,
      user_a_liked: !!match.user_a_liked,
      user_b_liked: !!match.user_b_liked,
      mutual_liked: !!match.mutual_liked
    }
  });
});

matchRoutes.post('/pass/:userId', (req, res) => {
  const userId = getCurrentUserId(req);
  const targetId = req.params.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ success: true });
});