import { Router } from 'express';
import crypto from 'crypto';
import { query, get, all } from '../db/database.js';

export const authRoutes = Router();

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'dev-only-secret-do-not-use-in-production';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Per-user salt for password hashing (stored in DB per user)
function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function simpleHash(password, salt) {
  // Use TOKEN_SECRET as pepper + provided salt for additional security
  const pepper = (TOKEN_SECRET || 'default-pepper').substring(0, 16);
  return crypto.pbkdf2Sync(password, salt + pepper, 100000, 64, 'sha512').toString('hex');
}

function hashWithLegacySalt(password) {
  // Legacy hash for existing users (backward compatibility)
  const salt = 'soulquad-salt-2024';
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateToken(user) {
  const payload = JSON.stringify({
    id: user.id,
    username: user.username,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS
  });
  const data = Buffer.from(payload).toString('base64');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex').slice(0, 16);
  return `${data}.${signature}`;
}

export function verifyToken(token) {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex').slice(0, 16);
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64').toString());
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Auth middleware - validates token and extracts user ID
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = payload.id;
  next();
}

authRoutes.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Simple password check (basic common passwords)
  const commonPasswords = ['123456', 'password', 'qwerty', 'abc123', '111111', '12345678'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return res.status(400).json({ error: 'Password too simple, please use a stronger password' });
  }

  if (nickname.length < 1 || nickname.length > 50) {
    return res.status(400).json({ error: 'Nickname must be 1-50 characters' });
  }

  try {
    const existing = await get('SELECT id FROM users WHERE username = $1', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const id = crypto.randomUUID();
    const salt = generateSalt();
    const passwordHash = simpleHash(password, salt);
    const token = generateToken({ id, username });

    await query(
      'INSERT INTO users (id, username, password_hash, nickname, password_salt, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, username, passwordHash, nickname, salt, new Date().toISOString()]
    );

    const user = await get('SELECT * FROM users WHERE id = $1', [id]);
    delete user.password_hash;
    delete user.password_salt;

    res.json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRoutes.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let validPassword = false;

    // Check password with user's salt (new format)
    if (user.password_salt) {
      const passwordHash = simpleHash(password, user.password_salt);
      if (user.password_hash === passwordHash) {
        validPassword = true;
      } else {
        // Try legacy hash for backward compatibility
        const legacyHash = hashWithLegacySalt(password);
        if (user.password_hash === legacyHash) {
          // Upgrade to new hash on successful legacy login
          const newSalt = generateSalt();
          const newHash = simpleHash(password, newSalt);
          await query('UPDATE users SET password_hash = $1, password_salt = $2 WHERE id = $3', [newHash, newSalt, user.id]);
          validPassword = true;
        }
      }
    } else {
      // Old user without salt - use legacy hash only
      const legacyHash = hashWithLegacySalt(password);
      if (user.password_hash === legacyHash) {
        // Add salt for future logins
        const newSalt = generateSalt();
        const newHash = simpleHash(password, newSalt);
        await query('UPDATE users SET password_hash = $1, password_salt = $2 WHERE id = $3', [newHash, newSalt, user.id]);
        validPassword = true;
      }
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    delete user.password_hash;
    delete user.password_salt;

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

authRoutes.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE id = $1', [payload.id]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    delete user.password_hash;
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

authRoutes.post('/logout', async (req, res) => {
  // Client handles token removal, server just acknowledges
  res.json({ success: true, message: 'Logged out' });
});