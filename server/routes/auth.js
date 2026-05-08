import { Router } from 'express';
import crypto from 'crypto';
import { getDb, saveDb } from '../db/database.js';

export const authRoutes = Router();

const TOKEN_SECRET = 'soulquad-secret-key-2024';

function simpleHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(user) {
  const payload = JSON.stringify({ id: user.id, username: user.username, iat: Date.now() });
  const data = Buffer.from(payload).toString('base64');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex').slice(0, 16);
  return `${data}.${signature}`;
}

function verifyToken(token) {
  try {
    const [data, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex').slice(0, 16);
    if (signature !== expectedSig) return null;
    return JSON.parse(Buffer.from(data, 'base64').toString());
  } catch {
    return null;
  }
}

function getUserById(db, id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

authRoutes.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDb();
  const existingStmt = db.prepare('SELECT id FROM users WHERE username = ?');
  existingStmt.bind([username]);
  const existing = existingStmt.step() ? existingStmt.getAsObject() : null;
  existingStmt.free();

  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const id = crypto.randomUUID();
  const passwordHash = simpleHash(password);
  const token = generateToken({ id, username });

  const insertStmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, nickname, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertStmt.bind([id, username, passwordHash, nickname, new Date().toISOString()]);
  insertStmt.step();
  insertStmt.free();
  saveDb();

  const user = getUserById(db, id);
  delete user.password_hash;

  res.json({ token, user });
});

authRoutes.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);

  if (!stmt.step()) {
    stmt.free();
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = stmt.getAsObject();
  stmt.free();

  const passwordHash = simpleHash(password);
  if (user.password_hash !== passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  delete user.password_hash;

  res.json({ token, user });
});

authRoutes.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const db = getDb();
  const user = getUserById(db, payload.id);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  delete user.password_hash;
  res.json(user);
});
